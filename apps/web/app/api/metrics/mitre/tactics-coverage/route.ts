import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { mitreAttackTactics, mitreAttackTechniques } from "@/lib/db/schema";
import { sql, count } from "drizzle-orm";

export async function GET() {
  try {
    // First, check if we have any MITRE data
    const [tacticCount, techniqueCount] = await Promise.all([
      db.select({ count: count() }).from(mitreAttackTactics),
      db.select({ count: count() }).from(mitreAttackTechniques),
    ]);

    const hasTactics = (tacticCount[0]?.count ?? 0) > 0;
    const hasTechniques = (techniqueCount[0]?.count ?? 0) > 0;

    // If no MITRE data is available, return meaningful static data
    if (!hasTactics || !hasTechniques) {
      const fallbackTactics = [
        {
          name: "Reconnaissance",
          techniqueCount: 10,
          shortName: "reconnaissance",
        },
        {
          name: "Initial Access",
          techniqueCount: 9,
          shortName: "initial-access",
        },
        { name: "Execution", techniqueCount: 12, shortName: "execution" },
        { name: "Persistence", techniqueCount: 19, shortName: "persistence" },
        {
          name: "Privilege Escalation",
          techniqueCount: 13,
          shortName: "privilege-escalation",
        },
        {
          name: "Defense Evasion",
          techniqueCount: 42,
          shortName: "defense-evasion",
        },
        {
          name: "Credential Access",
          techniqueCount: 15,
          shortName: "credential-access",
        },
        { name: "Discovery", techniqueCount: 29, shortName: "discovery" },
        {
          name: "Lateral Movement",
          techniqueCount: 9,
          shortName: "lateral-movement",
        },
        { name: "Collection", techniqueCount: 17, shortName: "collection" },
        {
          name: "Command and Control",
          techniqueCount: 16,
          shortName: "command-and-control",
        },
        { name: "Exfiltration", techniqueCount: 9, shortName: "exfiltration" },
        { name: "Impact", techniqueCount: 13, shortName: "impact" },
      ];

      return NextResponse.json({
        success: true,
        data: {
          id: "mitre_attack_tactics_coverage",
          title: "MITRE Tactics",
          description:
            "ATT&CK tactics and technique counts (example data - run ingestion for live data)",
          type: "distribution",
          distribution: fallbackTactics,
          lastUpdated: new Date().toISOString(),
          source: "mitre_attack_fallback",
          metadata: {
            totalTactics: fallbackTactics.length,
            tacticsWithTechniques: fallbackTactics.length,
            coveragePercentage: 100,
            isLiveData: false,
            note: "Example data shown. Run MITRE ingestion for live data.",
          },
        },
      });
    }

    // Get tactics with technique counts using corrected join
    const tacticsResult = await db.execute(sql`
      SELECT 
        t.tactic_id,
        t.name,
        t.short_name,
        t.description,
        COUNT(DISTINCT tech.id) as technique_count
      FROM mitre_attack_tactics t
      LEFT JOIN mitre_attack_techniques tech ON 
        tech.tactics::jsonb ? t.short_name
        AND tech.is_revoked = false 
        AND tech.is_deprecated = false
      GROUP BY t.tactic_id, t.name, t.short_name, t.description
      ORDER BY technique_count DESC, t.name ASC
    `);

    // Transform the data for table consumption
    const distribution = (tacticsResult as any[]).map((row) => ({
      tacticId: row.tactic_id,
      name: row.name,
      shortName: row.short_name,
      description: row.description,
      techniqueCount: Number(row.technique_count),
    }));

    // Get summary statistics
    const summaryResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_tactics,
        SUM(CASE WHEN technique_count > 0 THEN 1 ELSE 0 END) as tactics_with_techniques,
        SUM(technique_count) as total_techniques
      FROM (
        SELECT 
          t.tactic_id,
          COUNT(DISTINCT tech.id) as technique_count
        FROM mitre_attack_tactics t
        LEFT JOIN mitre_attack_techniques tech ON 
          tech.tactics::jsonb ? t.short_name
          AND tech.is_revoked = false 
          AND tech.is_deprecated = false
        GROUP BY t.tactic_id
      ) subquery
    `);

    const summary = summaryResult[0] as any;

    return NextResponse.json({
      success: true,
      data: {
        id: "mitre_attack_tactics_coverage",
        title: "MITRE Tactics",
        description: "ATT&CK tactics and technique counts",
        type: "distribution",
        distribution: distribution,
        lastUpdated: new Date().toISOString(),
        source: "mitre_attack",
        metadata: {
          totalTactics: Number(summary?.total_tactics || 0),
          tacticsWithTechniques: Number(summary?.tactics_with_techniques || 0),
          totalTechniques: Number(summary?.total_techniques || 0),
          coveragePercentage:
            summary?.total_tactics > 0
              ? Math.round(
                  (Number(summary.tactics_with_techniques) /
                    Number(summary.total_tactics)) *
                    100
                )
              : 0,
          isLiveData: true,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching MITRE tactics coverage:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch MITRE tactics coverage",
        data: null,
      },
      { status: 500 }
    );
  }
}
