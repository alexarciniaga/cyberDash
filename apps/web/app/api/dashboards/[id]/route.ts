import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/connection";
import { dashboards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Schema for updating dashboards
const UpdateDashboardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  layout: z
    .record(
      z.array(
        z.object({
          i: z.string(),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
          minW: z.number().optional(),
          minH: z.number().optional(),
        })
      )
    )
    .optional(),
  widgets: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["metric_card", "chart", "table", "list", "vendor_card"]),
        title: z.string(),
        description: z.string().optional(),
        dataSource: z.enum(["cisa", "nvd", "mitre"]),
        metricId: z.string().optional(),
        refreshInterval: z.number().optional(),
        chartType: z.enum(["line", "bar", "pie"]).optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .optional(),
  settings: z.record(z.any()).optional(),
});

// Widget configuration schema
const WidgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(["metric_card", "chart", "table", "list", "vendor_card"]),
  title: z.string(),
  description: z.string().optional(),
  dataSource: z.enum(["cisa", "nvd", "mitre"]),
  metricId: z.string().optional(),
  refreshInterval: z.number().optional(),
  chartType: z.enum(["line", "bar", "pie"]).optional(),
  settings: z.record(z.any()).optional(),
});

// GET /api/dashboards/[id] - Get specific dashboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dashboard = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (!dashboard.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Dashboard not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dashboard[0],
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard",
      },
      { status: 500 }
    );
  }
}

// PUT /api/dashboards/[id] - Update dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateDashboardSchema.parse(body);

    // Check if dashboard exists
    const existingDashboard = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (!existingDashboard.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Dashboard not found",
        },
        { status: 404 }
      );
    }

    // If this is being set as default, unset other defaults
    if (validatedData.isDefault) {
      await db
        .update(dashboards)
        .set({ isDefault: false })
        .where(eq(dashboards.isDefault, true));
    }

    const [updatedDashboard] = await db
      .update(dashboards)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(dashboards.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedDashboard,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid dashboard data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Failed to update dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update dashboard",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboards/[id] - Delete dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if dashboard exists
    const existingDashboard = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, id))
      .limit(1);

    if (!existingDashboard.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Dashboard not found",
        },
        { status: 404 }
      );
    }

    // Allow deletion of default dashboard if needed (for fixing configuration issues)
    // if (existingDashboard[0]?.isDefault) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Cannot delete default dashboard",
    //     },
    //     { status: 400 }
    //   );
    // }

    await db.delete(dashboards).where(eq(dashboards.id, id));

    return NextResponse.json({
      success: true,
      message: "Dashboard deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete dashboard",
      },
      { status: 500 }
    );
  }
}
