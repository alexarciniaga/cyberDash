import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/connection";
import { nvdCve, dataIngestionLog, dataIngestionState } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

// NVD CVE API Response Schema
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
          .array(
            z.object({
              lang: z.string(),
              value: z.string(),
            })
          )
          .optional(),
        references: z
          .array(
            z.object({
              url: z.string(),
              source: z.string().optional(),
              tags: z.array(z.string()).optional(),
            })
          )
          .optional(),
        metrics: z
          .object({
            cvssMetricV31: z
              .array(
                z
                  .object({
                    source: z.string().optional(),
                    type: z.string().optional(),
                    cvssData: z
                      .object({
                        version: z.string().optional(),
                        vectorString: z.string().optional(),
                        baseScore: z.number().optional(),
                        baseSeverity: z.string().optional(),
                      })
                      .optional(),
                  })
                  .optional()
              )
              .optional(),
            cvssMetricV30: z
              .array(
                z
                  .object({
                    source: z.string().optional(),
                    type: z.string().optional(),
                    cvssData: z
                      .object({
                        version: z.string().optional(),
                        vectorString: z.string().optional(),
                        baseScore: z.number().optional(),
                        baseSeverity: z.string().optional(),
                      })
                      .optional(),
                  })
                  .optional()
              )
              .optional(),
            cvssMetricV2: z
              .array(
                z
                  .object({
                    source: z.string().optional(),
                    type: z.string().optional(),
                    cvssData: z
                      .object({
                        version: z.string().optional(),
                        vectorString: z.string().optional(),
                        baseScore: z.number().optional(),
                        baseSeverity: z.string().optional(),
                      })
                      .optional(),
                  })
                  .optional()
              )
              .optional(),
          })
          .optional(),
        weaknesses: z
          .array(
            z.object({
              source: z.string().optional(),
              type: z.string().optional(),
              description: z
                .array(
                  z.object({
                    lang: z.string(),
                    value: z.string(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
        configurations: z.array(z.any()).optional(),
      }),
    })
  ),
});

type NvdCveApiData = z.infer<typeof NvdCveApiResponse>;

const NVD_CVE_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0/";
const BATCH_SIZE = 100; // NVD API supports up to 2000 results per page, but we'll use smaller batches
const DELAY_BETWEEN_REQUESTS = 6000; // 6 seconds between requests (NVD rate limit is 5 requests per 30 seconds without API key)

