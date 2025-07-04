"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVerticalIcon, ExternalLinkIcon } from "lucide-react";
import { WidgetConfig, ListData, MetricValue } from "@/lib/types";
import { useMetricData } from "@/lib/hooks/use-metric-data";
import { cn } from "@/lib/ui-utils";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { Skeleton } from "@/components/ui/skeleton";

export interface ListWidgetProps {
  widgetId: string;
  className?: string;
}

// Transform distribution data to list format - pure function, no hooks needed
function transformDistributionToList(distribution: MetricValue[]): ListData[] {
  return distribution.map((item, index) => ({
    id: `item-${index}`,
    title: item.label,
    subtitle:
      item.change !== undefined && item.changePercent !== undefined
        ? `${item.change >= 0 ? "+" : ""}${item.change} (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(1)}%)`
        : undefined,
    value: item.value.toString(),
    badge:
      item.value > 10
        ? {
            text: "High",
            variant: "destructive" as const,
          }
        : item.value > 5
          ? {
              text: "Medium",
              variant: "secondary" as const,
            }
          : undefined,
  }));
}

// Memoized loading skeleton component
const ListSkeleton = React.memo(() => (
  <div className="h-full flex flex-col space-y-3 py-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="flex-1 h-6 bg-muted animate-pulse rounded" />
        <div className="w-20 h-6 bg-muted animate-pulse rounded" />
      </div>
    ))}
  </div>
));
ListSkeleton.displayName = "ListSkeleton";

// Memoized error display component
const ListError = React.memo(() => (
  <div className="h-full bg-destructive/10 rounded border border-destructive/20 flex items-center justify-center">
    <div className="text-center">
      <span className="text-destructive text-sm font-medium">List Error</span>
      <p className="text-destructive/70 text-xs mt-1">
        Failed to load list data
      </p>
    </div>
  </div>
));
ListError.displayName = "ListError";

