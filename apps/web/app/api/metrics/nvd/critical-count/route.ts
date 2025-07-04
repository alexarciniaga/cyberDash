import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { nvdCve } from "@/lib/db/schema";
import { count, sql, gte, and } from "drizzle-orm";
import { getDefaultApiDateRange } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Default to last month if no date range provided (consistent with app default)
    const defaultRange = getDefaultApiDateRange("month");
    const from = fromDate ? new Date(fromDate) : defaultRange.from;
    const to = toDate ? new Date(toDate) : defaultRange.to;

    // Get count of critical CVEs (CVSS >= 9.0) published by end date
    const criticalResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM nvd_cve 
      WHERE cvss_v3_base_score >= 9.0 
      AND published <= ${to.toISOString()}
    `);

    const criticalCount = Number(criticalResult[0]?.count || 0);

    // Get count from start of range for comparison
    const previousResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM nvd_cve 
      WHERE cvss_v3_base_score >= 9.0 
      AND published < ${from.toISOString()}
    `);

    const previousCount = Number(previousResult[0]?.count || 0);
    const change = criticalCount - previousCount;
    const changePercent =
      previousCount > 0 ? (change / previousCount) * 100 : 0;

    // Get latest critical CVE for context
    const latestResult = await db
      .select({
        cveId: nvdCve.cveID,
        baseScore: nvdCve.cvssV3BaseScore,
        published: nvdCve.published,
      })
      .from(nvdCve)
      .where(gte(nvdCve.cvssV3BaseScore, "9.0"))
      .orderBy(sql`published DESC`)
      .limit(1);

    const latest = latestResult[0];

    return NextResponse.json({
      success: true,
      data: {
        id: "nvd_cve_critical_count",
        title: "Critical CVEs",
        description: "CVSS Score ≥ 9.0",
        type: "counter",
        value: {
          label: "Critical CVEs",
          value: criticalCount,
          change: change,
          changePercent: Math.round(changePercent * 100) / 100,
        },
        lastUpdated: new Date().toISOString(),
        source: "nvd_cve",
        metadata: {
          latestCriticalCVE: latest
            ? {
                cveId: latest.cveId,
                baseScore: latest.baseScore,
                published: latest.published,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching NVD critical count:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch NVD critical CVE metrics",
        data: null,
      },
      { status: 500 }
    );
  }
}