// Rate limiting utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST() {
  const startTime = new Date();
  let logId: string | null = null;

  try {
    // Create ingestion log entry
    const logEntries = await db
      .insert(dataIngestionLog)
      .values({
        source: "nvd_cve",
        status: "running",
        startedAt: startTime,
      })
      .returning({ id: dataIngestionLog.id });

    if (!logEntries[0]) {
      throw new Error("Failed to create ingestion log entry");
    }

    logId = logEntries[0].id;

    // Get last successful ingestion state
    const ingestionState = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "nvd_cve"))
      .limit(1);

    let lastModifiedDate: string | null = null;
    let startIndex = 0;

    if (ingestionState.length > 0 && ingestionState[0]?.lastModifiedTimestamp) {
      // Incremental update - only fetch records modified since last run
      lastModifiedDate = ingestionState[0].lastModifiedTimestamp.toISOString();
      console.log(`Performing incremental update since: ${lastModifiedDate}`);
    } else {
      // Initial full sync - fetch last 30 days to avoid overwhelming
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      lastModifiedDate = thirtyDaysAgo.toISOString();
      console.log(
        `Performing initial sync for last 30 days since: ${lastModifiedDate}`
      );
    }

    let recordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let hasMoreData = true;
    let maxLastModified = new Date(lastModifiedDate);

    while (hasMoreData) {
      // Build API URL with pagination and date filtering
      const url = new URL(NVD_CVE_API_URL);
      url.searchParams.set("resultsPerPage", "2000"); // Max per NVD API
      url.searchParams.set("startIndex", startIndex.toString());

      if (lastModifiedDate) {
        // NVD API 2.0 requires BOTH lastModStartDate AND lastModEndDate
        url.searchParams.set("lastModStartDate", lastModifiedDate);
        // Set end date to current time for incremental updates
        url.searchParams.set("lastModEndDate", new Date().toISOString());
      }

      console.log(`Fetching NVD data: ${url.toString()}`);

      // Rate limiting - respect NVD API limits
      if (startIndex > 0) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "CyberDash/1.0 (Security Dashboard)",
        },
      });

      if (!response.ok) {
        throw new Error(`NVD API responded with status: ${response.status}`);
      }

      const rawData = await response.json();

      let validatedData;
      try {
        validatedData = NvdCveApiResponse.parse(rawData);
      } catch (validationError) {
        console.error(
          "Schema validation failed for NVD response:",
          validationError
        );
        console.error(
          "Raw data sample:",
          JSON.stringify(rawData, null, 2).slice(0, 1000)
        );
        throw new Error(
          `Schema validation failed: ${validationError instanceof Error ? validationError.message : "Unknown validation error"}`
        );
      }

      console.log(
        `Received ${validatedData.vulnerabilities.length} CVEs (${startIndex}-${startIndex + validatedData.vulnerabilities.length} of ${validatedData.totalResults})`
      );

      if (validatedData.vulnerabilities.length === 0) {
        hasMoreData = false;
        break;
      }

      // Process vulnerabilities in batches for optimal database performance
      const vulnerabilities = validatedData.vulnerabilities;
      for (let i = 0; i < vulnerabilities.length; i += BATCH_SIZE) {
        const batch = vulnerabilities.slice(i, i + BATCH_SIZE);

        const batchRecords = batch.map((vuln) => {
          const published = new Date(vuln.cve.published);
          const lastModified = new Date(vuln.cve.lastModified);

          // Track the latest lastModified timestamp
          if (lastModified > maxLastModified) {
            maxLastModified = lastModified;
          }

          // Extract CVSS metrics - try V31 first, then V30, then V2
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

        // Use efficient UPSERT operation
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
          .returning({
            id: nvdCve.id,
            cveID: nvdCve.cveID,
            wasUpdated: sql<boolean>`(xmax = 0)`, // PostgreSQL way to detect if record was updated
          });

        // Count new vs updated records
        const newRecords = result.filter((r) => !r.wasUpdated).length;
        const updatedRecords = result.filter((r) => r.wasUpdated).length;

        recordsAdded += newRecords;
        recordsUpdated += updatedRecords;
        recordsProcessed += batch.length;

        console.log(
          `Processed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records (${newRecords} new, ${updatedRecords} updated)`
        );
      }

      // Update pagination
      startIndex += validatedData.vulnerabilities.length;

      // Check if we have more data
      if (startIndex >= validatedData.totalResults) {
        hasMoreData = false;
      }
    }

    // Update ingestion state with latest timestamp
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

    // Update ingestion log with success
    await db
      .update(dataIngestionLog)
      .set({
        status: "completed",
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        completedAt: new Date(),
      })
      .where(eq(dataIngestionLog.id, logId));

    return NextResponse.json({
      success: true,
      data: {
        message: "NVD CVE data ingestion completed successfully",
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        lastModifiedTimestamp: maxLastModified.toISOString(),
        duration: Date.now() - startTime.getTime(),
      },
    });
  } catch (error) {
    console.error("NVD CVE ingestion failed:", error);

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
      .where(eq(dataIngestionLog.source, "nvd_cve"))
      .orderBy(sql`${dataIngestionLog.startedAt} DESC`)
      .limit(10);

    // Get current record count
    const countResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(nvdCve);

    // Get ingestion state
    const stateResult = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "nvd_cve"))
      .limit(1);

    const currentRecordCount = countResults[0]?.count ?? 0;
    const ingestionState = stateResult[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        currentRecordCount,
        ingestionState,
        recentIngestionLogs: latestLogs,
      },
    });
  } catch (error) {
    console.error("Failed to get NVD CVE ingestion status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
