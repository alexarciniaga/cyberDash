"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboardContext, useDateRange } from "@/contexts/app-context";
import { WidgetContainer } from "./shared/widget-base";

export interface BaseWidgetProps {
  widgetId: string;
  className?: string;
  children: (data: {
    data: any;
    config: any;
    isLoading: boolean;
    error: any;
    dateRange: any;
  }) => React.ReactNode;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType;
  refetchInterval?: number;
  onDelete?: () => void;
}

export function BaseWidget({
  widgetId,
  className,
  children,
  loadingComponent,
  errorComponent,
  refetchInterval = 60000,
  onDelete,
}: BaseWidgetProps) {
  // Get the config for this specific widget from the context
  const { dashboard } = useDashboardContext();
  const config = React.useMemo(
    () => dashboard?.widgets?.find((w) => w.id === widgetId),
    [dashboard?.widgets, widgetId]
  );

  const { preset } = useDateRange();

  // Fetch data using the unified API
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["metric", config?.dataSource, config?.metricId, preset],
    queryFn: async () => {
      if (!config?.dataSource || !config?.metricId) {
        throw new Error("Missing config data");
      }
      const response = await fetch(
        `/api/metrics/${config.dataSource}/${config.metricId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "API request failed");
      }
      return result.data;
    },
    enabled: !!config?.metricId && !!config?.dataSource,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoize date range for child components
  const dateRange = React.useMemo(() => ({ preset }), [preset]);

  return (
    <WidgetContainer
      config={config}
      isLoading={isLoading}
      error={error}
      className={className}
      loadingComponent={loadingComponent}
      errorComponent={errorComponent}
      onDelete={onDelete}
    >
      {children({
        data: apiResponse,
        config,
        isLoading,
        error,
        dateRange,
      })}
    </WidgetContainer>
  );
}

BaseWidget.displayName = "BaseWidget";
