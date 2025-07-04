"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/ui-utils";
import { EmptyState } from "./shared/widget-base";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Helper function to get date range description
function getDateRangeDescription(preset: string): string {
  switch (preset) {
    case "24h":
      return "last 24 hours";
    case "7d":
      return "last 7 days";
    case "30d":
      return "last 30 days";
    case "90d":
      return "last 90 days";
    default:
      return "selected period";
  }
}

// MetricCardRenderer - displays numeric metrics with change indicators
export const MetricCardRenderer = React.memo<{
  data: any;
  dateRange: any;
}>(({ data, dateRange }) => {
  if (!data?.value) {
    return <EmptyState icon="📊" title="No metric data" />;
  }

  const value = data.value.value ?? 0;
  const changePercent = data.value.changePercent ?? 0;
  const dateRangeDescription = getDateRangeDescription(dateRange.preset);

  return (
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
  );
});
MetricCardRenderer.displayName = "MetricCardRenderer";

// ChartRenderer - displays various chart types
export const ChartRenderer = React.memo<{
  data: any;
  config: any;
  dataSource?: string;
}>(({ data, config, dataSource }) => {
  const chartType = config?.chartType || "line";
  const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];

  // Transform data for charts
  const chartData = React.useMemo(() => {
    if (!data) return [];

    if (data.distribution) {
      return data.distribution.slice(0, 8).map((item: any, index: number) => ({
        name:
          chartType === "bar" && item.label.length > 12
            ? `${item.label.slice(0, 10)}...`
            : item.label.length > 15
              ? `${item.label.slice(0, 12)}...`
              : item.label,
        fullName: item.label, // Keep full name for tooltip
        value: item.value,
        fill: COLORS[index % COLORS.length],
      }));
    }

    if (data.timeseries) {
      return data.timeseries.map((point: any) => ({
        name: new Date(point.timestamp || point.date).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        ),
        value: point.value || point.total || point.count || 0,
      }));
    }

    return [];
  }, [data, chartType]);

  // Debug logging to see what's happening
  React.useEffect(() => {
    console.log("ChartRenderer Debug:", {
      widgetId: config?.id,
      chartType: config?.chartType,
      resolvedChartType: chartType,
      configKeys: Object.keys(config || {}),
      dataKeys: Object.keys(data || {}),
      dataStructure: {
        hasDistribution: !!data?.distribution,
        hasTimeseries: !!data?.timeseries,
        distributionLength: data?.distribution?.length,
        timeseriesLength: data?.timeseries?.length,
      },
    });
  }, [config, chartType, data]);

  // Additional debug for chartData
  React.useEffect(() => {
    if (chartData.length > 0) {
      console.log("ChartData Debug:", {
        chartDataLength: chartData.length,
        chartData: chartData.slice(0, 3), // Show first 3 items
        willRenderAs: chartType,
      });
    }
  }, [chartData, chartType]);

  if (chartData.length === 0) {
    return (
      <EmptyState icon="📈" title="No chart data" dataSource={dataSource} />
    );
  }

  // Create chart config for the custom chart system
  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((item: any, index: number) => {
      config[item.name] = {
        label: item.fullName || item.name,
        color: item.fill || COLORS[index % COLORS.length],
      };
    });
    return config;
  }, [chartData]);

  const renderChart = () => {
    if (chartType === "pie") {
      return (
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        {chartType === "bar" ? (
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={10} />
            <YAxis
              type="category"
              dataKey="name"
              fontSize={10}
              width={80}
              tick={{ textAnchor: "end" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
            />
          </LineChart>
        )}
      </ChartContainer>
    );
  };

  return renderChart();
});
ChartRenderer.displayName = "ChartRenderer";

// ListRenderer - displays list items with optional badges and external links
export const ListRenderer = React.memo<{
  data: any;
  config: any;
}>(({ data, config }) => {
  if (!data?.list || data.list.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No list data"
        dataSource={config?.dataSource}
      />
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-0 pr-4">
        {data.list.map((item: any, index: number) => {
          // Check if this is a CVE item or MITRE technique
          const isCVE = item.title?.startsWith("CVE-");
          const isMitreTechnique = /^T\d{4}(\.\d{3})?$/.test(item.id || "");

          const cveUrl = isCVE
            ? `https://nvd.nist.gov/vuln/detail/${item.title}`
            : null;
          const mitreUrl = isMitreTechnique
            ? `https://attack.mitre.org/techniques/${item.id.replace(".", "/")}/`
            : null;
          const externalUrl = cveUrl || mitreUrl;

          const ItemContent = () => (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    (isCVE || isMitreTechnique) &&
                      "text-primary hover:underline"
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
            "flex items-center justify-between py-3 px-3 rounded-sm",
            index % 2 === 0 ? "bg-background" : "bg-muted/30",
            (isCVE || isMitreTechnique) &&
              "cursor-pointer hover:bg-accent/50 transition-colors"
          );

          if ((isCVE || isMitreTechnique) && externalUrl) {
            return (
              <a
                key={item.id || index}
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClasses}
                title={
                  isCVE
                    ? `View ${item.title} on NVD`
                    : `View ${item.id} on MITRE ATT&CK`
                }
              >
                <ItemContent />
                {item.value && (
                  <span className="text-sm font-mono tabular-nums ml-2 flex-shrink-0">
                    {item.value}
                  </span>
                )}
              </a>
            );
          }

          return (
            <div key={item.id || index} className={itemClasses}>
              <ItemContent />
              {item.value && (
                <span className="text-sm font-mono tabular-nums ml-2 flex-shrink-0">
                  {item.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
});
ListRenderer.displayName = "ListRenderer";

// TableRenderer - displays tabular data
export const TableRenderer = React.memo<{
  data: any;
  config: any;
}>(({ data, config }) => {
  // Transform distribution data to table format
  const tableData = React.useMemo(() => {
    if (!data?.distribution) return null;

    const distribution = data.distribution;
    if (!Array.isArray(distribution) || distribution.length === 0) {
      return null;
    }

    const firstItem = distribution[0];

    // Handle CISA vendor breakdown format
    if (firstItem.label !== undefined && firstItem.value !== undefined) {
      return {
        headers: ["Vendor", "Count"],
        rows: distribution.map((item: any) => [
          String(item.label || "Unknown"),
          String(item.value || 0),
        ]),
      };
    }

    // Handle MITRE tactics format - updated for new query structure
    if (firstItem.name !== undefined) {
      return {
        headers: ["Tactic", "Techniques", "Short Name"],
        rows: distribution.map((item: any) => [
          String(item.name || item.label || "Unknown"),
          String(item.techniqueCount || item.value || 0),
          String(item.shortName || item.short_name || "N/A"),
        ]),
      };
    }

    // Handle platform coverage format
    if (firstItem.platform !== undefined) {
      return {
        headers: ["Platform", "Techniques"],
        rows: distribution.map((item: any) => [
          String(item.platform || item.label || "Unknown"),
          String(item.value || 0),
        ]),
      };
    }

    // Generic format fallback
    return {
      headers: ["Item", "Count"],
      rows: distribution.map((item: any) => [
        String(item.label || item.name || "Unknown"),
        String(item.value || 0),
      ]),
    };
  }, [data?.distribution]);

  if (!tableData) {
    return (
      <EmptyState
        icon="📊"
        title="No table data"
        dataSource={config?.dataSource}
      />
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-md border">
      <ScrollArea className="h-full w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {tableData.headers.map((header, index) => (
                <TableHead
                  key={`header-${index}`}
                  className="text-xs font-medium px-3 py-2"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.rows.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="text-xs px-3 py-2"
                  >
                    <div className="truncate" title={cell}>
                      {cell}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
});
TableRenderer.displayName = "TableRenderer";

// VendorCardRenderer - consolidated with MetricCardRenderer for better maintainability
export const VendorCardRenderer = MetricCardRenderer;
VendorCardRenderer.displayName = "VendorCardRenderer";
