import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/connection";
import { dashboards } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// Widget configuration schema
const WidgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(["metric_card", "chart", "table", "list", "vendor_card"]),
  title: z.string(),
  description: z.string().optional(),
  dataSource: z.enum(["cisa", "nvd", "mitre"]),
  metricId: z.string().optional(),
  refreshInterval: z.number().optional(),
  settings: z.record(z.any()).optional(),
});

// Schema for creating/updating dashboards
const DashboardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  layout: z.array(
    z.object({
      i: z.string(),
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      minW: z.number().optional(),
      minH: z.number().optional(),
    })
  ),
  widgets: z.array(WidgetConfigSchema),
  settings: z.record(z.any()).optional(),
});

// GET /api/dashboards - List all dashboards
export async function GET() {
  try {
    const allDashboards = await db
      .select()
      .from(dashboards)
      .orderBy(desc(dashboards.isDefault), desc(dashboards.updatedAt));

    return NextResponse.json({
      success: true,
      data: allDashboards,
    });
  } catch (error) {
    console.error("Failed to fetch dashboards:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboards",
      },
      { status: 500 }
    );
  }
}

// POST /api/dashboards - Create new dashboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = DashboardSchema.parse(body);

    // If this is being set as default, unset other defaults
    if (validatedData.isDefault) {
      await db
        .update(dashboards)
        .set({ isDefault: false })
        .where(eq(dashboards.isDefault, true));
    }

    const [newDashboard] = await db
      .insert(dashboards)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        isDefault: validatedData.isDefault,
        layout: validatedData.layout,
        widgets: validatedData.widgets,
        settings: validatedData.settings,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newDashboard,
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

    console.error("Failed to create dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create dashboard",
      },
      { status: 500 }
    );
  }
}
