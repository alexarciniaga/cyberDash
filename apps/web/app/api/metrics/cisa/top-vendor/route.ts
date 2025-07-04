import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";
import { getDefaultApiDateRange } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // More flexible default time range - last 30 days instead of 24 hours
    // Default to last month if no date range provided (consistent with app default)
    const defaultRange = getDefaultApiDateRange("month");
    const from = fromDate ? new Date(fromDate) : defaultRange.from;
    const to = toDate ? new Date(toDate) : defaultRange.to;

    console.log(
      `Fetching top vendor data from ${from.toISOString()} to ${to.toISOString()}`
    );

    // Get the top vendor by vulnerability count within date range
    const topVendorResult = await db.execute(sql`
      SELECT 
        vendor_project,
        COUNT(*) as vulnerability_count
      FROM cisa_kev 
      WHERE date_added >= ${from.toISOString()} 
      AND date_added <= ${to.toISOString()}
      GROUP BY vendor_project 
      ORDER BY vulnerability_count DESC, vendor_project ASC
      LIMIT 1
    `);

    const topVendor = topVendorResult[0];

    // If no data in the specified range, try getting overall top vendor
    if (!topVendor) {
      console.log("No vendor data in date range, checking for any data...");

      // Check if there's any data at all in the database
      const anyVendorResult = await db.execute(sql`
        SELECT 
          vendor_project,
          COUNT(*) as vulnerability_count,
          MIN(date_added) as earliest_date,
          MAX(date_added) as latest_date
        FROM cisa_kev 
        GROUP BY vendor_project 
        ORDER BY vulnerability_count DESC, vendor_project ASC
        LIMIT 1
      `);

      const anyVendor = anyVendorResult[0];

      if (!anyVendor) {
        // No data at all in the database
        return NextResponse.json({
          success: true,
          data: {
            id: "cisa_kev_top_vendor",
            title: "Top Vendor",
            description: "Most vulnerable vendor",
            type: "counter",
            value: {
              label: "No data available",
              value: 0,
              change: 0,
              changePercent: 0,
            },
            lastUpdated: new Date().toISOString(),
            source: "cisa_kev",
            metadata: {
              message:
                "No vulnerability data found in database. Run CISA KEV ingestion to populate data.",
              suggestedAction: "ingestion_required",
            },
          },
        });
      } else {
        // Data exists but not in the requested range
        return NextResponse.json({
          success: true,
          data: {
            id: "cisa_kev_top_vendor",
            title: "Top Vendor",
            description: "Most vulnerable vendor",
            type: "counter",
            value: {
              label: anyVendor.vendor_project,
              value: Number(anyVendor.vulnerability_count),
              change: 0,
              changePercent: 0,
            },
            lastUpdated: new Date().toISOString(),
            source: "cisa_kev",
            metadata: {
              vendorName: anyVendor.vendor_project,
              vulnerabilityCount: Number(anyVendor.vulnerability_count),
              message: `No data in selected range (${from.toLocaleDateString()} - ${to.toLocaleDateString()}). Showing overall top vendor.`,
              dataRange: {
                earliest: anyVendor.earliest_date,
                latest: anyVendor.latest_date,
              },
              suggestedAction: "adjust_date_range",
            },
          },
        });
      }
    }

    // Calculate change percentage compared to previous period
    const previousPeriodDuration = to.getTime() - from.getTime();
    const previousFrom = new Date(from.getTime() - previousPeriodDuration);
    const previousTo = from;

    const previousVendorResult = await db.execute(sql`
      SELECT 
        COUNT(*) as vulnerability_count
      FROM cisa_kev 
      WHERE date_added >= ${previousFrom.toISOString()} 
      AND date_added < ${previousTo.toISOString()}
      AND vendor_project = ${topVendor.vendor_project}
    `);

    const previousCount = Number(
      previousVendorResult[0]?.vulnerability_count || 0
    );
    const currentCount = Number(topVendor.vulnerability_count);
    const change = currentCount - previousCount;
    const changePercent =
      previousCount > 0 ? (change / previousCount) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: "cisa_kev_top_vendor",
        title: "Top Vendor",
        description: "Most vulnerable vendor",
        type: "counter",
        value: {
          label: topVendor.vendor_project,
          value: currentCount,
          change: change,
          changePercent: Math.round(changePercent * 100) / 100,
        },
        lastUpdated: new Date().toISOString(),
        source: "cisa_kev",
        metadata: {
          vendorName: topVendor.vendor_project,
          vulnerabilityCount: currentCount,
          dateRange: {
            from: from.toISOString(),
            to: to.toISOString(),
          },
          comparison: {
            previousPeriod: {
              from: previousFrom.toISOString(),
              to: previousTo.toISOString(),
              count: previousCount,
            },
            change: change,
            changePercent: Math.round(changePercent * 100) / 100,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CISA KEV top vendor:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA KEV top vendor metrics",
        data: null,
      },
      { status: 500 }
    );
  }
}
