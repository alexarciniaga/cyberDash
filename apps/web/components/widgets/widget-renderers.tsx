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
import { ProgressBarWidget } from "./progress-bar-widget";
import { CarouselWidget } from "./carousel-widget";
import { GaugeWidget } from "./gauge-widget";
import { AvatarListWidget } from "./avatar-list-widget";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  config?: any;
}>(({ data, dateRange, config }) => {
  // Handle special case: distribution data that should be displayed as percentage
  const metricData = React.useMemo(() => {
    // Check if this should be displayed as percentage (like due date compliance)
    if (config?.metadata?.displayType === "percentage" && data?.distribution) {
      const total = data.distribution.reduce(
        (sum: number, item: any) => sum + (item.value || 0),
        0
      );
      const compliant = data.distribution
        .filter((item: any) => item.label !== "Overdue")
        .reduce((sum: number, item: any) => sum + (item.value || 0), 0);

      const percentage = total > 0 ? Math.round((compliant / total) * 100) : 0;

      return {
        value: percentage,
        changePercent: 0, // No trend calculation for now
        isPercentage: true,
      };
    }

    // Regular counter data
    if (data?.value) {
      return {
        value: data.value.value ?? 0,
        changePercent: data.value.changePercent ?? 0,
        isPercentage: false,
      };
    }

    return null;
  }, [data, config]);

  if (!metricData) {
    return <EmptyState icon="📊" title="No metric data" />;
  }

  const dateRangeDescription = getDateRangeDescription(dateRange.preset);

  return (
    <div className="space-y-1.5">
      <div className="text-2xl font-bold tracking-tight leading-none">
        {metricData.value.toLocaleString()}
        {metricData.isPercentage ? "%" : ""}
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center text-xs">
          {!metricData.isPercentage && (
            <>
              <span
                className={`font-medium ${
                  metricData.changePercent >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {metricData.changePercent >= 0 ? "+" : ""}
                {metricData.changePercent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">
                {dateRangeDescription}
              </span>
            </>
          )}
          {metricData.isPercentage && (
            <span className="text-muted-foreground">compliance rate</span>
          )}
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
  // Transform data to list format if needed
  const listData = React.useMemo(() => {
    // If data already has list format, use it
    if (data?.list && Array.isArray(data.list)) {
      return data.list;
    }

    // If data has distribution format, transform it to list format
    if (data?.distribution && Array.isArray(data.distribution)) {
      return data.distribution.map((item: any, index: number) => ({
        id: item.label || item.name || item.cve_id || `item-${index}`,
        title: item.label || item.name || item.cve_id || "Unknown",
        value: item.value || item.count || 0,
        subtitle: item.metadata?.description || item.subtitle,
        badge: item.badge,
      }));
    }

    return [];
  }, [data]);

  if (!listData || listData.length === 0) {
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
        {listData.map((item: any, index: number) => {
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

// VendorCardRenderer - displays top vendor information with name and count
export const VendorCardRenderer = React.memo<{
  data: any;
  dateRange: any;
  config?: any;
}>(({ data, dateRange, config }) => {
  // Handle both distribution data (top-vendor metric) and counter data
  const vendorData = React.useMemo(() => {
    if (
      data?.distribution &&
      Array.isArray(data.distribution) &&
      data.distribution.length > 0
    ) {
      // Top vendor from distribution data
      const topVendor = data.distribution[0];
      return {
        name: topVendor.label || topVendor.name || "Unknown Vendor",
        count: topVendor.value || 0,
        isDistribution: true,
      };
    }

    if (data?.value) {
      // Counter data format
      return {
        name: data.value.metadata?.name || "Unknown Vendor",
        count: data.value.value || 0,
        changePercent: data.value.changePercent || 0,
        isDistribution: false,
      };
    }

    return null;
  }, [data]);

  if (!vendorData) {
    return <EmptyState icon="🏢" title="No vendor data" />;
  }

  const dateRangeDescription = getDateRangeDescription(dateRange.preset);

  return (
    <div className="space-y-2">
      {/* Vendor Name - Prominent Display */}
      <div className="space-y-1">
        <div className="text-lg font-bold tracking-tight leading-tight text-primary">
          {vendorData.name}
        </div>
        <div className="text-xs text-muted-foreground">
          Top Vendor by Vulnerabilities
        </div>
      </div>

      {/* Count with optional trend */}
      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight leading-none">
          {vendorData.count.toLocaleString()}
        </div>
        <div className="flex items-center text-xs">
          <span className="text-muted-foreground">vulnerabilities</span>
          {!vendorData.isDistribution &&
            vendorData.changePercent !== undefined && (
              <>
                <span className="mx-1 text-muted-foreground">•</span>
                <span
                  className={`font-medium ${
                    vendorData.changePercent >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {vendorData.changePercent >= 0 ? "+" : ""}
                  {vendorData.changePercent.toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">
                  {dateRangeDescription}
                </span>
              </>
            )}
        </div>
      </div>
    </div>
  );
});
VendorCardRenderer.displayName = "VendorCardRenderer";

// ProgressBarRenderer - displays data as progress bars
export const ProgressBarRenderer = React.memo<{
  data: any;
  config: any;
  title: string;
  description?: string;
}>(({ data, config, title, description }) => {
  return <ProgressBarWidget widgetId={config?.id || "progress-bar"} />;
});
ProgressBarRenderer.displayName = "ProgressBarRenderer";

// CarouselRenderer - displays data in a carousel format
export const CarouselRenderer = React.memo<{
  data: any;
  config: any;
  title: string;
  description?: string;
}>(({ data, config, title, description }) => {
  // Transform data for carousel
  const carouselData = React.useMemo(() => {
    if (!data) return [];

    // Handle distribution data (like vendor breakdown)
    if (data.distribution && Array.isArray(data.distribution)) {
      return data.distribution.slice(0, 10).map((item: any) => ({
        id: item.label || item.name || `item-${Math.random()}`,
        title: item.label || item.name || "Unknown",
        value: item.value || item.count || 0,
        subtitle: `${(item.value || item.count || 0).toLocaleString()} vulnerabilities`,
        type: "vendor",
      }));
    }

    // Handle list data
    if (data.list && Array.isArray(data.list)) {
      return data.list.slice(0, 10).map((item: any) => ({
        id: item.id || item.title || `item-${Math.random()}`,
        title: item.title || "Unknown",
        value: item.value || 0,
        subtitle:
          item.subtitle || `${(item.value || 0).toLocaleString()} items`,
        type: "list",
      }));
    }

    // Handle timeseries data (show recent points)
    if (data.timeseries && Array.isArray(data.timeseries)) {
      return data.timeseries.slice(-10).map((point: any, index: number) => ({
        id: `point-${index}`,
        title: new Date(point.timestamp || point.date).toLocaleDateString(),
        value: point.value || point.total || point.count || 0,
        subtitle: `${(point.value || point.total || point.count || 0).toLocaleString()} events`,
        type: "timeseries",
      }));
    }

    return [];
  }, [data]);

  if (!carouselData.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: carouselData.length > 3,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {carouselData.map((item: any) => (
            <CarouselItem
              key={item.id}
              className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <div className="h-32 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 h-full flex flex-col justify-between">
                  {/* Header with title */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold leading-tight line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Value display */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {typeof item.value === "number"
                        ? item.value.toLocaleString()
                        : item.value || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation buttons - only show if there are enough items */}
        {carouselData.length > 1 && (
          <>
            <CarouselPrevious className="left-0 h-8 w-8" />
            <CarouselNext className="right-0 h-8 w-8" />
          </>
        )}
      </Carousel>

      {/* Footer info */}
      <div className="flex justify-center mt-3">
        <p className="text-xs text-muted-foreground">
          {carouselData.length} item{carouselData.length !== 1 ? "s" : ""} •
          {carouselData.length > 1 ? " Use arrows to navigate" : ""}
        </p>
      </div>
    </div>
  );
});
CarouselRenderer.displayName = "CarouselRenderer";

// GaugeRenderer - displays data as circular gauges
export const GaugeRenderer = React.memo<{
  data: any;
  config: any;
  title: string;
  description?: string;
}>(({ data, config, title, description }) => {
  return <GaugeWidget widgetId={config?.id || "gauge"} />;
});
GaugeRenderer.displayName = "GaugeRenderer";

// AvatarListRenderer - displays data as a list with avatars
export const AvatarListRenderer = React.memo<{
  data: any;
  config: any;
  title: string;
  description?: string;
}>(({ data, config, title, description }) => {
  return <AvatarListWidget widgetId={config?.id || "avatar-list"} />;
});
AvatarListRenderer.displayName = "AvatarListRenderer";
