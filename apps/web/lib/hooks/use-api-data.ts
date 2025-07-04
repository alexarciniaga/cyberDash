import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useMemo } from "react";

// Generic API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: any;
}

// Generic API data fetching options
interface UseApiDataOptions<T = any>
  extends Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> {
  endpoint: string;
  queryKey: (string | number | boolean)[];
  params?: Record<string, string | number | boolean>;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Generic API data fetching hook
 * Consolidates metric data and vulnerability data fetching patterns
 */
export function useApiData<T = any>({
  endpoint,
  queryKey,
  params = {},
  enabled = true,
  refetchInterval = 60000, // 1 minute default
  ...queryOptions
}: UseApiDataOptions<T>) {
  // Build URL with query parameters
  const url = useMemo(() => {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    return url.toString();
  }, [endpoint, params]);

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch data");
      }

      return result.data;
    },
    enabled,
    refetchInterval,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}

/**
 * Hook for fetching metric data
 * Replaces use-metric-data.ts
 */
export function useMetricData(dataSource: string, metricId: string) {
  return useApiData({
    endpoint: `/api/metrics/${dataSource}/${metricId}`,
    queryKey: ["metric", dataSource, metricId],
    enabled: !!metricId && !!dataSource,
    refetchInterval: 60000,
  });
}

/**
 * Hook for fetching vulnerability data
 * Replaces use-vulnerability-data.ts with simplified approach
 */
export function useVulnerabilityData(
  dataSource: "cisa" | "nvd" | "mitre",
  options: {
    enabled?: boolean;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const {
    enabled = true,
    dateFrom,
    dateTo,
    limit = 50,
    sortBy = "dateAdded",
    sortOrder = "desc",
  } = options;

  const params = useMemo(() => {
    const p: Record<string, string | number> = {
      limit: Math.min(limit, 100),
      sortBy,
      sortOrder,
    };

    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;

    return p;
  }, [dateFrom, dateTo, limit, sortBy, sortOrder]);

  return useApiData({
    endpoint: `/api/vulnerabilities/${dataSource}`,
    queryKey: ["vulnerabilities", dataSource, JSON.stringify(params)],
    params,
    enabled: !!dataSource && enabled,
    refetchInterval: 300000, // 5 minutes for vulnerability data
  });
}

/**
 * Hook for fetching vulnerabilities on a specific date
 * Simplified version without complex caching
 */
export function useVulnerabilityDataForDate(
  date: string | null,
  dataSource: "cisa" | "nvd" | "mitre" = "cisa",
  enabled: boolean = true
) {
  // Use date as both from and to for exact date matching
  const dateString = date
    ? new Date(date).toISOString().split("T")[0]
    : undefined;

  return useVulnerabilityData(dataSource, {
    enabled: !!date && enabled,
    dateFrom: dateString,
    dateTo: dateString,
    limit: 100,
  });
}

/**
 * Hook for fetching ingestion status
 * New functionality for consolidated ingestion routes
 */
export function useIngestionStatus(
  source: "cisa-kev" | "nvd-cve" | "mitre-attack"
) {
  return useApiData({
    endpoint: `/api/ingestion/${source}`,
    queryKey: ["ingestion", "status", source],
    enabled: !!source,
    refetchInterval: 30000, // 30 seconds for ingestion status
  });
}

/**
 * Hook for fetching dashboard data
 * Can be used for dashboard-specific API calls
 */
export function useDashboardData(dashboardId: string, enabled: boolean = true) {
  return useApiData({
    endpoint: `/api/dashboards/${dashboardId}`,
    queryKey: ["dashboard", "data", dashboardId],
    enabled: !!dashboardId && enabled,
    refetchInterval: 120000, // 2 minutes for dashboard data
  });
}

/**
 * Hook for fetching any generic API endpoint
 * Provides maximum flexibility for custom endpoints
 */
export function useGenericApiData<T = any>(
  endpoint: string,
  queryKey: (string | number | boolean)[],
  options: Omit<UseApiDataOptions<T>, "endpoint" | "queryKey"> = {}
) {
  return useApiData<T>({
    endpoint,
    queryKey,
    ...options,
  });
}

// Export types for external use
export type { ApiResponse, UseApiDataOptions };
