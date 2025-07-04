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

    // Get severity distribution for the specified time period
    const severityResult = await db.execute(sql`
      SELECT 
        cvss_v3_base_severity as severity,
        COUNT(*) as count,
        ROUND(AVG(CAST(cvss_v3_base_score AS NUMERIC)), 1) as avg_score,
        MAX(CAST(cvss_v3_base_score AS NUMERIC)) as max_score,
        MIN(CAST(cvss_v3_base_score AS NUMERIC)) as min_score
      FROM nvd_cve 
      WHERE published >= ${fromDate.toISOString()}
        AND published <= ${toDate.toISOString()}
        AND cvss_v3_base_severity IS NOT NULL
      GROUP BY cvss_v3_base_severity
      ORDER BY 
        CASE cvss_v3_base_severity
          WHEN 'CRITICAL' THEN 4
          WHEN 'HIGH' THEN 3
          WHEN 'MEDIUM' THEN 2
          WHEN 'LOW' THEN 1
          ELSE 0
        END DESC
    `);

    // Get total count for percentage calculation
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM nvd_cve 
      WHERE published >= ${fromDate.toISOString()}
        AND published <= ${toDate.toISOString()}
        AND cvss_v3_base_severity IS NOT NULL
    `);

    const totalCount = Number(totalResult[0]?.total || 0);

    // Transform the data
    const distribution = Array.from(severityResult).map((row: any) => ({
      label: row.severity || "Unknown",
      value: Number(row.count),
      percentage:
        totalCount > 0 ? Math.round((Number(row.count) / totalCount) * 100) : 0,
      avgScore: Number(row.avg_score || 0),
      maxScore: Number(row.max_score || 0),
      minScore: Number(row.min_score || 0),
    }));

    // Get the most prevalent severity
    const topSeverity = distribution.length > 0 ? distribution[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        id: "nvd_cve_severity_distribution",
        title: "CVE Severity Distribution",
        description: `Breakdown of CVE severities from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`,
        type: "distribution",
        value: topSeverity
          ? {
              label: topSeverity.label,
              value: topSeverity.value,
              metadata: {
                percentage: topSeverity.percentage,
                avgScore: topSeverity.avgScore,
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
          severityLevels: distribution.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching NVD severity distribution:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch NVD severity distribution",
        data: null,
      },
      { status: 500 }
    );
  }
}
