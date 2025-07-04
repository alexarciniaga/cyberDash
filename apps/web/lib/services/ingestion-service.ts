import { z } from "zod";
import { db } from "@/lib/db/connection";
import {
  cisaKev,
  nvdCve,
  mitreAttackTechniques,
  mitreAttackTactics,
  dataIngestionLog,
  dataIngestionState,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ResponseFormatter } from "./response-formatter";

// Common ingestion interfaces
export interface IngestionConfig {
  source: string;
  apiUrl: string;
  batchSize: number;
  delayBetweenRequests?: number;
  schema: z.ZodSchema;
  processor: (data: any) => Promise<IngestionResult>;
}

export interface IngestionResult {
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  metadata?: any;
}

export interface IngestionStatus {
  currentRecordCount: number;
  ingestionState: any;
  recentIngestionLogs: any[];
}

// CISA KEV Schema
const CisaKevApiResponse = z.object({
  title: z.string(),
  catalogVersion: z.string(),
  dateReleased: z.string(),
  count: z.number(),
  vulnerabilities: z.array(
    z.object({
      cveID: z.string(),
      vendorProject: z.string(),
      product: z.string(),
      vulnerabilityName: z.string(),
      dateAdded: z.string(),
      shortDescription: z.string(),
      requiredAction: z.string(),
      dueDate: z.string().optional(),
      knownRansomwareCampaignUse: z.enum(["Known", "Unknown"]),
      notes: z.string().optional(),
    })
  ),
});

// NVD CVE Schema
const NvdCveApiResponse = z.object({
  resultsPerPage: z.number(),
  startIndex: z.number(),
  totalResults: z.number(),
  format: z.string(),
  version: z.string(),
  timestamp: z.string(),
  vulnerabilities: z.array(
    z.object({
      cve: z.object({
        id: z.string(),
        sourceIdentifier: z.string().optional(),
        published: z.string(),
        lastModified: z.string(),
        vulnStatus: z.string(),
        descriptions: z
          .array(z.object({ lang: z.string(), value: z.string() }))
          .optional(),
        references: z
          .array(z.object({ url: z.string(), source: z.string().optional() }))
          .optional(),
        metrics: z
          .object({
            cvssMetricV31: z
              .array(
                z.object({
                  cvssData: z
                    .object({
                      baseScore: z.number().optional(),
                      baseSeverity: z.string().optional(),
                      vectorString: z.string().optional(),
                    })
                    .optional(),
                })
              )
              .optional(),
            cvssMetricV30: z
              .array(
                z.object({
                  cvssData: z
                    .object({
                      baseScore: z.number().optional(),
                      baseSeverity: z.string().optional(),
                      vectorString: z.string().optional(),
                    })
                    .optional(),
                })
              )
              .optional(),
            cvssMetricV2: z
              .array(
                z.object({
                  cvssData: z
                    .object({
                      baseScore: z.number().optional(),
                      baseSeverity: z.string().optional(),
                      vectorString: z.string().optional(),
                    })
                    .optional(),
                })
              )
              .optional(),
          })
          .optional(),
        weaknesses: z.array(z.any()).optional(),
        configurations: z.array(z.any()).optional(),
      }),
    })
  ),
});

// MITRE ATT&CK Schema
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

/**
 * Unified Ingestion Service
 * Handles data ingestion for all security data sources
 */
export class IngestionService {
  private static readonly USER_AGENT = "CyberDash/1.0 (Security Dashboard)";

  /**
   * Generic ingestion orchestrator
   */
  static async executeIngestion(source: string): Promise<any> {
    const startTime = new Date();
    let logId: string | null = null;

    try {
      // Create ingestion log entry
      const logEntries = await db
        .insert(dataIngestionLog)
        .values({
          source,
          status: "running",
          startedAt: startTime,
        })
        .returning({ id: dataIngestionLog.id });

      if (!logEntries[0]) {
        throw new Error("Failed to create ingestion log entry");
      }

      logId = logEntries[0].id;

      let result: IngestionResult;

      // Route to appropriate processor
      switch (source) {
        case "cisa_kev":
          result = await this.processCisaKev();
          break;
        case "nvd_cve":
          result = await this.processNvdCve();
          break;
        case "mitre_attack":
          result = await this.processMitreAttack();
          break;
        default:
          throw new Error(`Unknown ingestion source: ${source}`);
      }

      // Update ingestion log with success
      await db
        .update(dataIngestionLog)
        .set({
          status: "completed",
          recordsProcessed: result.recordsProcessed,
          recordsAdded: result.recordsAdded,
          recordsUpdated: result.recordsUpdated,
          completedAt: new Date(),
        })
        .where(eq(dataIngestionLog.id, logId));

      return ResponseFormatter.formatGenericResponse(
        {
          message: `${source} data ingestion completed successfully`,
          ...result,
          duration: Date.now() - startTime.getTime(),
        },
        source
      );
    } catch (error) {
      console.error(`${source} ingestion failed:`, error);

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

      return ResponseFormatter.formatErrorResponse(
        error instanceof Error ? error.message : "Unknown error occurred",
        error,
        source
      );
    }
  }

