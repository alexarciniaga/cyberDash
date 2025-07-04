import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Default to last 30 days if no date range provided
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get vulnerability status distribution
    const statusResult = await db.execute(sql`
      SELECT 
        vuln_status,
        COUNT(*) as count,
        COUNT(CASE WHEN cvss_v3_base_severity = 'CRITICAL' THEN 1 END) as critical_count,
        COUNT(CASE WHEN cvss_v3_base_severity = 'HIGH' THEN 1 END) as high_count,
        AVG(CAST(cvss_v3_base_score AS NUMERIC)) as avg_score
      FROM nvd_cve 
      WHERE last_modified >= ${fromDate.toISOString()}
        AND last_modified <= ${toDate.toISOString()}
      GROUP BY vuln_status
      ORDER BY count DESC
    `);

    // Get total count for percentage calculation
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM nvd_cve 
      WHERE last_modified >= ${fromDate.toISOString()}
        AND last_modified <= ${toDate.toISOString()}
    `);

    const totalCount = Number(totalResult[0]?.total || 0);

    // Transform the data
    const distribution = Array.from(statusResult).map((row: any) => ({
      label: row.vuln_status || "Unknown",
      value: Number(row.count),
      percentage:
        totalCount > 0 ? Math.round((Number(row.count) / totalCount) * 100) : 0,
      criticalCount: Number(row.critical_count || 0),
      highCount: Number(row.high_count || 0),
      avgScore: Number(row.avg_score || 0),
    }));

    // Get recent status changes for trend analysis
    const trendResult = await db.execute(sql`
      SELECT 
        DATE_TRUNC('day', last_modified) as date,
        vuln_status,
        COUNT(*) as count
      FROM nvd_cve 
      WHERE last_modified >= ${fromDate.toISOString()}
        AND last_modified <= ${toDate.toISOString()}
      GROUP BY DATE_TRUNC('day', last_modified), vuln_status
      ORDER BY date DESC
      LIMIT 50
    `);

    // Get the most common status
    const topStatus = distribution.length > 0 ? distribution[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        id: "nvd_vuln_status_summary",
        title: "Vulnerability Status Summary",
        description: `CVE status distribution from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`,
        type: "distribution",
        value: topStatus
          ? {
              label: topStatus.label,
              value: topStatus.value,
              metadata: {
                percentage: topStatus.percentage,
                criticalInStatus: topStatus.criticalCount,
              },
            }
          : { label: "No data", value: 0 },
        distribution: distribution,
        lastUpdated: new Date().toISOString(),
        source: "nvd_cve",
        metadata: {
          totalCVEs: totalCount,
          dateRange: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
          },
          statusTypes: distribution.length,
          totalCritical: distribution.reduce(
            (sum, item) => sum + item.criticalCount,
            0
          ),
          totalHigh: distribution.reduce(
            (sum, item) => sum + item.highCount,
            0
          ),
          recentTrends: Array.from(trendResult).map((row: any) => ({
            date: row.date,
            status: row.vuln_status,
            count: Number(row.count),
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching NVD vulnerability status summary:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch NVD vulnerability status summary",
        data: null,
      },
      { status: 500 }
    );
  }
}
