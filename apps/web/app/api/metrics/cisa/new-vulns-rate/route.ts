import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get vulnerabilities added in the last hour
    const lastHourResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE date_added >= NOW() - INTERVAL '1 hour'
    `);

    const lastHourCount = Number(lastHourResult[0]?.count || 0);

    // Get vulnerabilities added in the hour before that for comparison
    const previousHourResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE date_added >= NOW() - INTERVAL '2 hours'
      AND date_added < NOW() - INTERVAL '1 hour'
    `);

    const previousHourCount = Number(previousHourResult[0]?.count || 0);
    const change = lastHourCount - previousHourCount;
    const changePercent =
      previousHourCount > 0 ? (change / previousHourCount) * 100 : 0;

    // Get hourly breakdown for the last 24 hours, but if no recent data,
    // expand to last 7 days for more meaningful visualization
    let hourlyResult = await db.execute(sql`
      SELECT 
        DATE_TRUNC('hour', date_added) as hour,
        COUNT(*) as count
      FROM cisa_kev 
      WHERE date_added >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', date_added)
      ORDER BY hour ASC
      LIMIT 24
    `);

    // If no data in last 24 hours, try last 7 days with daily aggregation
    if (hourlyResult.length === 0) {
      hourlyResult = await db.execute(sql`
        SELECT 
          DATE_TRUNC('day', date_added) as hour,
          COUNT(*) as count
        FROM cisa_kev 
        WHERE date_added >= NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('day', date_added)
        ORDER BY hour ASC
        LIMIT 7
      `);
    }

    // If still no data, get last 30 days with daily aggregation
    if (hourlyResult.length === 0) {
      hourlyResult = await db.execute(sql`
        SELECT 
          DATE_TRUNC('day', date_added) as hour,
          COUNT(*) as count
        FROM cisa_kev 
        WHERE date_added >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', date_added)
        ORDER BY hour ASC
        LIMIT 30
      `);
    }

    const timeseries = Array.from(hourlyResult).map((row: any) => ({
      timestamp: row.hour,
      value: Number(row.count),
    }));

    // Determine the actual time range used based on data availability
    let actualTimeRange = "24 hours";
    let actualIntervalSize = "1 hour";

    if (hourlyResult.length === 0) {
      actualTimeRange = "No data available";
      actualIntervalSize = "N/A";
    } else {
      // Check if we're using daily aggregation (7 or 30 day fallback)
      const firstRow = hourlyResult[0] as any;
      if (firstRow && firstRow.hour) {
        const hourValue = new Date(firstRow.hour).getHours();
        // If hour is 0 and we have multiple days, likely using daily aggregation
        if (hourValue === 0 && hourlyResult.length > 1) {
          if (hourlyResult.length <= 7) {
            actualTimeRange = "7 days";
            actualIntervalSize = "1 day";
          } else {
            actualTimeRange = "30 days";
            actualIntervalSize = "1 day";
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: "cisa_kev_new_vulns_rate",
        title: "New Vulnerabilities Rate",
        description:
          timeseries.length > 0
            ? `Rate of new vulnerabilities added to KEV catalog (${actualTimeRange})`
            : "No recent vulnerability data available",
        type: "timeseries",
        value: {
          label: "Last Hour",
          value: lastHourCount,
          change: change,
          changePercent: Math.round(changePercent * 100) / 100,
        },
        timeseries: timeseries,
        lastUpdated: new Date().toISOString(),
        source: "cisa_kev",
        metadata: {
          timeRange: actualTimeRange,
          intervalSize: actualIntervalSize,
          dataPoints: timeseries.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CISA KEV new vulnerabilities rate:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA KEV new vulnerabilities rate",
        data: null,
      },
      { status: 500 }
    );
  }
}
