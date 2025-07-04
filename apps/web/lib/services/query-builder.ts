import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export interface QueryConditions {
  dateField?: string;
  conditions?: string;
  groupBy?: string;
  orderBy?: string;
  limit?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface CountQueryResult {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  metadata?: any;
}

export interface DistributionQueryResult {
  label: string;
  value: number;
  percentage?: number;
  metadata?: any;
}

export interface TimeseriesQueryResult {
  timestamp: string;
  value: number;
  metadata?: any;
}

/**
 * Generic Query Builder Service
 * Provides reusable query patterns for common database operations
 */
export class QueryBuilder {
  /**
   * Build and execute a count query with change calculation
   * Compares current period count vs previous period
   */
  static async buildCountWithChangeQuery(
    table: string,
    conditions: QueryConditions,
    dateRange: DateRange
  ): Promise<CountQueryResult> {
    const { dateField = "date_added", conditions: whereClause = "" } =
      conditions;
    const baseWhere = whereClause ? `AND ${whereClause}` : "";

    // Calculate period duration for comparison
    const periodDuration = dateRange.to.getTime() - dateRange.from.getTime();
    const previousFrom = new Date(dateRange.from.getTime() - periodDuration);
    const previousTo = dateRange.from;

    // Get current period count
    const currentQuery = sql.raw(`
      SELECT COUNT(*) as count
      FROM ${table} 
      WHERE ${dateField} >= '${dateRange.from.toISOString()}'
        AND ${dateField} <= '${dateRange.to.toISOString()}'
        ${baseWhere}
    `);

    // Get previous period count for comparison
    const previousQuery = sql.raw(`
      SELECT COUNT(*) as count
      FROM ${table} 
      WHERE ${dateField} >= '${previousFrom.toISOString()}'
        AND ${dateField} < '${previousTo.toISOString()}'
        ${baseWhere}
    `);

    // Get latest record for metadata
    const latestQuery = sql.raw(`
      SELECT *
      FROM ${table} 
      WHERE ${dateField} >= '${dateRange.from.toISOString()}'
        AND ${dateField} <= '${dateRange.to.toISOString()}'
        ${baseWhere}
      ORDER BY ${dateField} DESC 
      LIMIT 1
    `);

    const [currentResult, previousResult, latestResult] = await Promise.all([
      db.execute(currentQuery),
      db.execute(previousQuery),
      db.execute(latestQuery),
    ]);

    const current = Number(currentResult[0]?.count || 0);
    const previous = Number(previousResult[0]?.count || 0);
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      metadata: {
        latest: latestResult[0] as any,
        dateRange,
        previousPeriod: { from: previousFrom, to: previousTo },
      },
    };
  }

  /**
   * Build and execute a distribution query with percentages
   * Groups data by specified field and calculates percentages
   */
  static async buildDistributionQuery(
    table: string,
    conditions: QueryConditions,
    dateRange?: DateRange
  ): Promise<DistributionQueryResult[]> {
    const {
      groupBy = "vendor_project",
      conditions: whereClause = "",
      orderBy = "COUNT(*) DESC",
      limit = 15,
      dateField = "date_added",
    } = conditions;

    // Build date range filter if provided
    const dateFilter = dateRange
      ? `AND ${dateField} >= '${dateRange.from.toISOString()}' AND ${dateField} <= '${dateRange.to.toISOString()}'`
      : "";

    const baseWhere = whereClause ? `AND ${whereClause}` : "";

    // Get total count for percentage calculation
    const totalQuery = sql.raw(`
      SELECT COUNT(*) as total
      FROM ${table} 
      WHERE 1=1 
      ${dateFilter}
      ${baseWhere}
    `);

    // Detect complex GROUP BY scenarios that cause PostgreSQL issues
    const isJsonbQuery = groupBy.includes("jsonb_array_elements_text");
    const isMultiColumnQuery = groupBy.includes(",");
    const isComplexQuery = isJsonbQuery || isMultiColumnQuery;

    // Parse ORDER BY to check if it contains fields that need to be in GROUP BY
    const orderByFields = this.extractOrderByFields(orderBy, groupBy);
    const needsAggregateFields = !orderByFields.every(
      (field) =>
        field.includes("COUNT(") ||
        field.includes("SUM(") ||
        field.includes("MAX(") ||
        field.includes("MIN(") ||
        field.includes("AVG(") ||
        groupBy.includes(field)
    );

    // Build SELECT clause based on complexity and ORDER BY requirements
    let selectClause: string;
    let finalGroupBy = groupBy;

    if (isComplexQuery || needsAggregateFields) {
      // For complex queries or when ORDER BY contains non-grouped fields,
      // use aggregate functions for all non-grouped fields
      const additionalFields = this.getAdditionalFieldsForGroupBy(
        orderBy,
        groupBy,
        dateField
      );

      selectClause = `${groupBy} as label,
        COUNT(*) as value,
        ROUND((COUNT(*) * 100.0 / (
          SELECT COUNT(*) 
          FROM ${table} 
          WHERE 1=1 ${dateFilter} ${baseWhere}
        )), 2) as percentage${additionalFields}`;
    } else {
      // Simple queries can include additional metadata fields
      selectClause = `${groupBy} as label,
        COUNT(*) as value,
        ROUND((COUNT(*) * 100.0 / (
          SELECT COUNT(*) 
          FROM ${table} 
          WHERE 1=1 ${dateFilter} ${baseWhere}
        )), 2) as percentage,
        MAX(${dateField}) as latest_date,
        MIN(${dateField}) as earliest_date`;
    }

    // Get distribution data
    const distributionQuery = sql.raw(`
      SELECT 
        ${selectClause}
      FROM ${table} 
      WHERE 1=1 
      ${dateFilter}
      ${baseWhere}
      GROUP BY ${finalGroupBy} 
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `);

    const [totalResult, distributionResult] = await Promise.all([
      db.execute(totalQuery),
      db.execute(distributionQuery),
    ]);

    const total = Number(totalResult[0]?.total || 0);

    return Array.from(distributionResult).map((row: any, index: number) => ({
      label: row.label || "Unknown",
      value: Number(row.value),
      percentage: Number(row.percentage || 0),
      metadata: {
        rank: index + 1,
        total,
        latestDate: row.latest_date || null,
        earliestDate: row.earliest_date || null,
        ...row,
      },
    }));
  }

  /**
   * Extract fields from ORDER BY clause that might need to be in GROUP BY
   */
  private static extractOrderByFields(
    orderBy: string,
    groupBy: string
  ): string[] {
    // Remove DESC/ASC and extract field names
    const fields = orderBy
      .split(",")
      .map((field) =>
        field
          .trim()
          .replace(/\s+(DESC|ASC)$/i, "")
          .trim()
      )
      .filter(
        (field) =>
          !field.includes("COUNT(") &&
          !field.includes("SUM(") &&
          !field.includes("MAX(") &&
          !field.includes("MIN(") &&
          !field.includes("AVG(")
      );

    return fields;
  }

  /**
   * Get additional aggregate fields needed for ORDER BY compatibility
   */
  private static getAdditionalFieldsForGroupBy(
    orderBy: string,
    groupBy: string,
    dateField: string
  ): string {
    const orderByFields = this.extractOrderByFields(orderBy, groupBy);
    const additionalFields: string[] = [];

    orderByFields.forEach((field) => {
      if (!groupBy.includes(field)) {
        // Use MAX for date fields, could be customized based on field type
        if (
          field.includes("date") ||
          field.includes("time") ||
          field === dateField
        ) {
          additionalFields.push(
            `MAX(${field}) as ${field.replace(/[^a-zA-Z0-9_]/g, "_")}`
          );
        } else {
          additionalFields.push(
            `MAX(${field}) as ${field.replace(/[^a-zA-Z0-9_]/g, "_")}`
          );
        }
      }
    });

    return additionalFields.length > 0
      ? ",\n        " + additionalFields.join(",\n        ")
      : "";
  }

  /**
   * Build and execute a timeseries query with aggregation
   * Aggregates data over time intervals (day, week, month)
   */
  static async buildTimeseriesQuery(
    table: string,
    conditions: QueryConditions,
    dateRange: DateRange,
    interval: "day" | "week" | "month" = "day"
  ): Promise<TimeseriesQueryResult[]> {
    const {
      dateField = "date_added",
      conditions: whereClause = "",
      groupBy = "",
    } = conditions;

    const baseWhere = whereClause ? `AND ${whereClause}` : "";
    const dateTrunc = `DATE_TRUNC('${interval}', ${dateField})`;

    const query = sql.raw(`
      SELECT 
        ${dateTrunc} as timestamp,
        COUNT(*) as value
        ${groupBy ? `, ${groupBy}` : ""}
      FROM ${table} 
      WHERE ${dateField} >= '${dateRange.from.toISOString()}' 
        AND ${dateField} <= '${dateRange.to.toISOString()}'
        ${baseWhere}
      GROUP BY ${dateTrunc}${groupBy ? `, ${groupBy}` : ""}
      ORDER BY timestamp ASC
    `);

    const result = await db.execute(query);

    return Array.from(result).map((row: any) => ({
      timestamp: row.timestamp,
      value: Number(row.value),
      metadata: {
        interval,
        dateRange,
        ...row,
      },
    }));
  }

  /**
   * Build and execute a simple count query
   * Returns total count with optional conditions
   */
  static async buildSimpleCountQuery(
    table: string,
    conditions: QueryConditions,
    dateRange?: DateRange
  ): Promise<number> {
    const { dateField = "date_added", conditions: whereClause = "" } =
      conditions;

    const dateFilter = dateRange
      ? `AND ${dateField} >= '${dateRange.from.toISOString()}' AND ${dateField} <= '${dateRange.to.toISOString()}'`
      : "";

    const baseWhere = whereClause ? `AND ${whereClause}` : "";

    const query = sql.raw(`
      SELECT COUNT(*) as count
      FROM ${table} 
      WHERE 1=1 
      ${dateFilter}
      ${baseWhere}
    `);

    const result = await db.execute(query);
    return Number(result[0]?.count || 0);
  }

  /**
   * Build and execute a top N query
   * Returns top N records based on specified criteria
   */
  static async buildTopNQuery(
    table: string,
    conditions: QueryConditions,
    dateRange?: DateRange
  ): Promise<any[]> {
    const {
      groupBy = "*",
      conditions: whereClause = "",
      orderBy = "date_added DESC",
      limit = 10,
      dateField = "date_added",
    } = conditions;

    const dateFilter = dateRange
      ? `AND ${dateField} >= '${dateRange.from.toISOString()}' AND ${dateField} <= '${dateRange.to.toISOString()}'`
      : "";

    const baseWhere = whereClause ? `AND ${whereClause}` : "";

    const query = sql.raw(`
      SELECT ${groupBy}
      FROM ${table} 
      WHERE 1=1 
      ${dateFilter}
      ${baseWhere}
      ORDER BY ${orderBy}
      LIMIT ${limit}
    `);

    const result = await db.execute(query);
    return Array.from(result);
  }

  /**
   * Execute a custom SQL query with parameter binding
   * For complex queries that don't fit standard patterns
   */
  static async executeCustomQuery(
    query: string,
    params: Record<string, any> = {}
  ): Promise<any[]> {
    // Replace named parameters in query
    let processedQuery = query;
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `:${key}`;
      const escapedValue =
        typeof value === "string"
          ? `'${value.replace(/'/g, "''")}'`
          : String(value);
      processedQuery = processedQuery.replace(
        new RegExp(placeholder, "g"),
        escapedValue
      );
    });

    const result = await db.execute(sql.raw(processedQuery));
    return Array.from(result);
  }

  /**
   * Build aggregation query with multiple metrics
   * Returns multiple aggregated values in a single query
   */
  static async buildAggregationQuery(
    table: string,
    aggregations: Array<{
      field: string;
      operation: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
      alias: string;
    }>,
    conditions: QueryConditions,
    dateRange?: DateRange
  ): Promise<Record<string, number>> {
    const { dateField = "date_added", conditions: whereClause = "" } =
      conditions;

    const dateFilter = dateRange
      ? `AND ${dateField} >= '${dateRange.from.toISOString()}' AND ${dateField} <= '${dateRange.to.toISOString()}'`
      : "";

    const baseWhere = whereClause ? `AND ${whereClause}` : "";

    const selectClause = aggregations
      .map((agg) => `${agg.operation}(${agg.field}) as ${agg.alias}`)
      .join(", ");

    const query = sql.raw(`
      SELECT ${selectClause}
      FROM ${table} 
      WHERE 1=1 
      ${dateFilter}
      ${baseWhere}
    `);

    const result = await db.execute(query);
    const row = result[0] as any;

    const aggregatedData: Record<string, number> = {};
    aggregations.forEach((agg) => {
      aggregatedData[agg.alias] = Number(row[agg.alias] || 0);
    });

    return aggregatedData;
  }
}
