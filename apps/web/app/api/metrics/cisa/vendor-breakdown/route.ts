import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { cisaKev } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    console.log("Fetching vendor breakdown data...");

    // Get vendor breakdown with counts
    const vendorResult = await db.execute(sql`
      SELECT 
        vendor_project,
        COUNT(*) as vulnerability_count,
        MAX(date_added) as latest_vulnerability,
        MIN(date_added) as earliest_vulnerability
      FROM cisa_kev 
      GROUP BY vendor_project 
      ORDER BY vulnerability_count DESC, vendor_project ASC
      LIMIT 15
    `);

    console.log(`Found ${vendorResult.length} vendors`);

    const vendors = Array.from(vendorResult).map((row: any, index: number) => ({
      id: `vendor-${index}`,
      title: row.vendor_project,
      subtitle: `${Number(row.vulnerability_count)} vulnerabilities`,
      description: `Latest: ${new Date(row.latest_vulnerability).toLocaleDateString()}`,
      value: Number(row.vulnerability_count),
      metadata: {
        rank: index + 1,
        vendorName: row.vendor_project,
        vulnerabilityCount: Number(row.vulnerability_count),
        latestVulnerability: row.latest_vulnerability,
        earliestVulnerability: row.earliest_vulnerability,
      },
    }));

    // Get the top vendor for quick display
    const topVendor = vendors[0];

    // Calculate total vulnerabilities across all vendors
    const totalVulnerabilities = vendors.reduce(
      (sum, vendor) => sum + vendor.value,
      0
    );

    if (!topVendor) {
      return NextResponse.json({
        success: true,
        data: {
          id: "cisa_kev_vendor_breakdown",
          title: "CISA KEV Vendor Breakdown",
          description: "Top vendors by vulnerability count",
          type: "distribution",
          value: {
            label: "No data available",
            value: 0,
          },
          distribution: [],
          list: [],
          lastUpdated: new Date().toISOString(),
          source: "cisa_kev",
          metadata: {
            totalVendors: 0,
            totalVulnerabilities: 0,
            message:
              "No vulnerability data found in database. Run CISA KEV ingestion to populate data.",
            suggestedAction: "ingestion_required",
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: "cisa_kev_vendor_breakdown",
        title: "CISA KEV Vendor Breakdown",
        description: "Top vendors by vulnerability count",
        type: "distribution",
        value: {
          label: topVendor.title,
          value: topVendor.value,
        },
        distribution: vendors.map((vendor) => ({
          label: vendor.title,
          value: vendor.value,
          metadata: vendor.metadata,
        })),
        list: vendors, // For list widget compatibility
        lastUpdated: new Date().toISOString(),
        source: "cisa_kev",
        metadata: {
          totalVendors: vendors.length,
          totalVulnerabilities: totalVulnerabilities,
          topVendorShare: Math.round(
            (topVendor.value / totalVulnerabilities) * 100
          ),
          coverage: `Showing top ${vendors.length} vendors`,
          isLiveData: true,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CISA KEV vendor breakdown:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA KEV vendor metrics",
        data: null,
      },
      { status: 500 }
    );
  }
}
