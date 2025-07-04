import { NextRequest, NextResponse } from "next/server";
import { IngestionService } from "@/lib/services/ingestion-service";

/**
 * Dynamic Ingestion Route
 * Handles data ingestion for all security data sources
 *
 * Supported sources:
 * - cisa-kev: CISA Known Exploited Vulnerabilities
 * - nvd-cve: NVD Common Vulnerabilities and Exposures
 * - mitre-attack: MITRE ATT&CK Framework
 */

const VALID_SOURCES = ["cisa-kev", "nvd-cve", "mitre-attack"];

/**
 * POST /api/ingestion/[source]
 * Trigger data ingestion for the specified source
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    const { source } = await params;

    // Validate source parameter
    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}`,
          data: null,
        },
        { status: 400 }
      );
    }

    // Convert kebab-case to snake_case for internal processing
    const internalSource = source.replace(/-/g, "_");

    console.log(`Starting ${source} data ingestion...`);

    // Execute ingestion using the unified service
    const result = await IngestionService.executeIngestion(internalSource);

    // Return the result (already formatted by IngestionService)
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error("Ingestion route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ingestion/[source]
 * Get ingestion status and history for the specified source
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    const { source } = await params;

    // Validate source parameter
    if (!source || !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}`,
          data: null,
        },
        { status: 400 }
      );
    }

    // Convert kebab-case to snake_case for internal processing
    const internalSource = source.replace(/-/g, "_");

    console.log(`Getting ${source} ingestion status...`);

    // Get status using the unified service
    const result = await IngestionService.getIngestionStatus(internalSource);

    // Return the result (already formatted by IngestionService)
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error("Ingestion status route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        data: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/ingestion/[source]
 * Return available methods and source information
 */
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  const sourceInfo = {
    "cisa-kev": {
      name: "CISA Known Exploited Vulnerabilities",
      description: "Vulnerabilities known to be exploited in the wild",
      apiUrl:
        "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      updateFrequency: "Daily",
      dataFormat: "JSON",
    },
    "nvd-cve": {
      name: "NVD Common Vulnerabilities and Exposures",
      description: "Comprehensive vulnerability database from NIST",
      apiUrl: "https://services.nvd.nist.gov/rest/json/cves/2.0/",
      updateFrequency: "Real-time",
      dataFormat: "JSON API",
      rateLimits: "5 requests per 30 seconds without API key",
    },
    "mitre-attack": {
      name: "MITRE ATT&CK Framework",
      description: "Adversary tactics, techniques, and procedures",
      apiUrl:
        "https://api.github.com/repos/mitre-attack/attack-stix-data/releases/latest",
      updateFrequency: "Periodic releases",
      dataFormat: "STIX 2.0 JSON",
    },
  };

  return NextResponse.json(
    {
      success: true,
      data: {
        source,
        isValid: VALID_SOURCES.includes(source),
        availableSources: VALID_SOURCES,
        sourceInfo: sourceInfo[source as keyof typeof sourceInfo] || null,
        supportedMethods: ["GET", "POST", "OPTIONS"],
        endpoints: {
          POST: `Trigger ${source} data ingestion`,
          GET: `Get ${source} ingestion status and history`,
          OPTIONS: `Get ${source} information and available methods`,
        },
      },
    },
    {
      headers: {
        Allow: "GET, POST, OPTIONS",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
