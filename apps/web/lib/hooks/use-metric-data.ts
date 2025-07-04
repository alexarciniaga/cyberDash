import { useQuery } from "@tanstack/react-query";

// Simple metric data fetching - no over-engineering
export function useMetricData(dataSource: string, metricId: string) {
  return useQuery({
    queryKey: ["metric", dataSource, metricId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${dataSource}/${metricId}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch metric data");
      }
      return result.data;
    },
    enabled: !!metricId && !!dataSource,
    refetchInterval: 60000, // Simple 1-minute refresh
  });
}
