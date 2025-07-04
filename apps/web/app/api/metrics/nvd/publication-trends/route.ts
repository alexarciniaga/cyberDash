import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { nvdCve } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const revalidate = 3600; // Revalidate cache every hour

export async function GET() {
  try {
    // Get CVE publication trends for the last 30 days
    const trendsResult = await db.execute(sql`
      SELECT 
        DATE(published) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN cvss_v3_base_score >= 9.0 THEN 1 END) as critical_count,
        COUNT(CASE WHEN cvss_v3_base_score >= 7.0 AND cvss_v3_base_score < 9.0 THEN 1 END) as high_count,
        COUNT(CASE WHEN cvss_v3_base_score >= 4.0 AND cvss_v3_base_score < 7.0 THEN 1 END) as medium_count,
        COUNT(CASE WHEN cvss_v3_base_score < 4.0 THEN 1 END) as low_count
      FROM nvd_cve 
      WHERE published >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(published)
      ORDER BY DATE(published) ASC
    `);

    // Transform the data for chart consumption
    const timeseries = (trendsResult as any[]).map((row) => ({
      date: row.date,
      total: Number(row.count),
      critical: Number(row.critical_count),
      high: Number(row.high_count),
      medium: Number(row.medium_count),
      low: Number(row.low_count),
    }));

    // Get summary statistics
    const summaryResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN published >= NOW() - INTERVAL '7 days' THEN 1 END) as last_week_count,
        COUNT(CASE WHEN published >= NOW() - INTERVAL '1 day' THEN 1 END) as last_day_count
      FROM nvd_cve
    `);

    const summary = summaryResult[0] as any;

    return NextResponse.json({
      success: true,
      data: {
        id: "nvd_cve_publication_trends",
        title: "CVE Publication Trends",
        description: "CVEs published over time",
        type: "timeseries",
        timeseries: timeseries,
        lastUpdated: new Date().toISOString(),
        source: "nvd_cve",
        metadata: {
          totalCVEs: Number(summary?.total_count || 0),
          lastWeekCount: Number(summary?.last_week_count || 0),
          lastDayCount: Number(summary?.last_day_count || 0),
          period: "Last 30 days",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching NVD publication trends:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch NVD publication trends",
        data: null,
      },
      { status: 500 }
    );
  }
}
