"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVerticalIcon } from "lucide-react";
import { WidgetConfig } from "@/lib/types";
import { useMetricData } from "@/lib/hooks/use-metric-data";
import {
  useDateRange,
  getDateRangeDescription,
} from "@/contexts/date-range-context";
import { useWidgetConfig } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/ui-utils";
import { AlertTriangle } from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboard-store";

export interface MetricCardWidgetProps {
  widgetId: string;
  className?: string;
}

// Memoized loading skeleton component
const LoadingSkeleton = React.memo(() => (
  <div className="space-y-1.5">
    <div className="animate-pulse bg-muted rounded-md h-8 w-20"></div>
    <div className="space-y-0.5">
      <div className="animate-pulse bg-muted rounded h-2.5 w-24"></div>
    </div>
  </div>
));
LoadingSkeleton.displayName = "LoadingSkeleton";

// Memoized error state component
const ErrorState = React.memo(() => (
  <div className="space-y-1.5">
    <div className="text-2xl font-bold text-destructive">—</div>
    <div className="space-y-0.5">
      <p className="text-xs text-destructive/80 font-medium">
        Failed to load data
      </p>
    </div>
  </div>
));
ErrorState.displayName = "ErrorState";

// Memoized header component
const WidgetHeader = React.memo<{
  title: string;
  description?: string;
}>(({ title, description }) => (
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
    <CardTitle className="text-sm font-medium text-muted-foreground flex flex-col">
      {title}
      {description && (
        <span className="text-xs text-muted-foreground leading-tight">
          {description}
        </span>
      )}
    </CardTitle>
    <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
      <GripVerticalIcon className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing hover:text-muted-foreground/60 transition-colors" />
    </div>
  </CardHeader>
));
WidgetHeader.displayName = "WidgetHeader";

// Memoized metric display component
const MetricDisplay = React.memo<{
  value: number;
  changePercent: number;
  dateRangeDescription: string;
}>(({ value, changePercent, dateRangeDescription }) => (
  <div className="space-y-1.5">
    <div className="text-2xl font-bold tracking-tight leading-none">
      {value.toLocaleString()}
    </div>
    <div className="space-y-0.5">
      <div className="flex items-center text-xs">
        <span
          className={`font-medium ${
            changePercent >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {changePercent >= 0 ? "+" : ""}
          {changePercent.toFixed(1)}%
        </span>
        <span className="text-muted-foreground ml-1">
          {dateRangeDescription}
        </span>
      </div>
    </div>
  </div>
));
MetricDisplay.displayName = "MetricDisplay";

export function MetricCardWidget({
  widgetId,
  className,
}: MetricCardWidgetProps) {
  // Select ONLY the config for this specific widget from the store
  const config = useDashboardStore((state) =>
    state.dashboard?.widgets.find((w) => w.id === widgetId)
  );

  const { dateRange } = useDateRange();
  const {
    data: metricData,
    isLoading,
    error,
  } = useMetricData({
    metricId: config?.metricId,
    enabled: !!config?.metricId,
  });

  if (!config) {
    return <Skeleton className={cn("h-full w-full", className)} />;
  }

  // Memoize the date range description
  const dateRangeDescription = React.useMemo(
    () => getDateRangeDescription(dateRange),
    [dateRange]
  );

  // Memoize metric values to prevent unnecessary re-renders
  const metricValues = React.useMemo(
    () => ({
      value: metricData?.value?.value ?? 0,
      changePercent: metricData?.value?.changePercent ?? 0,
    }),
    [metricData?.value?.value, metricData?.value?.changePercent]
  );

  // Memoize header props
  const headerProps = React.useMemo(
    () => ({
      title: config.title,
      description: config.description,
    }),
    [config.title, config.description]
  );

  return (
    <Card className={`${className} h-full`}>
      <WidgetHeader {...headerProps} />
      <CardContent className="pt-0 pb-3">
        {isLoading && <LoadingSkeleton />}
        {error && <ErrorState />}
        {!isLoading && !error && (
          <MetricDisplay
            {...metricValues}
            dateRangeDescription={dateRangeDescription}
          />
        )}
      </CardContent>
    </Card>
  );
}

MetricCardWidget.displayName = "MetricCardWidget";