  /**
   * Get ingestion status for a source
   */
  static async getIngestionStatus(source: string): Promise<any> {
    try {
      // Get latest ingestion logs
      const latestLogs = await db
        .select()
        .from(dataIngestionLog)
        .where(eq(dataIngestionLog.source, source))
        .orderBy(sql`${dataIngestionLog.startedAt} DESC`)
        .limit(10);

      // Get ingestion state
      const stateResult = await db
        .select()
        .from(dataIngestionState)
        .where(eq(dataIngestionState.source, source))
        .limit(1);

      let currentRecordCount = 0;

      // Get record count based on source
      switch (source) {
        case "cisa_kev":
          const cisaCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(cisaKev);
          currentRecordCount = cisaCount[0]?.count ?? 0;
          break;
        case "nvd_cve":
          const nvdCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(nvdCve);
          currentRecordCount = nvdCount[0]?.count ?? 0;
          break;
        case "mitre_attack":
          const tacticsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(mitreAttackTactics);
          const techniquesCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(mitreAttackTechniques);
          currentRecordCount =
            (tacticsCount[0]?.count ?? 0) + (techniquesCount[0]?.count ?? 0);
          break;
      }

      const ingestionState = stateResult[0] || null;

      return ResponseFormatter.formatGenericResponse(
        {
          currentRecordCount,
          ingestionState,
          recentIngestionLogs: latestLogs,
        },
        source
      );
    } catch (error) {
      console.error(`Failed to get ${source} ingestion status:`, error);
      return ResponseFormatter.formatErrorResponse(
        error instanceof Error ? error.message : "Unknown error",
        error,
        source
      );
    }
  }

  /**
   * Process CISA KEV data
   */
  private static async processCisaKev(): Promise<IngestionResult> {
    const apiUrl =
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
    const batchSize = 100;

    console.log("Fetching CISA KEV data from:", apiUrl);
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": this.USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`CISA API responded with status: ${response.status}`);
    }

    const rawData = await response.json();
    const validatedData = CisaKevApiResponse.parse(rawData);

    console.log(
      `Validated ${validatedData.vulnerabilities.length} vulnerabilities`
    );

    let recordsProcessed = 0;
    let recordsAdded = 0;
    const recordsUpdated = 0;

    // Process vulnerabilities in batches
    const vulnerabilities = validatedData.vulnerabilities;

    for (let i = 0; i < vulnerabilities.length; i += batchSize) {
      const batch = vulnerabilities.slice(i, i + batchSize);

      const batchRecords = batch.map((vuln) => ({
        cveID: vuln.cveID,
        vendorProject: vuln.vendorProject,
        product: vuln.product,
        vulnerabilityName: vuln.vulnerabilityName,
        dateAdded: new Date(vuln.dateAdded),
        shortDescription: vuln.shortDescription,
        requiredAction: vuln.requiredAction,
        dueDate: vuln.dueDate ? new Date(vuln.dueDate) : null,
        knownRansomwareCampaignUse: vuln.knownRansomwareCampaignUse === "Known",
        notes: vuln.notes || null,
      }));

      const result = await db
        .insert(cisaKev)
        .values(batchRecords)
        .onConflictDoUpdate({
          target: cisaKev.cveID,
          set: {
            vendorProject: sql`EXCLUDED.vendor_project`,
            product: sql`EXCLUDED.product`,
            vulnerabilityName: sql`EXCLUDED.vulnerability_name`,
            dateAdded: sql`EXCLUDED.date_added`,
            shortDescription: sql`EXCLUDED.short_description`,
            requiredAction: sql`EXCLUDED.required_action`,
            dueDate: sql`EXCLUDED.due_date`,
            knownRansomwareCampaignUse: sql`EXCLUDED.known_ransomware_campaign_use`,
            notes: sql`EXCLUDED.notes`,
            updatedAt: new Date(),
          },
        })
        .returning({ id: cisaKev.id });

      recordsAdded += result.length;
      recordsProcessed += batch.length;

      console.log(
        `Processed CISA batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`
      );
    }

