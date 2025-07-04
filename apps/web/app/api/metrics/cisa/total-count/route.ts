import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { cisaKev } from "@/lib/db/schema";
import { count, sql } from "drizzle-orm";
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

    // Get total count of CISA KEV vulnerabilities within date range
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE date_added <= ${to.toISOString()}
    `);

    const totalCount = Number(totalResult[0]?.count || 0);

    // Get count from start of range for comparison
    const previousResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE date_added < ${from.toISOString()}
    `);

    const previousCount = Number(previousResult[0]?.count || 0);
    const change = totalCount - previousCount;
    const changePercent =
      previousCount > 0 ? (change / previousCount) * 100 : 0;

    // Get latest added vulnerability for context
    const latestResult = await db
      .select({
        dateAdded: cisaKev.dateAdded,
        cveId: cisaKev.cveID,
        vendor: cisaKev.vendorProject,
      })
      .from(cisaKev)
      .orderBy(sql`date_added DESC`)
      .limit(1);

    const latest = latestResult[0];

    return NextResponse.json({
      success: true,
      data: {
        id: "cisa_kev_total_count",
        title: "Total CISA KEV Vulnerabilities",
        description: "Known Exploited Vulnerabilities in CISA catalog",
        type: "counter",
        value: {
          label: "Total Vulnerabilities",
          value: totalCount,
          change: change,
          changePercent: Math.round(changePercent * 100) / 100,
        },
        lastUpdated: new Date().toISOString(),
        source: "cisa_kev",
        metadata: {
          latestVulnerability: latest
            ? {
                cveId: latest.cveId,
                vendor: latest.vendor,
                dateAdded: latest.dateAdded,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CISA KEV total count:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA KEV metrics",
        data: null,
      },
      { status: 500 }
    );
  }
}
