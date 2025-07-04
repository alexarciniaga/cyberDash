import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useDashboardRefresh() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setTimeUntilNext(60); // Reset countdown

    try {
      // Invalidate all metric queries to force refresh
      await queryClient.invalidateQueries({
        queryKey: ["metric"],
      });
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [isRefreshing, queryClient]);

  // Setup 60-second auto-refresh and countdown
  useEffect(() => {
    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(() => {
      if (!isRefreshing) {
        refresh();
      }
    }, 60000);

    // Update countdown every second
    countdownRef.current = setInterval(() => {
      setTimeUntilNext((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [refresh, isRefreshing]);

  return {
    refresh,
    isRefreshing,
    timeUntilNext,
  };
}
