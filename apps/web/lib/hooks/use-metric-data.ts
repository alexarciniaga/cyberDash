import { useQuery } from "@tanstack/react-query";
import { MetricData } from "@/lib/types";
import {
  useDateRange,
  formatDateRangeForAPI,
} from "@/contexts/date-range-context";
import { getRefreshInterval } from "@/lib/config";

interface UseMetricDataOptions {
  metricId?: string;
  dataSource?: string;
  refreshInterval?: number;
  enabled?: boolean;
}

export function useMetricData({
  metricId,
  dataSource,
  refreshInterval,
  enabled = true,
}: UseMetricDataOptions) {
  const { dateRange } = useDateRange();
  const formattedDateRange = formatDateRangeForAPI(dateRange);

  // Determine the endpoint
  const endpoint = metricId
    ? `/api/metrics/${dataSource}/${metricId}`
    : // A sensible fallback or could be an error
      `/api/metrics/${dataSource}/total-count`;

  return useQuery<MetricData>({
    // The query will not execute if metricId is falsy due to the enabled flag
    queryKey: ["metric", dataSource, metricId],
    queryFn: async () => {
      const response = await fetch(endpoint);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch metric data");
      }
      return result.data;
    },
    // The query is only enabled if the metricId is provided and the hook is explicitly enabled
    enabled: !!metricId && enabled,
    refetchInterval: refreshInterval
      ? refreshInterval * 1000
      : getRefreshInterval("normal") * 1000,
  });
}

// Utility hook for quick data availability check
export function useMetricAvailability(dataSource: string, metricId: string) {
  const { data, isLoading, error } = useMetricData({
    dataSource,
    metricId,
    refreshInterval: 300, // Check every 5 minutes
  });

  return {
    isAvailable: !!data && !error,
    isLoading,
    error,
  };
}
