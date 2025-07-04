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
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/ui-utils";
import { AlertTriangle } from "lucide-react";

export interface VendorCardWidgetProps {
  widgetId: string;
  className?: string;
}

// Memoized loading skeleton component
const LoadingSkeleton = React.memo(() => (
  <div className="space-y-1.5">
    <div className="animate-pulse bg-muted rounded-md h-8 w-32"></div>
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

// Memoized vendor display component
const VendorDisplay = React.memo<{
  vendorName: string;
  vulnerabilityCount: number;
  changePercent: number;
  dateRangeDescription: string;
  metadata?: any;
}>(
  ({
    vendorName,
    vulnerabilityCount,
    changePercent,
    dateRangeDescription,
    metadata,
  }) => {
    // Handle no data cases more robustly
    const isNoData =
      vulnerabilityCount === 0 ||
      !vendorName ||
      vendorName.toLowerCase().includes("no data") ||
      vendorName.toLowerCase().includes("no vendor");

    if (isNoData) {
      const message =
        metadata?.message || "No vulnerabilities found for current time range";
      const suggestedAction = metadata?.suggestedAction;

      return (
        <div className="space-y-1.5">
          <div className="text-2xl font-bold tracking-tight text-muted-foreground">
            —
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground leading-tight">
              {message}
            </div>
            {suggestedAction === "ingestion_required" && (
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                💡 Run CISA KEV ingestion to populate data
              </div>
            )}
            {suggestedAction === "adjust_date_range" && (
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                💡 Try adjusting the date range
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {/* Vendor name - clean and subtle */}
        <div
          className="text-sm font-medium text-foreground truncate w-full leading-tight"
          title={vendorName}
        >
          {vendorName}
        </div>

        {/* Large vulnerability count - main focus */}
        <div className="text-2xl font-bold tracking-tight leading-none">
          {vulnerabilityCount.toLocaleString()}
        </div>

        {/* Bottom info - change percentage and time range */}
        <div className="space-y-0.5">
          <div className="text-xs text-muted-foreground">
            {vulnerabilityCount === 1 ? "vulnerability" : "vulnerabilities"}
          </div>
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
    );
  }
);
VendorDisplay.displayName = "VendorDisplay";

export function VendorCardWidget({
  widgetId,
  className,
}: VendorCardWidgetProps) {
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
    dataSource: config?.dataSource,
    enabled: !!config,
  });

  // Memoize the date range description
  const dateRangeDescription = React.useMemo(
    () => getDateRangeDescription(dateRange),
    [dateRange]
  );

  // Memoize vendor data to prevent unnecessary re-renders
  const vendorData = React.useMemo(
    () => ({
      vendorName: metricData?.value?.label || "No data",
      vulnerabilityCount: metricData?.value?.value ?? 0,
      changePercent: metricData?.value?.changePercent ?? 0,
      metadata: metricData?.metadata,
    }),
    [
      metricData?.value?.label,
      metricData?.value?.value,
      metricData?.value?.changePercent,
      metricData?.metadata,
    ]
  );

  // Memoize header props
  const headerProps = React.useMemo(
    () => ({
      title: config?.title || "Vendor Card",
      description: config?.description,
    }),
    [config?.title, config?.description]
  );

  if (!config) {
    return <Skeleton className={cn("h-full w-full", className)} />;
  }

  return (
    <Card className={`${className} h-full min-w-0 overflow-hidden`}>
      <WidgetHeader {...headerProps} />
      <CardContent className="pt-0 pb-3 min-w-0">
        {isLoading && <LoadingSkeleton />}
        {error && <ErrorState />}
        {!isLoading && !error && (
          <VendorDisplay
            {...vendorData}
            dateRangeDescription={dateRangeDescription}
          />
        )}
      </CardContent>
    </Card>
  );
}

VendorCardWidget.displayName = "VendorCardWidget";
