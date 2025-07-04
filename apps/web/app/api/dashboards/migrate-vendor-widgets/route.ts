import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { dashboards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Migration endpoint to update existing dashboards to use vendor_card widget for top vendor metrics
export async function POST() {
  try {
    let migratedCount = 0;

    // Get all dashboards
    const allDashboards = await db.select().from(dashboards);

    for (const dashboard of allDashboards) {
      let widgetsUpdated = false;
      const updatedWidgets = (dashboard.widgets as any[]).map((widget: any) => {
        // Check if this is a vendor-related widget that should be vendor_card type
        const isVendorWidget =
          (widget.metricId === "top_vendor" ||
            widget.id === "cisa-vendor-breakdown" ||
            widget.id === "cisa-top-vendor") &&
          widget.type === "metric_card";

        if (isVendorWidget) {
          widgetsUpdated = true;
          return {
            ...widget,
            type: "vendor_card",
          };
        }

        return widget;
      });

      // Update dashboard if widgets were modified
      if (widgetsUpdated) {
        await db
          .update(dashboards)
          .set({
            widgets: updatedWidgets,
            updatedAt: new Date(),
          })
          .where(eq(dashboards.id, dashboard.id));

        migratedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} dashboard(s) to use vendor_card widget type`,
      migratedCount,
    });
  } catch (error) {
    console.error("Error migrating vendor widgets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to migrate vendor widgets",
      },
      { status: 500 }
    );
  }
}
