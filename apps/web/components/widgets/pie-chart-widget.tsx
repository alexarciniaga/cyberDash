"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVerticalIcon } from "lucide-react";
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

interface PieChartWidgetProps {
  config: WidgetConfig;
  className?: string;
}

// Color palette for pie chart segments
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

export const PieChartWidget = React.memo<PieChartWidgetProps>(
  function PieChartWidget({ config, className }) {
    const {
      data: metricData,
      isLoading,
      error,
    } = useMetricData({
      dataSource: config.dataSource,
      metricId: config.metricId || "product_distribution",
      refreshInterval: config.refreshInterval || 60,
    });

    const chartData = React.useMemo(() => {
      // Handle distribution data (for product distribution, vendor breakdown, etc.)
      if (metricData?.distribution) {
        return metricData.distribution.map((item, index) => {
          // For pie charts, we want shorter labels but keep full name for tooltip
          const truncatedLabel =
            item.label.length > 20
              ? item.label.substring(0, 17) + "..."
              : item.label;

          return {
            name: truncatedLabel,
            fullName: item.label, // Keep full name for tooltip
            value: item.value,
            index: index,
          };
        });
      }

      return [];
    }, [metricData]);

    // Custom label function for pie chart
    const renderCustomLabel = React.useCallback(({ name, percent }: any) => {
      const percentage = ((percent || 0) * 100).toFixed(0);
      return percentage === "0" ? "" : `${percentage}%`;
    }, []);

    // Custom tooltip for pie chart
    const CustomTooltip = React.useCallback(({ active, payload }: any) => {
      if (active && payload && payload.length > 0) {
        const data = payload[0].payload;
        return (
          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
            <p className="font-medium text-sm">{data.fullName}</p>
            <p className="text-primary font-semibold">
              {payload[0].value} vulnerabilities
            </p>
            <p className="text-muted-foreground text-xs">
              {((payload[0].percent || 0) * 100).toFixed(1)}% of total
            </p>
          </div>
        );
      }
      return null;
    }, []);

    // Custom legend formatter
    const renderLegend = React.useCallback((props: any) => {
      const { payload } = props;
      return (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {payload?.slice(0, 8).map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate max-w-[80px]">
                {entry.payload?.fullName || entry.value}
              </span>
            </div>
          ))}
          {payload?.length > 8 && (
            <div className="text-xs text-muted-foreground">
              +{payload.length - 8} more
            </div>
          )}
        </div>
      );
    }, []);

    // Handle loading state
    if (isLoading) {
      return (
        <Card className={`${className} h-full flex flex-col overflow-hidden`}>
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex flex-col">
                {config.title}
                {config.description && (
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                )}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
            <Skeleton className="flex-1 min-h-[180px] w-full rounded-full" />
          </CardContent>
        </Card>
      );
    }

    // Handle error state
    if (error) {
      return (
        <Card className={`${className} h-full flex flex-col overflow-hidden`}>
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex flex-col">
                {config.title}
                {config.description && (
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                )}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
            <div className="flex-1 bg-destructive/10 rounded border border-destructive/20 flex items-center justify-center min-h-[180px] w-full">
              <div className="text-center">
                <span className="text-destructive text-sm font-medium">
                  Chart Error
                </span>
                <p className="text-destructive/70 text-xs mt-1">
                  Failed to load chart data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Handle empty data state
    if (!isLoading && chartData.length === 0) {
      return (
        <Card className={`${className} h-full flex flex-col overflow-hidden`}>
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex flex-col">
                {config.title}
                {config.description && (
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                )}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
            <div className="flex-1 flex items-center justify-center text-muted-foreground min-h-[180px] w-full">
              <div className="text-center space-y-2">
                <div className="text-4xl opacity-50">🥧</div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">
                    No data to display
                  </span>
                  <p className="text-xs text-muted-foreground/70">
                    {metricData?.description || "Check back later for updates"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`${className} h-full flex flex-col overflow-hidden`}>
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex flex-col">
              {config.title}
              {config.description && (
                <span className="text-xs text-muted-foreground">
                  {config.description}
                </span>
              )}
            </CardTitle>
            <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-2 overflow-hidden">
          <div className="flex-1 min-h-[180px] w-full overflow-hidden relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius="70%"
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={CustomTooltip} />
                <Legend
                  content={renderLegend}
                  wrapperStyle={{ paddingTop: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }
);
PieChartWidget.displayName = "PieChartWidget";
