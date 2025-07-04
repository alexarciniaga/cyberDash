import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get product breakdown with counts
    const productResult = await db.execute(sql`
      SELECT 
        product,
        COUNT(*) as vulnerability_count,
        MAX(date_added) as latest_vulnerability,
        vendor_project
      FROM cisa_kev 
      GROUP BY product, vendor_project
      ORDER BY vulnerability_count DESC, product ASC
      LIMIT 15
    `);

    const products = Array.from(productResult).map((row: any) => ({
      label: `${row.product} (${row.vendor_project})`,
      value: Number(row.vulnerability_count),
      metadata: {
        product: row.product,
        vendor: row.vendor_project,
        latestVulnerability: row.latest_vulnerability,
      },
    }));

    // Get the top product for quick display
    const topProduct = products[0];

    // Calculate total vulnerabilities across all products
    const totalVulns = products.reduce(
      (sum, product) => sum + product.value,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        id: "cisa_kev_product_distribution",
        title: "Product Vulnerability Distribution",
        description:
          "Top 15 products with most known exploited vulnerabilities",
        type: "distribution",
        value: topProduct
          ? {
              label: topProduct.metadata.product,
              value: topProduct.value,
              change: 0, // Would need historical data for change calculation
              changePercent: 0,
            }
          : {
              label: "No data",
              value: 0,
            },
        distribution: products,
        lastUpdated: new Date().toISOString(),
        source: "cisa_kev",
        metadata: {
          totalProducts: products.length,
          totalVulnerabilities: totalVulns,
          topProductShare: topProduct
            ? Math.round((topProduct.value / totalVulns) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CISA KEV product distribution:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA KEV product distribution",
        data: null,
      },
      { status: 500 }
    );
  }
}
