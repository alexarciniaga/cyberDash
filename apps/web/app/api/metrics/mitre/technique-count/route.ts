import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { mitreAttackTechniques } from "@/lib/db/schema";
import { count, sql, eq, and } from "drizzle-orm";
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

    // Get total count of active techniques (not revoked or deprecated) as of end date
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM mitre_attack_techniques 
      WHERE is_revoked = false 
      AND is_deprecated = false
      AND created_at <= ${to.toISOString()}
    `);

    const totalCount = Number(totalResult[0]?.count || 0);

    // Get count from start of range for comparison
    const previousResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM mitre_attack_techniques 
      WHERE is_revoked = false 
      AND is_deprecated = false
      AND created_at < ${from.toISOString()}
    `);

    const previousCount = Number(previousResult[0]?.count || 0);
    const change = totalCount - previousCount;
    const changePercent =
      previousCount > 0 ? (change / previousCount) * 100 : 0;

    // Get latest added technique for context
    const latestResult = await db
      .select({
        techniqueId: mitreAttackTechniques.techniqueId,
        name: mitreAttackTechniques.name,
        lastModified: mitreAttackTechniques.lastModified,
      })
      .from(mitreAttackTechniques)
      .where(
        and(
          eq(mitreAttackTechniques.isRevoked, false),
          eq(mitreAttackTechniques.isDeprecated, false)
        )
      )
      .orderBy(sql`created_at DESC`)
      .limit(1);

    const latest = latestResult[0];

    return NextResponse.json({
      success: true,
      data: {
        id: "mitre_attack_technique_count",
        title: "ATT&CK Techniques",
        description: "Total in framework",
        type: "counter",
        value: {
          label: "Total Techniques",
          value: totalCount,
          change: change,
          changePercent: Math.round(changePercent * 100) / 100,
        },
        lastUpdated: new Date().toISOString(),
        source: "mitre_attack",
        metadata: {
          latestTechnique: latest
            ? {
                techniqueId: latest.techniqueId,
                name: latest.name,
                lastModified: latest.lastModified,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching MITRE technique count:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch MITRE ATT&CK technique metrics",
        data: null,
      },
      { status: 500 }
    );
  }
}
