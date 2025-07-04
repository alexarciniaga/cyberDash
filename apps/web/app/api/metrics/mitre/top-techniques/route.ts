import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { mitreAttackTechniques } from "@/lib/db/schema";
import { sql, count } from "drizzle-orm";

// Helper function to safely parse JSON data from database
function safeParseJsonField(value: any): string[] {
  if (!value) return [];

  // If it's already an array, return it
  if (Array.isArray(value)) return value;

  // If it's a string, try to parse it as JSON
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      // If it's a comma-separated string, split it
      if (typeof parsed === "string") {
        return parsed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch (error) {
      // If JSON parsing fails, treat as comma-separated string
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export async function GET() {
  try {
    // First, check if we have any MITRE data
    const techniqueCount = await db
      .select({ count: count() })
      .from(mitreAttackTechniques);
    const hasTechniques = (techniqueCount[0]?.count ?? 0) > 0;

    // If no MITRE data is available, return meaningful static data
    if (!hasTechniques) {
      const fallbackTechniques = [
        {
          id: "T1059",
          title: "Command and Scripting Interpreter",
          subtitle: "9 tactics • 8 platforms",
          description:
            "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries",
          metadata: {
            tacticCount: 9,
            platformCount: 8,
            tactics: ["execution", "defense-evasion", "persistence"],
            platforms: ["Windows", "Linux", "macOS", "Cloud"],
          },
        },
        {
          id: "T1055",
          title: "Process Injection",
          subtitle: "7 tactics • 6 platforms",
          description:
            "Adversaries may inject code into processes in order to evade process-based defenses",
          metadata: {
            tacticCount: 7,
            platformCount: 6,
            tactics: ["defense-evasion", "privilege-escalation", "persistence"],
            platforms: ["Windows", "Linux", "macOS"],
          },
        },
        {
          id: "T1105",
          title: "Ingress Tool Transfer",
          subtitle: "6 tactics • 7 platforms",
          description:
            "Adversaries may transfer tools or other files from an external system into a compromised environment",
          metadata: {
            tacticCount: 6,
            platformCount: 7,
            tactics: ["command-and-control", "lateral-movement"],
            platforms: ["Windows", "Linux", "macOS", "Cloud", "Network"],
          },
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          id: "mitre_top_techniques",
          title: "Most Versatile Techniques",
          description:
            "Techniques spanning multiple tactics and platforms (example data - run ingestion for live data)",
          type: "list",
          value: {
            label: "Multi-Tactic Techniques",
            value: fallbackTechniques.length,
          },
          list: fallbackTechniques,
          lastUpdated: new Date().toISOString(),
          source: "mitre_attack_fallback",
          metadata: {
            totalTechniques: fallbackTechniques.length,
            isLiveData: false,
            note: "Example data shown. Run MITRE ingestion for live data.",
          },
        },
      });
    }

    // Get techniques with the most tactic coverage (most versatile)
    const topTechniquesResult = await db.execute(sql`
      SELECT 
        technique_id,
        name,
        description,
        tactics,
        platforms,
        jsonb_array_length(COALESCE(tactics, '[]'::jsonb)) as tactic_count,
        jsonb_array_length(COALESCE(platforms, '[]'::jsonb)) as platform_count,
        version,
        is_revoked,
        is_deprecated
      FROM mitre_attack_techniques 
      WHERE tactics IS NOT NULL 
        AND platforms IS NOT NULL
        AND is_revoked = false 
        AND is_deprecated = false
        AND jsonb_array_length(tactics) > 1
      ORDER BY 
        jsonb_array_length(tactics) DESC,
        jsonb_array_length(platforms) DESC,
        technique_id ASC
      LIMIT 15
    `);

    // Get distribution statistics
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_multi_tactic,
        AVG(jsonb_array_length(COALESCE(tactics, '[]'::jsonb))) as avg_tactic_count,
        MAX(jsonb_array_length(COALESCE(tactics, '[]'::jsonb))) as max_tactic_count,
        AVG(jsonb_array_length(COALESCE(platforms, '[]'::jsonb))) as avg_platform_count
      FROM mitre_attack_techniques 
      WHERE tactics IS NOT NULL 
        AND platforms IS NOT NULL
        AND is_revoked = false 
        AND is_deprecated = false
        AND jsonb_array_length(tactics) > 1
    `);

    const stats = statsResult[0] as any;

    // Get tactic popularity
    const tacticPopularityResult = await db.execute(sql`
      SELECT 
        tactic_name,
        COUNT(*) as technique_count
      FROM (
        SELECT 
          technique_id,
          jsonb_array_elements_text(tactics) as tactic_name
        FROM mitre_attack_techniques 
        WHERE tactics IS NOT NULL 
          AND is_revoked = false 
          AND is_deprecated = false
      ) tactic_techniques
      GROUP BY tactic_name
      ORDER BY technique_count DESC
      LIMIT 10
    `);

    // Transform the data for list display
    const topTechniques = Array.from(topTechniquesResult).map((row: any) => {
      const tactics: string[] = safeParseJsonField(row.tactics);
      const platforms: string[] = safeParseJsonField(row.platforms);

      return {
        id: row.technique_id,
        title: `${row.technique_id} - ${row.name}`,
        subtitle: `${row.tactic_count} tactics • ${row.platform_count} platforms`,
        description:
          (row.description || "No description available").substring(0, 150) +
          ((row.description || "").length > 150 ? "..." : ""),
        metadata: {
          tacticCount: Number(row.tactic_count),
          platformCount: Number(row.platform_count),
          tactics: tactics,
          platforms: platforms,
          version: row.version,
          versatilityScore:
            Number(row.tactic_count) * Number(row.platform_count),
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: "mitre_top_techniques",
        title: "Most Versatile Techniques",
        description: "Techniques spanning multiple tactics and platforms",
        type: "list",
        value: {
          label: "Multi-Tactic Techniques",
          value: Number(stats?.total_multi_tactic || 0),
        },
        list: topTechniques,
        lastUpdated: new Date().toISOString(),
        source: "mitre_attack",
        metadata: {
          totalMultiTacticTechniques: Number(stats?.total_multi_tactic || 0),
          avgTacticCount: Number(stats?.avg_tactic_count || 0),
          maxTacticCount: Number(stats?.max_tactic_count || 0),
          avgPlatformCount: Number(stats?.avg_platform_count || 0),
          tacticPopularity: Array.from(tacticPopularityResult).map(
            (row: any) => ({
              tactic: row.tactic_name,
              techniqueCount: Number(row.technique_count),
            })
          ),
          isLiveData: true,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching MITRE top techniques:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch MITRE top techniques",
        data: null,
      },
      { status: 500 }
    );
  }
}
