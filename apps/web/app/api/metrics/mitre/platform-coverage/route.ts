import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { mitreAttackTechniques } from "@/lib/db/schema";
import { sql, count } from "drizzle-orm";

export async function GET() {
  try {
    // First, check if we have any MITRE data
    const techniqueCount = await db
      .select({ count: count() })
      .from(mitreAttackTechniques);
    const hasTechniques = (techniqueCount[0]?.count ?? 0) > 0;

    // If no MITRE data is available, return meaningful static data
    if (!hasTechniques) {
      const fallbackPlatforms = [
        { name: "Windows", techniqueCount: 542, percentage: 65 },
        { name: "Linux", techniqueCount: 289, percentage: 35 },
        { name: "macOS", techniqueCount: 267, percentage: 32 },
        { name: "Cloud", techniqueCount: 143, percentage: 17 },
        { name: "Network", techniqueCount: 89, percentage: 11 },
        { name: "Container", techniqueCount: 67, percentage: 8 },
        { name: "SaaS", techniqueCount: 45, percentage: 5 },
        { name: "Azure AD", techniqueCount: 34, percentage: 4 },
      ];

      return NextResponse.json({
        success: true,
        data: {
          id: "mitre_platform_coverage",
          title: "Platform Coverage",
          description:
            "ATT&CK technique coverage by platform (example data - run ingestion for live data)",
          type: "distribution",
          distribution: fallbackPlatforms,
          lastUpdated: new Date().toISOString(),
          source: "mitre_attack_fallback",
          metadata: {
            totalPlatforms: fallbackPlatforms.length,
            isLiveData: false,
            note: "Example data shown. Run MITRE ingestion for live data.",
          },
        },
      });
    }

    // Get platform coverage from real data
    const platformResult = await db.execute(sql`
      SELECT 
        platform_name,
        COUNT(DISTINCT technique_id) as technique_count
      FROM (
        SELECT 
          technique_id,
          jsonb_array_elements_text(platforms) as platform_name
        FROM mitre_attack_techniques 
        WHERE platforms IS NOT NULL 
          AND is_revoked = false 
          AND is_deprecated = false
      ) platform_techniques
      GROUP BY platform_name
      ORDER BY technique_count DESC
      LIMIT 15
    `);

    // Get total unique techniques for percentage calculation
    const totalResult = await db.execute(sql`
      SELECT COUNT(DISTINCT technique_id) as total
      FROM mitre_attack_techniques 
      WHERE platforms IS NOT NULL 
        AND is_revoked = false 
        AND is_deprecated = false
    `);

    const totalTechniques = Number(totalResult[0]?.total || 0);

    // Transform the data
    const distribution = Array.from(platformResult).map((row: any) => ({
      name: row.platform_name || "Unknown",
      techniqueCount: Number(row.technique_count),
      percentage:
        totalTechniques > 0
          ? Math.round((Number(row.technique_count) / totalTechniques) * 100)
          : 0,
    }));

    // Get detailed platform analysis
    const detailsResult = await db.execute(sql`
      SELECT 
        platform_name,
        COUNT(DISTINCT CASE WHEN tactics::jsonb ? 'initial-access' THEN technique_id END) as initial_access_count,
        COUNT(DISTINCT CASE WHEN tactics::jsonb ? 'execution' THEN technique_id END) as execution_count,
        COUNT(DISTINCT CASE WHEN tactics::jsonb ? 'persistence' THEN technique_id END) as persistence_count,
        COUNT(DISTINCT CASE WHEN tactics::jsonb ? 'defense-evasion' THEN technique_id END) as defense_evasion_count
      FROM (
        SELECT 
          technique_id,
          tactics,
          jsonb_array_elements_text(platforms) as platform_name
        FROM mitre_attack_techniques 
        WHERE platforms IS NOT NULL 
          AND is_revoked = false 
          AND is_deprecated = false
      ) platform_techniques
      GROUP BY platform_name
      ORDER BY COUNT(DISTINCT technique_id) DESC
      LIMIT 10
    `);

    const topPlatform = distribution.length > 0 ? distribution[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        id: "mitre_platform_coverage",
        title: "Platform Coverage",
        description: "ATT&CK technique coverage by platform",
        type: "distribution",
        value: topPlatform
          ? {
              label: topPlatform.name,
              value: topPlatform.techniqueCount,
              metadata: {
                percentage: topPlatform.percentage,
              },
            }
          : { label: "No data", value: 0 },
        distribution: distribution,
        lastUpdated: new Date().toISOString(),
        source: "mitre_attack",
        metadata: {
          totalTechniques: totalTechniques,
          totalPlatforms: distribution.length,
          isLiveData: true,
          platformDetails: Array.from(detailsResult).map((row: any) => ({
            platform: row.platform_name,
            initialAccess: Number(row.initial_access_count),
            execution: Number(row.execution_count),
            persistence: Number(row.persistence_count),
            defenseEvasion: Number(row.defense_evasion_count),
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching MITRE platform coverage:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch MITRE platform coverage",
        data: null,
      },
      { status: 500 }
    );
  }
}
