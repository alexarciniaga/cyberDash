import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { testConnection, checkTablesExist } from "@/lib/db/utils";

export async function GET() {
  try {
    // Test basic database connectivity
    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          data: {
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            database: "disconnected",
          },
        },
        { status: 503 }
      );
    }

    // Check if all required tables exist
    const tablesExist = await checkTablesExist();
    const allTablesExist = Object.values(tablesExist).every((exists) => exists);

    return NextResponse.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        tables: tablesExist,
        schema_ready: allTablesExist,
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Health check failed",
        data: {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          database: "error",
        },
      },
      { status: 503 }
    );
  }
}
