"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVerticalIcon, ExternalLinkIcon, CalendarIcon } from "lucide-react";
import { WidgetConfig } from "@/lib/types";
import { useMetricData } from "@/lib/hooks/use-metric-data";
import {
  useVulnerabilityData,
  useVulnerabilityDataForDate,
} from "@/lib/hooks/use-vulnerability-data";
import { ProductDistributionWidget } from "./product-distribution-widget";
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
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

interface ChartWidgetProps {
  config: WidgetConfig;
  className?: string;
}

// Memoized vulnerability details component for the split-panel layout
const VulnerabilityDetailsPanel = React.memo<{
  vulnerabilities: any[];
  loading: boolean;
  dateRange: { start: string; end: string } | null;
  hoveredDate: string | null;
  hoveredVulns: any[];
  pulseAnimation: boolean;
}>(function VulnerabilityDetailsPanel({
  vulnerabilities,
  loading,
  dateRange,
  hoveredDate,
  hoveredVulns,
  pulseAnimation,
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const vulnerabilityRefs = React.useRef<Map<number, HTMLDivElement>>(
    new Map()
  );

  // Memoized function to check if a vulnerability matches the hovered date
  const isVulnerabilityMatchingHoveredDate = React.useCallback(
    (vuln: any) => {
      if (!hoveredDate || !vuln.dateAdded) return false;

      const vulnDate = new Date(vuln.dateAdded);
      const hoveredDateObj = new Date(hoveredDate);

      // Compare dates (same day, ignoring time)
      return (
        vulnDate.getFullYear() === hoveredDateObj.getFullYear() &&
        vulnDate.getMonth() === hoveredDateObj.getMonth() &&
        vulnDate.getDate() === hoveredDateObj.getDate()
      );
    },
    [hoveredDate]
  );

  // Get matching vulnerabilities and their indices for the hovered date
  const matchingVulnerabilitiesData = React.useMemo(() => {
    if (!hoveredDate) return { vulnerabilities: [], firstIndex: -1 };

    const matching = [];
    let firstIndex = -1;

    for (let i = 0; i < vulnerabilities.length; i++) {
      if (isVulnerabilityMatchingHoveredDate(vulnerabilities[i])) {
        matching.push(vulnerabilities[i]);
        if (firstIndex === -1) {
          firstIndex = i;
        }
      }
    }

    return { vulnerabilities: matching, firstIndex };
  }, [vulnerabilities, hoveredDate, isVulnerabilityMatchingHoveredDate]);

  // Scroll to first matching vulnerability when hovering
  React.useEffect(() => {
    if (hoveredDate && matchingVulnerabilitiesData.firstIndex !== -1) {
      const element = vulnerabilityRefs.current.get(
        matchingVulnerabilitiesData.firstIndex
      );
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [hoveredDate, matchingVulnerabilitiesData.firstIndex]);

  if (!dateRange) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center space-y-2">
          <CalendarIcon className="h-8 w-8 mx-auto opacity-50" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Loading vulnerability data...</p>
            <p className="text-xs text-muted-foreground">
              Analyzing vulnerabilities across the chart period
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const startDate = new Date(dateRange.start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endDate = new Date(dateRange.end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isHovering = hoveredDate !== null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className={`p-3 border-b flex-shrink-0 transition-colors ${
          isHovering ? "bg-blue-50 dark:bg-blue-950/30" : "bg-muted/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            All Vulnerabilities: {startDate} - {endDate}
          </span>
          <Badge variant="secondary">{vulnerabilities.length} total</Badge>
          {isHovering && (
            <>
              <Badge variant="outline" className="text-xs">
                {matchingVulnerabilitiesData.vulnerabilities.length} on{" "}
                {new Date(hoveredDate!).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Badge>
              <Badge variant="default" className="text-xs bg-blue-600">
                Highlighting
              </Badge>
            </>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-3">
        {vulnerabilities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">
              No vulnerabilities found in the selected time range
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vulnerabilities.map((vuln, index) => {
              const isMatching = isVulnerabilityMatchingHoveredDate(vuln);
              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) {
                      vulnerabilityRefs.current.set(index, el);
                    } else {
                      vulnerabilityRefs.current.delete(index);
                    }
                  }}
                  className={`p-3 border rounded-lg bg-card hover:bg-muted/30 transition-all ${
                    isMatching && isHovering
                      ? "animate-pulse ring-2 ring-blue-400 ring-opacity-50 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                      : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vuln.cveID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1"
                      >
                        {vuln.cveID}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                      {vuln.knownRansomwareCampaignUse && (
                        <Badge variant="destructive" className="text-xs">
                          ⚠️ Ransomware
                        </Badge>
                      )}
                      {isMatching && isHovering && (
                        <Badge
                          variant="default"
                          className="text-xs bg-blue-600"
                        >
                          📍 Hovered Date
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm">
                      <span className="font-medium text-foreground">
                        {vuln.vendorProject}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        - {vuln.product}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {vuln.shortDescription}
                    </p>

                    {vuln.dueDate && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">
                          Due Date:{" "}
                        </span>
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          {new Date(vuln.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="text-xs bg-muted/50 p-2 rounded">
                      <span className="font-medium text-foreground">
                        Required Action:{" "}
                      </span>
                      <span className="text-muted-foreground">
                        {vuln.requiredAction}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
VulnerabilityDetailsPanel.displayName = "VulnerabilityDetailsPanel";

// Memoized vulnerability insights widget component
const VulnerabilityInsightsWidget = React.memo<ChartWidgetProps>(
  function VulnerabilityInsightsWidget({ config, className }) {
    const {
      data: metricData,
      isLoading,
      error,
    } = useMetricData({
      dataSource: config.dataSource,
      metricId: config.metricId || "total_count",
      refreshInterval: config.refreshInterval || 60,
    });

    const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);
    const [pulseAnimation, setPulseAnimation] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<{
      start: string;
      end: string;
    } | null>(null);

    // Use cached hook for all vulnerabilities in the date range
    const {
      data: allVulnerabilities,
      loading: loadingAllVulns,
      error: vulnerabilityError,
    } = useVulnerabilityData(
      dateRange?.start || null,
      dateRange?.end || null,
      100 // Use the API maximum
    );

    // Use cached hook for hovered date vulnerabilities
    const { data: hoveredVulnerabilities, loading: loadingHovered } =
      useVulnerabilityDataForDate(hoveredDate, !!hoveredDate);

    const chartData = React.useMemo(() => {
      if (!metricData?.timeseries) {
        return [];
      }

      return metricData.timeseries.map((point) => {
        if ("timestamp" in point && "value" in point && point.timestamp) {
          return {
            name: new Date(point.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: point.value,
            timestamp: point.timestamp,
          };
        }
        return {
          name: "Unknown",
          value: 0,
          timestamp: null,
        };
      });
    }, [metricData]);

    // Calculate date range when chart data loads
    React.useEffect(() => {
      if (chartData.length > 0) {
        const validPoints = chartData.filter((point) => point.timestamp);
        if (validPoints.length > 0) {
          const timestamps = validPoints.map((point) =>
            new Date(point.timestamp!).getTime()
          );
          const startTimestamp = Math.min(...timestamps);
          const endTimestamp = Math.max(...timestamps);

          const range = {
            start: new Date(startTimestamp).toISOString(),
            end: new Date(endTimestamp).toISOString(),
          };

          setDateRange(range);
        }
      }
    }, [chartData]);

    const handleChartClick = React.useCallback((data: any) => {
      // Chart clicks can be used for other functionality if needed
      console.log("Chart clicked:", data);
    }, []);

    // Handle chart hover for live preview
    const handleChartHover = React.useCallback((data: any) => {
      if (data && data.timestamp) {
        setHoveredDate(data.timestamp);
        setPulseAnimation(true);
        // Keep pulse animation for a short duration
        setTimeout(() => setPulseAnimation(false), 1000);
      }
    }, []);

    const handleChartLeave = React.useCallback(() => {
      setHoveredDate(null);
      setPulseAnimation(false);
    }, []);

    // Memoize the chart mouse move handler
    const handleChartMouseMove = React.useCallback(
      (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
          handleChartHover(data.activePayload[0].payload);
        }
      },
      [handleChartHover]
    );

    if (isLoading) {
      return (
        <Card className={`${className} h-full flex flex-col overflow-hidden`}>
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
            <div className="h-32 bg-muted animate-pulse m-3 rounded" />
            <div className="flex-1 p-3 space-y-3">
              <Skeleton className="h-4 w-32" />
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className={`${className} h-full flex flex-col overflow-hidden`}>
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-destructive text-sm font-medium">
                Failed to load data
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`${className} h-full flex flex-col overflow-x-hidden`}>
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

        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          {/* Chart Section */}
          <div className="h-[200px] border-b bg-muted/20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
                onClick={handleChartClick}
                onMouseMove={handleChartMouseMove}
                onMouseLeave={handleChartLeave}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  tickMargin={5}
                  axisLine={false}
                  height={20}
                />
                <YAxis
                  fontSize={10}
                  tickMargin={5}
                  axisLine={false}
                  width={25}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-2">
                          <p className="text-xs font-medium">{`${label} : ${payload[0].value}`}</p>
                          <p className="text-xs text-muted-foreground">
                            Scroll down to view vulnerabilities for this day
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: "#2563eb", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Vulnerability Details Panel */}
          <div className="flex-1 min-h-0">
            <VulnerabilityDetailsPanel
              vulnerabilities={allVulnerabilities || []}
              loading={loadingAllVulns}
              dateRange={dateRange}
              hoveredDate={hoveredDate}
              hoveredVulns={hoveredVulnerabilities || []}
              pulseAnimation={pulseAnimation}
            />
          </div>
        </CardContent>
      </Card>
    );
  }
);
VulnerabilityInsightsWidget.displayName = "VulnerabilityInsightsWidget";

export const ChartWidget = React.memo<ChartWidgetProps>(function ChartWidget({
  config,
  className,
}) {
  // Use specialized vulnerability widget for CISA new vulnerabilities rate
  if (config.dataSource === "cisa" && config.metricId === "new_vulns_rate") {
    return (
      <VulnerabilityInsightsWidget config={config} className={className} />
    );
  }

  // Use specialized product distribution widget for CISA product distribution
  if (
    config.dataSource === "cisa" &&
    config.metricId === "product_distribution"
  ) {
    return <ProductDistributionWidget config={config} className={className} />;
  }

  // Original chart widget for all other chart types
  const {
    data: metricData,
    isLoading,
    error,
  } = useMetricData({
    dataSource: config.dataSource,
    metricId: config.metricId || "total_count",
    refreshInterval: config.refreshInterval || 60,
  });

  const chartData = React.useMemo(() => {
    // Handle distribution data (for product distribution, vendor breakdown, etc.)
    if (metricData?.distribution) {
      // For pie charts, group smaller items to avoid overcrowding
      if (shouldUsePieChart && metricData.distribution.length > 8) {
        const sortedData = [...metricData.distribution].sort(
          (a, b) => b.value - a.value
        );
        const topItems = sortedData.slice(0, 7);
        const otherItems = sortedData.slice(7);
        const otherTotal = otherItems.reduce(
          (sum, item) => sum + item.value,
          0
        );

        const processedData = topItems.map((item, index) => {
          const truncatedLabel =
            item.label.length > 25
              ? item.label.substring(0, 22) + "..."
              : item.label;

          return {
            name: truncatedLabel,
            fullName: item.label,
            value: item.value,
            index: index,
          };
        });

        if (otherTotal > 0) {
          processedData.push({
            name: "Others",
            fullName: `Others (${otherItems.length} products)`,
            value: otherTotal,
            index: 7,
            isOthersGroup: true,
            otherItems: otherItems,
          } as any);
        }

        return processedData;
      } else {
        return metricData.distribution.map((item, index) => {
          // Truncate long labels for better chart display
          const truncatedLabel =
            item.label.length > 25
              ? item.label.substring(0, 22) + "..."
              : item.label;

          return {
            name: truncatedLabel,
            fullName: item.label, // Keep full name for tooltip
            value: item.value,
            index: index,
          };
        });
      }
    }

    // Handle timeseries data (for time-based charts)
    if (!metricData?.timeseries) {
      return [];
    }

    return metricData.timeseries.map((point) => {
      // Handle different data formats from various APIs
      if ("timestamp" in point && "value" in point && point.timestamp) {
        // Standard timeseries format
        return {
          name: new Date(point.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          value: point.value,
          timestamp: point.timestamp,
        };
      } else if ("date" in point) {
        // NVD publication trends format
        const pointData = point as any;
        const dateValue = pointData.date;
        return {
          name: dateValue
            ? new Date(dateValue).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "Unknown",
          value: pointData.total || pointData.count || 0,
          timestamp: dateValue,
          critical: pointData.critical || 0,
          high: pointData.high || 0,
          medium: pointData.medium || 0,
          low: pointData.low || 0,
        };
      } else {
        // Fallback for unknown formats
        return {
          name: "Unknown",
          value: 0,
        };
      }
    });
  }, [metricData]);

  // Determine chart type based on config and data type
  const chartType = React.useMemo(() => {
    if (config.chartType === "pie") return "pie";
    if (config.chartType === "bar") return "bar";
    if (config.chartType === "line") return "line";

    // Default logic: use bar chart for distribution data, line chart for timeseries
    if (metricData?.distribution && config.chartType !== "line") return "bar";
    return "line";
  }, [config.chartType, metricData?.distribution]);

  const shouldUsePieChart = chartType === "pie";
  const shouldUseBarChart = chartType === "bar";

  // Define color palette for pie chart
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
  ];

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
          <Skeleton className="flex-1 min-h-[180px] w-full" />
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
              <div className="text-4xl opacity-50">📊</div>
              <div className="space-y-1">
                <span className="text-sm font-medium">No recent data</span>
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
      <CardContent className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden">
        <div className="flex-1 min-h-[180px] w-full overflow-hidden relative">
          <ResponsiveContainer width="100%" height="100%">
            {shouldUsePieChart ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload?.fullName || name || "Value",
                  ]}
                />
                <Legend />
              </PieChart>
            ) : shouldUseBarChart ? (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tickMargin={5}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  tickMargin={5}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload?.fullName || name || "Value",
                  ]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tickMargin={5}
                  axisLine={false}
                />
                <YAxis
                  fontSize={11}
                  tickMargin={5}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload?.fullName || name || "Value",
                  ]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
ChartWidget.displayName = "ChartWidget";
