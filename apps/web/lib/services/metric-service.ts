import { getDefaultApiDateRange } from "@/lib/config";
import {
  QueryBuilder,
  DateRange as QueryBuilderDateRange,
  QueryConditions,
  CountQueryResult,
  DistributionQueryResult,
  TimeseriesQueryResult,
} from "./query-builder";
import { ResponseFormatter } from "./response-formatter";

export interface MetricQueryConditions {
  dateField?: string;
  conditions?: string;
  groupBy?: string;
  orderBy?: string;
  limit?: number;
}

export interface MetricConfig {
  id: string;
  title: string;
  description: string;
  type: "counter" | "simple-counter" | "distribution" | "timeseries";
  table: string;
  conditions?: MetricQueryConditions;
  metadata?: {
    source: string;
    [key: string]: any;
  };
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface CounterResult {
  value: number;
  change: number;
  changePercent: number;
  metadata?: any;
}

export interface DistributionItem {
  label: string;
  value: number;
  metadata?: any;
}

export interface TimeseriesPoint {
  date: string;
  value: number;
  metadata?: any;
}

/**
 * Unified Metric Service
 * Consolidates all metric API endpoints into reusable query patterns
 */
export class MetricService {
  /**
   * Execute a count query with change calculation
   * Used by: cisa/total-count, nvd/critical-count, etc.
   */
  static async executeCountQuery(
    table: string,
    conditions: MetricQueryConditions,
    dateRange: DateRange
  ): Promise<CounterResult> {
    // Convert to QueryBuilder format
    const queryConditions: QueryConditions = {
      dateField: conditions.dateField,
      conditions: conditions.conditions,
    };

    const queryBuilderDateRange: QueryBuilderDateRange = {
      from: dateRange.from,
      to: dateRange.to,
    };

    const result = await QueryBuilder.buildCountWithChangeQuery(
      table,
      queryConditions,
      queryBuilderDateRange
    );

    return {
      value: result.current,
      change: result.change,
      changePercent: result.changePercent,
      metadata: result.metadata,
    };
  }

  /**
   * Execute a simple count query without date filtering
   * Used by: mitre/technique-count, etc.
   */
  static async executeSimpleCountQuery(
    table: string,
    conditions: MetricQueryConditions
  ): Promise<CounterResult> {
    // Convert to QueryBuilder format
    const queryConditions: QueryConditions = {
      conditions: conditions.conditions,
    };

    const result = await QueryBuilder.buildSimpleCountQuery(
      table,
      queryConditions
    );

    return {
      value: result,
      change: 0,
      changePercent: 0,
      metadata: {
        note: "Simple count without date comparison",
      },
    };
  }

  /**
   * Execute a distribution query (GROUP BY with counts)
   * Used by: cisa/vendor-breakdown, cisa/product-distribution, nvd/severity-distribution, etc.
   */
  static async executeDistributionQuery(
    table: string,
    conditions: MetricQueryConditions,
    dateRange?: DateRange
  ): Promise<DistributionItem[]> {
    // Convert to QueryBuilder format
    const queryConditions: QueryConditions = {
      dateField: conditions.dateField,
      conditions: conditions.conditions,
      groupBy: conditions.groupBy,
      orderBy: conditions.orderBy,
      limit: conditions.limit,
    };

    const queryBuilderDateRange: QueryBuilderDateRange | undefined = dateRange
      ? {
          from: dateRange.from,
          to: dateRange.to,
        }
      : undefined;

    const result = await QueryBuilder.buildDistributionQuery(
      table,
      queryConditions,
      queryBuilderDateRange
    );

    return result.map((item) => ({
      label: item.label,
      value: item.value,
      metadata: item.metadata,
    }));
  }

  /**
   * Execute a timeseries query (aggregation over time intervals)
   * Used by: nvd/publication-trends, cisa/new-vulns-rate, mitre/recent-updates, etc.
   */
  static async executeTimeseriesQuery(
    table: string,
    conditions: MetricQueryConditions,
    dateRange: DateRange,
    interval: "day" | "week" | "month" = "day"
  ): Promise<TimeseriesPoint[]> {
    // Convert to QueryBuilder format
    const queryConditions: QueryConditions = {
      dateField: conditions.dateField,
      conditions: conditions.conditions,
      groupBy: conditions.groupBy,
    };

    const queryBuilderDateRange: QueryBuilderDateRange = {
      from: dateRange.from,
      to: dateRange.to,
    };

    const result = await QueryBuilder.buildTimeseriesQuery(
      table,
      queryConditions,
      queryBuilderDateRange,
      interval
    );

    return result.map((item) => ({
      date: item.timestamp,
      value: item.value,
      metadata: item.metadata,
    }));
  }

  /**
   * Parse date range parameters from request
   */
  static parseDateRange(
    searchParams: URLSearchParams,
    defaultPeriod: "week" | "month" | "quarter" = "month"
  ): DateRange {
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const defaultRange = getDefaultApiDateRange(defaultPeriod);
    const from = fromDate ? new Date(fromDate) : defaultRange.from;
    const to = toDate ? new Date(toDate) : defaultRange.to;

    return { from, to };
  }

  /**
   * Format standardized API response using ResponseFormatter
   */
  static formatResponse(
    config: MetricConfig,
    data: any,
    additionalMetadata: any = {}
  ) {
    const responseConfig = {
      id: config.id,
      title: config.title,
      description: config.description,
      source: config.metadata?.source || "unknown",
    };

    switch (config.type) {
      case "counter":
      case "simple-counter":
        return ResponseFormatter.formatCounterResponse(
          responseConfig,
          data,
          additionalMetadata
        );
      case "distribution":
        return ResponseFormatter.formatDistributionResponse(
          responseConfig,
          data,
          additionalMetadata
        );
      case "timeseries":
        return ResponseFormatter.formatTimeseriesResponse(
          responseConfig,
          data,
          "day", // default interval
          additionalMetadata
        );
      default:
        return ResponseFormatter.formatGenericResponse(
          data,
          responseConfig.source,
          additionalMetadata
        );
    }
  }

  /**
   * Format error response using ResponseFormatter
   */
  static formatError(message: string, error?: any, source: string = "unknown") {
    return ResponseFormatter.formatErrorResponse(message, error, source);
  }
}
