import { useQuery } from "@tanstack/react-query";
import { MetricData } from "@/lib/types";
import {
  useDateRange,
  formatDateRangeForAPI,
} from "@/contexts/date-range-context";

interface UseMetricDataOptions {
  dataSource: string;
  metricId: string;
  refreshInterval?: number; // seconds
  enabled?: boolean;
}

export function useMetricData({
  dataSource,
  metricId,
  refreshInterval = 60,
  enabled = true,
}: UseMetricDataOptions) {
  const { dateRange } = useDateRange();
  const formattedDateRange = formatDateRangeForAPI(dateRange);

  return useQuery<MetricData>({
    queryKey: [
      "metric",
      dataSource,
      metricId,
      formattedDateRange.from,
      formattedDateRange.to,
    ],
    queryFn: async () => {
      const url = new URL(
        `/api/metrics/${dataSource}/${metricId.replace(/_/g, "-")}`,
        window.location.origin
      );
      url.searchParams.set("from", formattedDateRange.from);
      url.searchParams.set("to", formattedDateRange.to);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch metric: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch metric data");
      }

      return result.data;
    },
    refetchInterval: refreshInterval * 1000, // Convert to milliseconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: (refreshInterval / 2) * 1000, // Half the refresh interval
    enabled,
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