// Memoized empty state component
const EmptyList = React.memo<{ config?: WidgetConfig }>(({ config }) => {
  const isMitreWidget = config?.dataSource === "mitre";

  return (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground min-h-[200px]">
      <div className="text-center space-y-3 p-4">
        <div className="text-4xl opacity-50">📋</div>
        <div className="space-y-2">
          <span className="text-sm font-medium block">No updates found</span>
          {isMitreWidget && (
            <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto leading-relaxed">
              MITRE ATT&CK updates less frequently. Try expanding the date range
              to see more results, or check back later.
            </p>
          )}
          {!isMitreWidget && (
            <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
              No data available for the selected date range.
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
EmptyList.displayName = "EmptyList";

// Memoized widget header component
const WidgetHeader = React.memo<{
  title: string;
  description?: string;
}>(({ title, description }) => (
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium flex flex-col">
        {title}
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </CardTitle>
      <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors" />
      </div>
    </div>
  </CardHeader>
));
WidgetHeader.displayName = "WidgetHeader";

// Memoized list item component
const ListItem = React.memo<{
  item: ListData;
  index: number;
}>(({ item, index }) => {
  // Check if this is a CVE item (title starts with CVE-)
  const isCVE = item.title.startsWith("CVE-");
  const cveUrl = isCVE
    ? `https://nvd.nist.gov/vuln/detail/${item.title}`
    : null;

  // Check if this is a MITRE technique (ID has format T followed by digits)
  const isMitreTechnique = /^T\d{4}(\.\d{3})?$/.test(item.id);
  const techniqueId = isMitreTechnique ? item.id : null;
  const mitreUrl = techniqueId
    ? `https://attack.mitre.org/techniques/${techniqueId.replace(".", "/")}/`
    : null;

  const ItemContent = () => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-sm font-medium truncate",
            (isCVE || isMitreTechnique) && "text-primary hover:underline"
          )}
        >
          {item.title}
        </span>
        {(isCVE || isMitreTechnique) && (
          <ExternalLinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
        {item.badge && (
          <Badge variant={item.badge.variant} className="text-xs">
            {item.badge.text}
          </Badge>
        )}
      </div>
      {item.subtitle && (
        <p className="text-xs text-muted-foreground truncate">
          {item.subtitle}
        </p>
      )}
    </div>
  );

  const itemClasses = cn(
    "flex items-center justify-between py-3 px-6 -mx-3",
    index % 2 === 0 ? "bg-background" : "bg-muted/30",
    (isCVE || isMitreTechnique) &&
      "cursor-pointer hover:bg-accent/50 transition-colors"
  );

  // Handle external links for both CVE and MITRE techniques
  const externalUrl = cveUrl || mitreUrl;
  if ((isCVE || isMitreTechnique) && externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClasses}
        title={
          isCVE
            ? `View ${item.title} on NVD`
            : `View ${techniqueId} on MITRE ATT&CK`
        }
      >
        <ItemContent />
        {item.value && (
          <span className="text-sm font-mono tabular-nums ml-2">
            {item.value}
          </span>
        )}
      </a>
    );
  }

  return (
    <div className={itemClasses}>
      <ItemContent />
      {item.value && (
        <span className="text-sm font-mono tabular-nums ml-2">
          {item.value}
        </span>
      )}
    </div>
  );
});
ListItem.displayName = "ListItem";

// Memoized main list display component
const ListDisplay = React.memo<{ data: ListData[] }>(({ data }) => (
  <div className="h-full overflow-x-hidden overflow-y-auto">
    {data.map((item, index) => (
      <ListItem key={item.id} item={item} index={index} />
    ))}
  </div>
));
ListDisplay.displayName = "ListDisplay";

// Main component
export function ListWidget({ widgetId, className }: ListWidgetProps) {
  const config = useDashboardStore((state) =>
    state.dashboard?.widgets.find((w) => w.id === widgetId)
  );

  if (!config) {
    return <Skeleton className={cn("h-full w-full", className)} />;
  }

  const {
    data: metricData,
    isLoading: metricLoading,
    error: metricError,
  } = useMetricData({
    dataSource: config.dataSource,
    metricId: config.metricId,
    refreshInterval: config.refreshInterval,
    enabled: !!config,
  });

  // Transform data to list format with memoization
  const listData = React.useMemo(() => {
    if (metricData?.list) {
      return metricData.list;
    }

    if (metricData?.distribution) {
      return transformDistributionToList(metricData.distribution);
    }

    return null;
  }, [metricData]);

  // Memoize header props
  const headerProps = React.useMemo(
    () => ({
      title: config.title,
      description: config.description,
    }),
    [config.title, config.description]
  );

  return (
    <Card className={cn("w-full h-full flex flex-col", className)}>
      <WidgetHeader {...headerProps} />
      <CardContent className="p-4 flex-1 flex flex-col min-h-0">
        {/* Always show loading state initially */}
        {metricLoading && (
          <div className="flex-1 min-h-0">
            <ListSkeleton />
          </div>
        )}

        {/* Show error state */}
        {!metricLoading && metricError && (
          <div className="flex-1 min-h-0">
            <ListError />
          </div>
        )}

        {/* Show data when available */}
        {!metricLoading && !metricError && listData && listData.length > 0 && (
          <div className="flex-1 min-h-0">
            <ListDisplay data={listData} />
          </div>
        )}

        {/* Show empty state when no data */}
        {!metricLoading &&
          !metricError &&
          (!listData || listData.length === 0) && (
            <div className="flex-1 min-h-0">
              <EmptyList config={config} />
            </div>
          )}

        {/* Fallback state - should never happen but ensures something always renders */}
        {!metricLoading && !metricError && !listData && !metricData && (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-4xl opacity-50">⚠️</div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Widget Loading Issue
                </span>
                <p className="text-xs text-muted-foreground/70">
                  No data or loading state detected. Please refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

ListWidget.displayName = "ListWidget";
