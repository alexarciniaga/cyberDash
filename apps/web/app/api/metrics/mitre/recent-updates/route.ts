import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    console.log("MITRE recent-updates endpoint called");
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Default to last 90 days if no date range provided (MITRE updates less frequently)
    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    console.log("Date range:", { from: fromDate, to: toDate });

    // First, check if we have any MITRE data
    console.log("Checking for MITRE techniques in database...");
    const techniqueCount = await db
      .select({ count: count() })
      .from(mitreAttackTechniques);
    const hasTechniques = (techniqueCount[0]?.count ?? 0) > 0;
    console.log(
      "Technique count:",
      techniqueCount[0]?.count,
      "hasTechniques:",
      hasTechniques
    );

    // If no MITRE data is available, return meaningful static data
    if (!hasTechniques) {
      console.log("No MITRE data found, returning fallback data");
      const fallbackUpdates = [
        {
          id: "T1123",
          title: "Audio Capture",
          subtitle: "Updated detection methods",
          description:
            "Enhanced detection guidance for microphone access and audio recording techniques",
          metadata: {
            updateType: "Modified",
            version: "1.2",
            lastModified: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            tactics: ["collection"],
          },
        },
        {
          id: "T1059.001",
          title: "PowerShell",
          subtitle: "New mitigation added",
          description:
            "Additional PowerShell execution prevention and monitoring techniques",
          metadata: {
            updateType: "Modified",
            version: "2.1",
            lastModified: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            tactics: ["execution"],
          },
        },
        {
          id: "T1204.003",
          title: "Malicious Image",
          subtitle: "New technique added",
          description:
            "User execution through malicious container images and virtualization",
          metadata: {
            updateType: "Added",
            version: "1.0",
            lastModified: new Date(
              Date.now() - 21 * 24 * 60 * 60 * 1000
            ).toISOString(),
            tactics: ["execution", "initial-access"],
          },
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          id: "mitre_recent_updates",
          title: "Recent Framework Updates",
          description: `MITRE ATT&CK updates from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()} (example data - run ingestion for live data)`,
          type: "list",
          value: {
            label: "Recent Updates",
            value: fallbackUpdates.length,
          },
          list: fallbackUpdates,
          lastUpdated: new Date().toISOString(),
          source: "mitre_attack_fallback",
          metadata: {
            totalUpdates: fallbackUpdates.length,
            isLiveData: false,
            note: "Example data shown. Run MITRE ingestion for live data.",
          },
        },
      });
    }

    // Get recently updated techniques
    const recentUpdatesResult = await db.execute(sql`
      SELECT 
        technique_id,
        name,
        description,
        tactics,
        platforms,
        version,
        last_modified,
        created,
        is_revoked,
        is_deprecated
      FROM mitre_attack_techniques 
      WHERE (
        last_modified >= ${fromDate.toISOString()}
        OR created >= ${fromDate.toISOString()}
      )
      AND (
        last_modified <= ${toDate.toISOString()}
        OR created <= ${toDate.toISOString()}
      )
      ORDER BY 
        GREATEST(last_modified, created) DESC,
        technique_id ASC
      LIMIT 20
    `);

    // Get update statistics
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_updates,
        COUNT(CASE WHEN created >= ${fromDate.toISOString()} AND created <= ${toDate.toISOString()} THEN 1 END) as new_techniques,
        COUNT(CASE WHEN last_modified >= ${fromDate.toISOString()} AND last_modified <= ${toDate.toISOString()} AND created < ${fromDate.toISOString()} THEN 1 END) as modified_techniques,
        COUNT(CASE WHEN is_revoked = true AND last_modified >= ${fromDate.toISOString()} THEN 1 END) as revoked_techniques,
        COUNT(CASE WHEN is_deprecated = true AND last_modified >= ${fromDate.toISOString()} THEN 1 END) as deprecated_techniques
      FROM mitre_attack_techniques 
      WHERE (
        last_modified >= ${fromDate.toISOString()}
        OR created >= ${fromDate.toISOString()}
      )
      AND (
        last_modified <= ${toDate.toISOString()}
        OR created <= ${toDate.toISOString()}
      )
    `);

    const stats = statsResult[0] as any;

    // Transform the data for list display
    const recentUpdates = Array.from(recentUpdatesResult).map((row: any) => {
      const isNew = new Date(row.created) >= fromDate;
      const updateType = row.is_revoked
        ? "Revoked"
        : row.is_deprecated
          ? "Deprecated"
          : isNew
            ? "Added"
            : "Modified";

      const tactics: string[] = safeParseJsonField(row.tactics);
      const platforms: string[] = safeParseJsonField(row.platforms);

      return {
        id: row.technique_id,
        title: `${row.technique_id} - ${row.name}`,
        subtitle: `${updateType} (v${row.version || "1.0"})`,
        description:
          (row.description || "No description available").substring(0, 150) +
          ((row.description || "").length > 150 ? "..." : ""),
        metadata: {
          updateType: updateType,
          version: row.version,
          lastModified: row.last_modified,
          created: row.created,
          tactics: tactics,
          platforms: platforms,
          isRevoked: row.is_revoked,
          isDeprecated: row.is_deprecated,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: "mitre_recent_updates",
        title: "Recent Framework Updates",
        description: `MITRE ATT&CK updates from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`,
        type: "list",
        value: {
          label: "Total Updates",
          value: Number(stats?.total_updates || 0),
        },
        list: recentUpdates,
        lastUpdated: new Date().toISOString(),
        source: "mitre_attack",
        metadata: {
          totalUpdates: Number(stats?.total_updates || 0),
          newTechniques: Number(stats?.new_techniques || 0),
          modifiedTechniques: Number(stats?.modified_techniques || 0),
          revokedTechniques: Number(stats?.revoked_techniques || 0),
          deprecatedTechniques: Number(stats?.deprecated_techniques || 0),
          dateRange: {
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
          },
          isLiveData: true,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching MITRE recent updates:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch MITRE recent updates",
        data: null,
      },
      { status: 500 }
    );
  }
}
