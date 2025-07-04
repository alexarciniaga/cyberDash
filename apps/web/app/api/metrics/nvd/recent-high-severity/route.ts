import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Default to last 7 days if no date range provided
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get recent high-severity CVEs (CRITICAL and HIGH)
    const recentHighSevResult = await db.execute(sql`
      SELECT 
        cve_id,
        cvss_v3_base_score,
        cvss_v3_base_severity,
        published,
        vuln_status,
        descriptions
      FROM nvd_cve 
      WHERE published >= ${fromDate.toISOString()}
        AND published <= ${toDate.toISOString()}
        AND cvss_v3_base_severity IN ('CRITICAL', 'HIGH')
      ORDER BY published DESC, cvss_v3_base_score DESC
      LIMIT 20
    `);

    // Get count of high-severity CVEs
    const countResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_high_sev,
        COUNT(CASE WHEN cvss_v3_base_severity = 'CRITICAL' THEN 1 END) as critical_count,
        COUNT(CASE WHEN cvss_v3_base_severity = 'HIGH' THEN 1 END) as high_count,
        AVG(CAST(cvss_v3_base_score AS NUMERIC)) as avg_score
      FROM nvd_cve 
      WHERE published >= ${fromDate.toISOString()}
        AND published <= ${toDate.toISOString()}
        AND cvss_v3_base_severity IN ('CRITICAL', 'HIGH')
    `);

    const counts = countResult[0] as any;

    // Transform the data for list display
    const recentCVEs = Array.from(recentHighSevResult).map((row: any) => {
      let descriptions = [];
      try {
        // Handle different possible formats of descriptions
        if (row.descriptions) {
          if (typeof row.descriptions === "string") {
            descriptions = JSON.parse(row.descriptions);
          } else if (Array.isArray(row.descriptions)) {
            descriptions = row.descriptions;
          } else {
            descriptions = [];
          }
        }
      } catch (error) {
        console.error(`Failed to parse descriptions for ${row.cve_id}:`, error);
        descriptions = [];
      }

      const englishDesc =
        descriptions.find((desc: any) => desc.lang === "en")?.value ||
        "No description available";

      return {
        id: row.cve_id,
        title: row.cve_id,
        subtitle: `${row.cvss_v3_base_severity} (${row.cvss_v3_base_score})`,
        description:
          englishDesc.substring(0, 150) +
          (englishDesc.length > 150 ? "..." : ""),
        metadata: {
          severity: row.cvss_v3_base_severity,
          score: Number(row.cvss_v3_base_score || 0),
          published: row.published,
          status: row.vuln_status,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: "nvd_recent_high_severity",
        title: "Recent High-Severity CVEs",
        description: `High and Critical CVEs published from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`,
        type: "list",
        value: {
          label: "High-Severity CVEs",
          value: Number(counts?.total_high_sev || 0),
        },
        list: recentCVEs,
        lastUpdated: new Date().toISOString(),
        source: "nvd_cve",
        metadata: {
          totalHighSeverity: Number(counts?.total_high_sev || 0),
          criticalCount: Number(counts?.critical_count || 0),
          highCount: Number(counts?.high_count || 0),
          avgScore: Number(counts?.avg_score || 0),
          dateRange: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching recent high-severity CVEs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recent high-severity CVEs",
        data: null,
      },
      { status: 500 }
    );
  }
}
