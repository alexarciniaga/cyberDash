import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { cisaKev } from "@/lib/db/schema";
import { sql, desc, asc, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

// Query parameter schema
const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z
    .enum(["dateAdded", "cveID", "vendor", "product"])
    .default("dateAdded"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendor: z.string().optional(),
  product: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = QuerySchema.parse(Object.fromEntries(searchParams));

    // Build the query conditions
    const conditions = [];

    if (params.dateFrom) {
      conditions.push(gte(cisaKev.dateAdded, new Date(params.dateFrom)));
    }

    if (params.dateTo) {
      conditions.push(lte(cisaKev.dateAdded, new Date(params.dateTo)));
    }

    if (params.vendor) {
      conditions.push(
        sql`${cisaKev.vendorProject} ILIKE ${"%" + params.vendor + "%"}`
      );
    }

    if (params.product) {
      conditions.push(
        sql`${cisaKev.product} ILIKE ${"%" + params.product + "%"}`
      );
    }

    if (params.search) {
      conditions.push(sql`(
        ${cisaKev.cveID} ILIKE ${"%" + params.search + "%"} OR
        ${cisaKev.vulnerabilityName} ILIKE ${"%" + params.search + "%"} OR
        ${cisaKev.shortDescription} ILIKE ${"%" + params.search + "%"} OR
        ${cisaKev.vendorProject} ILIKE ${"%" + params.search + "%"} OR
        ${cisaKev.product} ILIKE ${"%" + params.search + "%"}
      )`);
    }

    // Determine sort column
    let sortColumn;
    switch (params.sortBy) {
      case "cveID":
        sortColumn = cisaKev.cveID;
        break;
      case "vendor":
        sortColumn = cisaKev.vendorProject;
        break;
      case "product":
        sortColumn = cisaKev.product;
        break;
      default:
        sortColumn = cisaKev.dateAdded;
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cisaKev)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get the vulnerabilities
    const vulnerabilities = await db
      .select({
        id: cisaKev.id,
        cveID: cisaKev.cveID,
        vendorProject: cisaKev.vendorProject,
        product: cisaKev.product,
        vulnerabilityName: cisaKev.vulnerabilityName,
        dateAdded: cisaKev.dateAdded,
        shortDescription: cisaKev.shortDescription,
        requiredAction: cisaKev.requiredAction,
        dueDate: cisaKev.dueDate,
        knownRansomwareCampaignUse: cisaKev.knownRansomwareCampaignUse,
        notes: cisaKev.notes,
      })
      .from(cisaKev)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(params.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn))
      .limit(params.limit)
      .offset(params.offset);

    const totalPages = Math.ceil(totalCount / params.limit);
    const currentPage = Math.floor(params.offset / params.limit) + 1;

    return NextResponse.json({
      success: true,
      data: vulnerabilities,
      pagination: {
        total: totalCount,
        page: currentPage,
        limit: params.limit,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      filters: {
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        vendor: params.vendor,
        product: params.product,
        search: params.search,
      },
    });
  } catch (error) {
    console.error("Error fetching CISA vulnerabilities:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA vulnerabilities",
      },
      { status: 500 }
    );
  }
}