    // Update ingestion state
    await db
      .insert(dataIngestionState)
      .values({
        source: "cisa_kev",
        lastSuccessfulRun: new Date(),
        lastModifiedTimestamp: new Date(validatedData.dateReleased),
        lastRecordId: null,
        configurationHash: null,
      })
      .onConflictDoUpdate({
        target: dataIngestionState.source,
        set: {
          lastSuccessfulRun: new Date(),
          lastModifiedTimestamp: new Date(validatedData.dateReleased),
          updatedAt: new Date(),
        },
      });

    return {
      recordsProcessed,
      recordsAdded,
      recordsUpdated,
      metadata: {
        catalogVersion: validatedData.catalogVersion,
        dateReleased: validatedData.dateReleased,
        totalVulnerabilities: validatedData.count,
      },
    };
  }

  /**
   * Process NVD CVE data
   */
  private static async processNvdCve(): Promise<IngestionResult> {
    const baseUrl = "https://services.nvd.nist.gov/rest/json/cves/2.0/";
    const batchSize = 100;
    const delayBetweenRequests = 6000; // 6 seconds

    // Get last successful ingestion state
    const ingestionState = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "nvd_cve"))
      .limit(1);

    let lastModifiedDate: string;
    if (ingestionState.length > 0 && ingestionState[0]?.lastModifiedTimestamp) {
      lastModifiedDate = ingestionState[0].lastModifiedTimestamp.toISOString();
    } else {
      // Initial sync - last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      lastModifiedDate = thirtyDaysAgo.toISOString();
    }

    let recordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let startIndex = 0;
    let hasMoreData = true;
    let maxLastModified = new Date(lastModifiedDate);

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    while (hasMoreData) {
      const url = new URL(baseUrl);
      url.searchParams.set("resultsPerPage", "2000");
      url.searchParams.set("startIndex", startIndex.toString());
      url.searchParams.set("lastModStartDate", lastModifiedDate);
      url.searchParams.set("lastModEndDate", new Date().toISOString());

      console.log(`Fetching NVD data: ${url.toString()}`);

      if (startIndex > 0) {
        await sleep(delayBetweenRequests);
      }

      const response = await fetch(url.toString(), {
        headers: { "User-Agent": this.USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`NVD API responded with status: ${response.status}`);
      }

      const rawData = await response.json();
      const validatedData = NvdCveApiResponse.parse(rawData);

      if (validatedData.vulnerabilities.length === 0) {
        hasMoreData = false;
        break;
      }

      // Process in batches
      const vulnerabilities = validatedData.vulnerabilities;
      for (let i = 0; i < vulnerabilities.length; i += batchSize) {
        const batch = vulnerabilities.slice(i, i + batchSize);

        const batchRecords = batch.map((vuln) => {
          const published = new Date(vuln.cve.published);
          const lastModified = new Date(vuln.cve.lastModified);

          if (lastModified > maxLastModified) {
            maxLastModified = lastModified;
          }

          const cvssV3 =
            vuln.cve.metrics?.cvssMetricV31?.[0]?.cvssData ||
            vuln.cve.metrics?.cvssMetricV30?.[0]?.cvssData;
          const cvssV2 = vuln.cve.metrics?.cvssMetricV2?.[0]?.cvssData;

          return {
            cveID: vuln.cve.id,
            sourceIdentifier: vuln.cve.sourceIdentifier || null,
            published,
            lastModified,
            vulnStatus: vuln.cve.vulnStatus,
            cvssV3BaseScore: cvssV3?.baseScore?.toString() || null,
            cvssV3BaseSeverity: cvssV3?.baseSeverity || null,
            cvssV3Vector: cvssV3?.vectorString || null,
            cvssV2BaseScore: cvssV2?.baseScore?.toString() || null,
            cvssV2BaseSeverity: cvssV2?.baseSeverity || null,
            cvssV2Vector: cvssV2?.vectorString || null,
            descriptions: vuln.cve.descriptions || null,
            references: vuln.cve.references || null,
            weaknesses: vuln.cve.weaknesses || null,
            configurations: vuln.cve.configurations || null,
          };
        });

        const result = await db
          .insert(nvdCve)
          .values(batchRecords)
          .onConflictDoUpdate({
            target: nvdCve.cveID,
            set: {
              sourceIdentifier: sql`EXCLUDED.source_identifier`,
              lastModified: sql`EXCLUDED.last_modified`,
              vulnStatus: sql`EXCLUDED.vuln_status`,
              cvssV3BaseScore: sql`EXCLUDED.cvss_v3_base_score`,
              cvssV3BaseSeverity: sql`EXCLUDED.cvss_v3_base_severity`,
              cvssV3Vector: sql`EXCLUDED.cvss_v3_vector`,
              cvssV2BaseScore: sql`EXCLUDED.cvss_v2_base_score`,
              cvssV2BaseSeverity: sql`EXCLUDED.cvss_v2_base_severity`,
              cvssV2Vector: sql`EXCLUDED.cvss_v2_vector`,
              descriptions: sql`EXCLUDED.descriptions`,
              references: sql`EXCLUDED.references`,
              weaknesses: sql`EXCLUDED.weaknesses`,
              configurations: sql`EXCLUDED.configurations`,
              updatedAt: new Date(),
            },
          })
          .returning({ id: nvdCve.id });

        recordsAdded += result.length;
        recordsProcessed += batch.length;

        console.log(
          `Processed NVD batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`
        );
      }

      startIndex += validatedData.vulnerabilities.length;
      if (startIndex >= validatedData.totalResults) {
        hasMoreData = false;
      }
    }

    // Update ingestion state
    await db
      .insert(dataIngestionState)
      .values({
        source: "nvd_cve",
        lastSuccessfulRun: new Date(),
        lastModifiedTimestamp: maxLastModified,
        lastRecordId: null,
        configurationHash: null,
      })
      .onConflictDoUpdate({
        target: dataIngestionState.source,
        set: {
          lastSuccessfulRun: new Date(),
          lastModifiedTimestamp: maxLastModified,
          updatedAt: new Date(),
        },
      });

    return {
      recordsProcessed,
      recordsAdded,
      recordsUpdated,
      metadata: {
        lastModifiedTimestamp: maxLastModified.toISOString(),
      },
    };
  }

  /**
   * Process MITRE ATT&CK data
   */
  private static async processMitreAttack(): Promise<IngestionResult> {
    const githubApi =
      "https://api.github.com/repos/mitre-attack/attack-stix-data/releases/latest";
    const batchSize = 50;

    // Get latest release info
    console.log("Fetching latest MITRE ATT&CK release from GitHub...");
    const releaseResponse = await fetch(githubApi, {
      headers: { "User-Agent": this.USER_AGENT },
    });

    if (!releaseResponse.ok) {
      throw new Error(
        `GitHub API responded with status: ${releaseResponse.status}`
      );
    }

    const releaseData = GitHubReleaseSchema.parse(await releaseResponse.json());
    const releaseDate = new Date(releaseData.published_at);

    // Check if update needed
    const ingestionState = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "mitre_attack"))
      .limit(1);

    const currentState = ingestionState[0];
    if (
      currentState?.lastModifiedTimestamp &&
      releaseDate <= currentState.lastModifiedTimestamp
    ) {
      return {
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        metadata: { message: "MITRE ATT&CK data is already up to date" },
      };
    }

    // Download enterprise attack data
    const directUrl =
      "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json";
    console.log(`Downloading from: ${directUrl}`);

    const matrixResponse = await fetch(directUrl, {
      headers: { "User-Agent": this.USER_AGENT },
    });

    if (!matrixResponse.ok) {
      throw new Error(`Failed to download matrix: ${matrixResponse.status}`);
    }

    const rawMatrix = await matrixResponse.json();
    const matrixData = MitreStixBundleSchema.parse(rawMatrix);

    let recordsProcessed = 0;

    // Process tactics
    const tactics = matrixData.objects.filter(
      (obj) => obj.type === "x-mitre-tactic"
    );
    console.log(`Processing ${tactics.length} tactics...`);

    for (let i = 0; i < tactics.length; i += batchSize) {
      const batch = tactics.slice(i, i + batchSize);

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
        .filter((record) => record.tacticId);

      if (tacticRecords.length > 0) {
        await db
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
          });

        recordsProcessed += batch.length;
      }
    }

    // Process techniques
    const techniques = matrixData.objects.filter(
      (obj) => obj.type === "attack-pattern"
    );
    console.log(`Processing ${techniques.length} techniques...`);

    for (let i = 0; i < techniques.length; i += batchSize) {
      const batch = techniques.slice(i, i + batchSize);

      const techniqueRecords = batch
        .map((technique) => {
          const mitreId = technique.external_references?.find(
            (ref) => ref.source_name === "mitre-attack"
          )?.external_id;

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
            mitigations: null,
            references: technique.external_references || null,
          };
        })
        .filter((record) => record.techniqueId);

      if (techniqueRecords.length > 0) {
        await db
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
          });

        recordsProcessed += batch.length;
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

    return {
      recordsProcessed,
      recordsAdded: tactics.length + techniques.length,
      recordsUpdated: 0,
      metadata: {
        releaseVersion: releaseData.tag_name,
        releaseDate: releaseDate.toISOString(),
        tacticsProcessed: tactics.length,
        techniquesProcessed: techniques.length,
      },
    };
  }
}
