"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVerticalIcon, InfoIcon } from "lucide-react";
import { WidgetConfig } from "@/lib/types";
import { useMetricData } from "@/lib/hooks/use-metric-data";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/ui-utils";

interface ProductDistributionWidgetProps {
  config: WidgetConfig;
  className?: string;
}

interface ProcessedDataItem {
  name: string;
  fullName: string;
  value: number;
  percentage: number;
  color: string;
  isOthersGroup?: boolean;
  otherItems?: Array<{ label: string; value: number }>;
}

// Modern color palette optimized for accessibility and distinction
const COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray for "Others"
];

const ProductDistributionWidget = React.memo<ProductDistributionWidgetProps>(
  function ProductDistributionWidget({ config, className }) {
    const {
      data: metricData,
      isLoading,
      error,
    } = useMetricData({
      dataSource: config.dataSource,
      metricId: config.metricId || "product_distribution",
      refreshInterval: config.refreshInterval || 60,
    });

    const processedData = React.useMemo((): ProcessedDataItem[] => {
      if (!metricData?.distribution) return [];

      const totalValue = metricData.distribution.reduce(
        (sum, item) => sum + item.value,
        0
      );

      // Sort by value descending
      const sortedData = [...metricData.distribution].sort(
        (a, b) => b.value - a.value
      );

      // Group smaller items if there are more than 8 items
      if (sortedData.length > 8) {
        const topItems = sortedData.slice(0, 7);
        const otherItems = sortedData.slice(7);
        const otherTotal = otherItems.reduce(
          (sum, item) => sum + item.value,
          0
        );

        const processedItems: ProcessedDataItem[] = topItems.map(
          (item, index) => ({
            name:
              item.label.length > 20
                ? `${item.label.slice(0, 17)}...`
                : item.label,
            fullName: item.label,
            value: item.value,
            percentage: (item.value / totalValue) * 100,
            color: COLORS[index % COLORS.length] ?? "#3B82F6",
          })
        );

        if (otherTotal > 0) {
          processedItems.push({
            name: "Others",
            fullName: `${otherItems.length} other products`,
            value: otherTotal,
            percentage: (otherTotal / totalValue) * 100,
            color: COLORS[7] ?? "#6B7280",
            isOthersGroup: true,
            otherItems: otherItems.map((item) => ({
              label: item.label,
              value: item.value,
            })),
          });
        }

        return processedItems;
      }

      // If 8 or fewer items, show all
      return sortedData.map((item, index) => ({
        name:
          item.label.length > 20 ? `${item.label.slice(0, 17)}...` : item.label,
        fullName: item.label,
        value: item.value,
        percentage: (item.value / totalValue) * 100,
        color: COLORS[index % COLORS.length] ?? "#3B82F6",
      }));
    }, [metricData]);

    const CustomTooltip = React.useCallback(({ active, payload }: any) => {
      if (!active || !payload?.[0]) return null;

      const data = payload[0].payload as ProcessedDataItem;

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-semibold text-sm text-foreground mb-1">
            {data.fullName}
          </p>
          <div className="space-y-1">
            <p className="text-primary font-medium">
              {data.value.toLocaleString()} vulnerabilities
            </p>
            <p className="text-muted-foreground text-xs">
              {data.percentage.toFixed(1)}% of total
            </p>
            {data.isOthersGroup && data.otherItems && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Includes:
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {data.otherItems.slice(0, 5).map((item, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      • {item.label} ({item.value})
                    </p>
                  ))}
                  {data.otherItems.length > 5 && (
                    <p className="text-xs text-muted-foreground italic">
                      ... and {data.otherItems.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }, []);

    const CustomLegend = React.useCallback(({ payload }: any) => {
      if (!payload) return null;

      return (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-1 gap-1 text-xs">
            {payload.map((entry: any, index: number) => {
              const data = entry.payload as ProcessedDataItem;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 py-1"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: data.color }}
                    />
                    <span className="truncate text-foreground font-medium">
                      {data.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {data.percentage.toFixed(1)}%
                    </Badge>
                    <span className="text-muted-foreground font-mono text-xs">
                      {data.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }, []);

    // Loading state
    if (isLoading) {
      return (
        <Card className={cn("h-full flex flex-col", className)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>
            {config.description && (
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="flex items-center justify-center h-48">
              <Skeleton className="w-32 h-32 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error) {
      return (
        <Card className={cn("h-full flex flex-col", className)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <div className="text-destructive">
                <InfoIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Failed to load data</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Please try refreshing the widget
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Empty state
    if (processedData.length === 0) {
      return (
        <Card className={cn("h-full flex flex-col", className)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>
            {config.description && (
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <div className="text-4xl opacity-50">📊</div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  No data available
                </p>
                <p className="text-xs text-muted-foreground">
                  Check back later for updates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("h-full flex flex-col", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {config.title}
            </CardTitle>
            <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </div>
          {config.description && (
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-4 min-h-0">
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  outerRadius="85%"
                  innerRadius="0%"
                  dataKey="value"
                  stroke="white"
                  strokeWidth={2}
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={CustomTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Legend content={CustomLegend} />
        </CardContent>
      </Card>
    );
  }
);

ProductDistributionWidget.displayName = "ProductDistributionWidget";

export { ProductDistributionWidget };
