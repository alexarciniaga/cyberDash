import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get total count of vulnerabilities with due dates
    const totalWithDueDatesResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE due_date IS NOT NULL
    `);

    const totalWithDueDates = Number(totalWithDueDatesResult[0]?.count || 0);

    // Get count of vulnerabilities approaching due date (within 7 days)
    const approachingDueResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE due_date IS NOT NULL
      AND due_date <= NOW() + INTERVAL '7 days'
      AND due_date >= NOW()
    `);

    const approachingDue = Number(approachingDueResult[0]?.count || 0);

    // Get count of overdue vulnerabilities
    const overdueResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM cisa_kev 
      WHERE due_date IS NOT NULL
      AND due_date < NOW()
    `);

    const overdue = Number(overdueResult[0]?.count || 0);

    // Calculate compliance percentage (vulnerabilities NOT at risk)
    const atRisk = approachingDue + overdue;
    const compliant = totalWithDueDates - atRisk;
    const compliancePercent =
      totalWithDueDates > 0 ? (compliant / totalWithDueDates) * 100 : 100;

    // Get breakdown by urgency
    const distribution = [
      { label: "Compliant", value: compliant },
      { label: "Due within 7 days", value: approachingDue },
      { label: "Overdue", value: overdue },
    ];

    return NextResponse.json({
      success: true,
      data: {
        id: "cisa_kev_due_date_compliance",
        title: "Due Date Compliance",
        description: "Percentage of vulnerabilities not approaching due date",
        type: "gauge",
        value: {
          label: "Compliance Rate",
          value: Math.round(compliancePercent * 100) / 100,
          change: 0, // Would need historical data for change calculation
          changePercent: 0,
        },
        distribution: distribution,
        lastUpdated: new Date().toISOString(),
        source: "cisa_kev",
        metadata: {
          totalWithDueDates,
          atRisk,
          overdue,
          approachingDue,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching CISA KEV due date compliance:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch CISA KEV due date compliance",
        data: null,
      },
      { status: 500 }
    );
  }
}
