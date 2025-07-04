import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/connection";
import { cisaKev, dataIngestionLog, dataIngestionState } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// CISA KEV API Response Schema
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

type CisaKevApiData = z.infer<typeof CisaKevApiResponse>;

const CISA_KEV_API_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const BATCH_SIZE = 100;

export async function POST() {
  const startTime = new Date();
  let logId: string | null = null;

  try {
    // Create ingestion log entry
    const logEntries = await db
      .insert(dataIngestionLog)
      .values({
        source: "cisa_kev",
        status: "running",
        startedAt: startTime,
      })
      .returning({ id: dataIngestionLog.id });

    if (!logEntries[0]) {
      throw new Error("Failed to create ingestion log entry");
    }

    logId = logEntries[0].id;

    // Fetch data from CISA KEV API
    console.log("Fetching CISA KEV data from:", CISA_KEV_API_URL);
    const response = await fetch(CISA_KEV_API_URL, {
      headers: {
        "User-Agent": "CyberDash/1.0 (Security Dashboard)",
      },
    });

    if (!response.ok) {
      throw new Error(`CISA API responded with status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log("Raw data received, validating...");

    // Validate the API response
    const validatedData = CisaKevApiResponse.parse(rawData);
    console.log(
      `Validated ${validatedData.vulnerabilities.length} vulnerabilities`
    );

    let recordsProcessed = 0;
    let recordsAdded = 0;
    const recordsUpdated = 0;

    // Process vulnerabilities in batches for optimal database performance
    const vulnerabilities = validatedData.vulnerabilities;

    for (let i = 0; i < vulnerabilities.length; i += BATCH_SIZE) {
      const batch = vulnerabilities.slice(i, i + BATCH_SIZE);

      // Prepare batch records
      const batchRecords = batch.map((vuln) => {
        // Parse dates
        const dateAdded = new Date(vuln.dateAdded);
        const dueDate = vuln.dueDate ? new Date(vuln.dueDate) : null;

        // Convert knownRansomwareCampaignUse to boolean
        const knownRansomwareUse = vuln.knownRansomwareCampaignUse === "Known";

        return {
          cveID: vuln.cveID,
          vendorProject: vuln.vendorProject,
          product: vuln.product,
          vulnerabilityName: vuln.vulnerabilityName,
          dateAdded: dateAdded,
          shortDescription: vuln.shortDescription,
          requiredAction: vuln.requiredAction,
          dueDate: dueDate,
          knownRansomwareCampaignUse: knownRansomwareUse,
          notes: vuln.notes || null,
        };
      });

      try {
        // Use efficient UPSERT operation for the entire batch
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
          .returning({
            id: cisaKev.id,
            cveID: cisaKev.cveID,
          });

        recordsAdded += result.length; // All records in batch
        recordsProcessed += batch.length;

        console.log(
          `Processed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records`
        );
      } catch (error) {
        console.error(
          `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
          error
        );
        // Continue processing other batches
      }
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
        message: "CISA KEV data ingestion completed successfully",
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        catalogVersion: validatedData.catalogVersion,
        dateReleased: validatedData.dateReleased,
        totalVulnerabilities: validatedData.count,
        duration: Date.now() - startTime.getTime(),
      },
    });
  } catch (error) {
    console.error("CISA KEV ingestion failed:", error);

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
      .where(eq(dataIngestionLog.source, "cisa_kev"))
      .orderBy(sql`${dataIngestionLog.startedAt} DESC`)
      .limit(10);

    // Get current record count
    const countResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(cisaKev);

    // Get ingestion state
    const stateResult = await db
      .select()
      .from(dataIngestionState)
      .where(eq(dataIngestionState.source, "cisa_kev"))
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
    console.error("Failed to get CISA KEV ingestion status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
