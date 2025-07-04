import { db } from "./connection";
import { sql } from "drizzle-orm";

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const result = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        COALESCE(n_tup_ins, 0) AS inserts,
        COALESCE(n_tup_upd, 0) AS updates,
        COALESCE(n_tup_del, 0) AS deletes,
        COALESCE(n_live_tup, 0) AS live_tuples,
        COALESCE(n_dead_tup, 0) AS dead_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    return Array.from(result);
  } catch (error) {
    console.error("Failed to get database stats:", error);
    return [];
  }
}

/**
 * Check if tables exist
 */
export async function checkTablesExist(): Promise<Record<string, boolean>> {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);

    const existingTables = new Set(
      Array.from(result).map((row: any) => row.table_name)
    );

    return {
      cisa_kev: existingTables.has("cisa_kev"),
      nvd_cve: existingTables.has("nvd_cve"),
      mitre_attack_tactics: existingTables.has("mitre_attack_tactics"),
      mitre_attack_techniques: existingTables.has("mitre_attack_techniques"),
      data_ingestion_log: existingTables.has("data_ingestion_log"),
      data_ingestion_state: existingTables.has("data_ingestion_state"),
      dashboards: existingTables.has("dashboards"),
    };
  } catch (error) {
    console.error("Failed to check tables:", error);
    return {
      cisa_kev: false,
      nvd_cve: false,
      mitre_attack_tactics: false,
      mitre_attack_techniques: false,
      data_ingestion_log: false,
      data_ingestion_state: false,
      dashboards: false,
    };
  }
}

/**
 * Initialize database with basic data (if needed)
 */
export async function initializeDatabase() {
  try {
    const tablesExist = await checkTablesExist();
    const allTablesExist = Object.values(tablesExist).every((exists) => exists);

    if (!allTablesExist) {
      console.log("Some tables missing, schema might need to be pushed");
      return false;
    }

    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}
