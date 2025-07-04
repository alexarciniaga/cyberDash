import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/connection";
import {
  mitreAttackTechniques,
  mitreAttackTactics,
  dataIngestionLog,
  dataIngestionState,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// MITRE ATT&CK STIX Object Schemas
const MitreStixObjectSchema = z.object({
  type: z.string(),
  id: z.string(),
  created: z.string().optional(),
  modified: z.string().optional(),
  revoked: z.boolean().optional(),
  x_mitre_version: z.string().optional(),
  x_mitre_deprecated: z.boolean().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  external_references: z
    .array(
      z.object({
        source_name: z.string(),
        external_id: z.string().optional(),
        url: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  kill_chain_phases: z
    .array(
      z.object({
        kill_chain_name: z.string(),
        phase_name: z.string(),
      })
    )
    .optional(),
  x_mitre_platforms: z.array(z.string()).optional(),
  x_mitre_data_sources: z.array(z.string()).optional(),
  x_mitre_data_components: z.array(z.string()).optional(),
  x_mitre_defenses_bypassed: z.array(z.string()).optional(),
  x_mitre_detection: z.string().optional(),
  x_mitre_is_subtechnique: z.boolean().optional(),
  x_mitre_shortname: z.string().optional(),
});

const MitreStixBundleSchema = z.object({
  type: z.literal("bundle"),
  id: z.string(),
  objects: z.array(MitreStixObjectSchema),
});

type MitreStixBundle = z.infer<typeof MitreStixBundleSchema>;
type MitreStixObject = z.infer<typeof MitreStixObjectSchema>;

// GitHub API response for releases
const GitHubReleaseSchema = z.object({
  tag_name: z.string(),
  published_at: z.string(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string(),
    })
  ),
});

const MITRE_GITHUB_API =
  "https://api.github.com/repos/mitre-attack/attack-stix-data/releases/latest";
const BATCH_SIZE = 50; // Smaller batch for complex JSON processing

export async function POST() {
  const startTime = new Date();
  let logId: string | null = null;

  try {
    // Create ingestion log entry
    const logEntries = await db
      .insert(dataIngestionLog)
      .values({
        source: "mitre_attack",
        status: "running",
        startedAt: startTime,
      })
      .returning({ id: dataIngestionLog.id });

    if (!logEntries[0]) {
      throw new Error("Failed to create ingestion log entry");
    }

    logId = logEntries[0].id;

    // Get latest release info from GitHub
    console.log("Fetching latest MITRE ATT&CK release from GitHub...");
    const releaseResponse = await fetch(MITRE_GITHUB_API, {
      headers: {
        "User-Agent": "CyberDash/1.0 (Security Dashboard)",
      },
    });

    if (!releaseResponse.ok) {
      throw new Error(
        `GitHub API responded with status: ${releaseResponse.status}`
      );
    }

    const releaseData = GitHubReleaseSchema.parse(await releaseResponse.json());
    console.log(
      `Found release: ${releaseData.tag_name} (${releaseData.published_at})`
    );

    // Check if we need to update based on release timestamp
    const ingestionState = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "mitre_attack"))
      .limit(1);

    const releaseDate = new Date(releaseData.published_at);
    const currentState = ingestionState[0];

    if (
      currentState?.lastModifiedTimestamp &&
      releaseDate <= currentState.lastModifiedTimestamp
    ) {
      console.log("MITRE ATT&CK data is already up to date");
      return NextResponse.json({
        success: true,
        data: {
          message: "MITRE ATT&CK data is already up to date",
          lastReleaseDate: releaseDate.toISOString(),
          recordsProcessed: 0,
          recordsAdded: 0,
          recordsUpdated: 0,
          duration: Date.now() - startTime.getTime(),
        },
      });
    }

    // Find the enterprise ATT&CK matrix file
    const enterpriseAsset = releaseData.assets.find(
      (asset) =>
        (asset.name.includes("enterprise-attack") ||
          asset.name.includes("enterprise_attack") ||
          asset.name === "enterprise-attack.json") &&
        asset.name.endsWith(".json")
    );

    let matrixData: MitreStixBundle;

    if (!enterpriseAsset) {
      // If we can't find the enterprise attack file in assets, try downloading directly from the repository
      console.log(
        "Enterprise attack file not found in release assets, trying direct repository access..."
      );

      // Use the raw GitHub URL to download the enterprise attack file directly
      const directUrl = `https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json`;

      console.log(`Downloading from direct URL: ${directUrl}`);
      const matrixResponse = await fetch(directUrl, {
        headers: {
          "User-Agent": "CyberDash/1.0 (Security Dashboard)",
        },
      });

      if (!matrixResponse.ok) {
        throw new Error(
          `Failed to download matrix from direct URL: ${matrixResponse.status}`
        );
      }

      const rawMatrix = await matrixResponse.json();
      matrixData = MitreStixBundleSchema.parse(rawMatrix);

      console.log(
        `Loaded ${matrixData.objects.length} STIX objects from direct repository`
      );
    } else {
      console.log(`Downloading: ${enterpriseAsset.name}`);
      const matrixResponse = await fetch(enterpriseAsset.browser_download_url, {
        headers: {
          "User-Agent": "CyberDash/1.0 (Security Dashboard)",
        },
      });

      if (!matrixResponse.ok) {
        throw new Error(`Failed to download matrix: ${matrixResponse.status}`);
      }

      const rawMatrix = await matrixResponse.json();
      matrixData = MitreStixBundleSchema.parse(rawMatrix);

      console.log(`Loaded ${matrixData.objects.length} STIX objects`);
    }

    // Continue with processing...
    let recordsProcessed = 0;
    const recordsAdded = 0;
    const recordsUpdated = 0;

    // Filter and process tactics
    const tactics = matrixData.objects.filter(
      (obj) => obj.type === "x-mitre-tactic"
    );
    console.log(`Processing ${tactics.length} tactics...`);

    for (let i = 0; i < tactics.length; i += BATCH_SIZE) {
      const batch = tactics.slice(i, i + BATCH_SIZE);

      const tacticRecords = batch
        .map((tactic) => {
          const mitreId = tactic.external_references?.find(
            (ref) => ref.source_name === "mitre-attack"
          )?.external_id;

          return {
            tacticId: mitreId || tactic.id,
            name: tactic.name || "",
            description: tactic.description || null,
            shortName: tactic.x_mitre_shortname || null,
            version: tactic.x_mitre_version || null,
            created: tactic.created ? new Date(tactic.created) : null,
            lastModified: tactic.modified ? new Date(tactic.modified) : null,
            references: tactic.external_references || null,
          };
        })
        .filter((record) => record.tacticId); // Only include records with valid tactic IDs

      if (tacticRecords.length > 0) {
        const result = await db
          .insert(mitreAttackTactics)
          .values(tacticRecords)
          .onConflictDoUpdate({
            target: mitreAttackTactics.tacticId,
            set: {
              name: sql`EXCLUDED.name`,
              description: sql`EXCLUDED.description`,
              shortName: sql`EXCLUDED.short_name`,
              version: sql`EXCLUDED.version`,
              lastModified: sql`EXCLUDED.last_modified`,
              references: sql`EXCLUDED.references`,
              updatedAt: new Date(),
            },
          })
          .returning({
            id: mitreAttackTactics.id,
            tacticId: mitreAttackTactics.tacticId,
          });

        recordsProcessed += batch.length;
        console.log(
          `Processed tactics batch ${Math.floor(i / BATCH_SIZE) + 1}: ${tacticRecords.length} records`
        );
      }
    }

    // Filter and process techniques
    const techniques = matrixData.objects.filter(
      (obj) => obj.type === "attack-pattern"
    );
    console.log(`Processing ${techniques.length} techniques...`);

    for (let i = 0; i < techniques.length; i += BATCH_SIZE) {
      const batch = techniques.slice(i, i + BATCH_SIZE);

      const techniqueRecords = batch
        .map((technique) => {
          const mitreId = technique.external_references?.find(
            (ref) => ref.source_name === "mitre-attack"
          )?.external_id;

          // Extract tactic information from kill chain phases
          const tactics =
            technique.kill_chain_phases
              ?.filter((phase) => phase.kill_chain_name === "mitre-attack")
              .map((phase) => phase.phase_name) || [];

          return {
            techniqueId: mitreId || technique.id,
            name: technique.name || "",
            description: technique.description || null,
            tactics: tactics.length > 0 ? tactics : null,
            platforms: technique.x_mitre_platforms || null,
            dataComponents: technique.x_mitre_data_components || null,
            defenses: technique.x_mitre_defenses_bypassed || null,
            detection: technique.x_mitre_detection || null,
            version: technique.x_mitre_version || null,
            created: technique.created ? new Date(technique.created) : null,
            lastModified: technique.modified
              ? new Date(technique.modified)
              : null,
            isRevoked: technique.revoked || false,
            isDeprecated: technique.x_mitre_deprecated || false,
            killChainPhases: technique.kill_chain_phases || null,
            mitigations: null, // Would need separate processing of mitigation relationships
            references: technique.external_references || null,
          };
        })
        .filter((record) => record.techniqueId); // Only include records with valid technique IDs

      if (techniqueRecords.length > 0) {
        const result = await db
          .insert(mitreAttackTechniques)
          .values(techniqueRecords)
          .onConflictDoUpdate({
            target: mitreAttackTechniques.techniqueId,
            set: {
              name: sql`EXCLUDED.name`,
              description: sql`EXCLUDED.description`,
              tactics: sql`EXCLUDED.tactics`,
              platforms: sql`EXCLUDED.platforms`,
              dataComponents: sql`EXCLUDED.data_components`,
              defenses: sql`EXCLUDED.defenses`,
              detection: sql`EXCLUDED.detection`,
              version: sql`EXCLUDED.version`,
              lastModified: sql`EXCLUDED.last_modified`,
              isRevoked: sql`EXCLUDED.is_revoked`,
              isDeprecated: sql`EXCLUDED.is_deprecated`,
              killChainPhases: sql`EXCLUDED.kill_chain_phases`,
              references: sql`EXCLUDED.references`,
              updatedAt: new Date(),
            },
          })
          .returning({
            id: mitreAttackTechniques.id,
            techniqueId: mitreAttackTechniques.techniqueId,
          });

        recordsProcessed += batch.length;
        console.log(
          `Processed techniques batch ${Math.floor(i / BATCH_SIZE) + 1}: ${techniqueRecords.length} records`
        );
      }
    }

    // Update ingestion state
    await db
      .insert(dataIngestionState)
      .values({
        source: "mitre_attack",
        lastSuccessfulRun: new Date(),
        lastModifiedTimestamp: releaseDate,
        lastRecordId: releaseData.tag_name,
        configurationHash: null,
      })
      .onConflictDoUpdate({
        target: dataIngestionState.source,
        set: {
          lastSuccessfulRun: new Date(),
          lastModifiedTimestamp: releaseDate,
          lastRecordId: releaseData.tag_name,
          updatedAt: new Date(),
        },
      });

    // Update ingestion log with success
    await db
      .update(dataIngestionLog)
      .set({
        status: "completed",
        recordsProcessed,
        recordsAdded: tactics.length + techniques.length, // Simplified for now
        recordsUpdated: 0,
        completedAt: new Date(),
      })
      .where(eq(dataIngestionLog.id, logId));

    return NextResponse.json({
      success: true,
      data: {
        message: "MITRE ATT&CK data ingestion completed successfully",
        recordsProcessed,
        recordsAdded: tactics.length + techniques.length,
        recordsUpdated: 0,
        releaseVersion: releaseData.tag_name,
        releaseDate: releaseDate.toISOString(),
        tacticsProcessed: tactics.length,
        techniquesProcessed: techniques.length,
        duration: Date.now() - startTime.getTime(),
      },
    });
  } catch (error) {
    console.error("MITRE ATT&CK ingestion failed:", error);

    // Update ingestion log with error
    if (logId) {
      await db
        .update(dataIngestionLog)
        .set({
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(dataIngestionLog.id, logId));
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: {
          duration: Date.now() - startTime.getTime(),
        },
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check ingestion status
export async function GET() {
  try {
    // Get latest ingestion logs
    const latestLogs = await db
      .select()
      .from(dataIngestionLog)
      .where(eq(dataIngestionLog.source, "mitre_attack"))
      .orderBy(sql`${dataIngestionLog.startedAt} DESC`)
      .limit(10);

    // Get current record counts
    const tacticsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(mitreAttackTactics);

    const techniquesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(mitreAttackTechniques);

    // Get ingestion state
    const stateResult = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "mitre_attack"))
      .limit(1);

    const currentTacticsCount = tacticsCount[0]?.count ?? 0;
    const currentTechniquesCount = techniquesCount[0]?.count ?? 0;
    const ingestionState = stateResult[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        currentTacticsCount,
        currentTechniquesCount,
        totalRecords: currentTacticsCount + currentTechniquesCount,
        ingestionState,
        recentIngestionLogs: latestLogs,
      },
    });
  } catch (error) {
    console.error("Failed to get MITRE ATT&CK ingestion status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
