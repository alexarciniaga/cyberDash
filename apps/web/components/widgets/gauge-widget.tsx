"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/ui-utils";

export interface GaugeWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function GaugeWidget({
  widgetId,
  className,
  onDelete,
}: GaugeWidgetProps) {
  return (
    <BaseWidget widgetId={widgetId} className={className} onDelete={onDelete}>
      {({ data, config }) => (
        <GaugeRenderer
          data={data}
          config={config}
          title={config?.title || "Gauge"}
          description={config?.description}
        />
      )}
    </BaseWidget>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#3b82f6",
  backgroundColor = "#e5e7eb",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-blue-600 transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

const GaugeRenderer: React.FC<{
  data: any;
  config?: any;
  title: string;
  description?: string;
}> = ({ data, config, title, description }) => {
  // Transform data for gauge
  const gaugeData = React.useMemo(() => {
    if (!data)
      return { value: 0, percentage: 0, color: "#3b82f6", label: "No data" };

    // Handle single metric data
    if (data.value) {
      const value = data.value.value || 0;
      const maxValue = config?.maxValue || 100;
      const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

      return {
        value,
        percentage,
        color: getGaugeColor(percentage),
        label: data.value.label || title,
        change: data.value.changePercent,
      };
    }

    // Handle distribution data (show first item as main metric)
    if (
      data.distribution &&
      Array.isArray(data.distribution) &&
      data.distribution.length > 0
    ) {
      const firstItem = data.distribution[0];
      const total = data.distribution.reduce(
        (sum: number, item: any) => sum + (item.value || 0),
        0
      );
      const percentage =
        total > 0 ? Math.round((firstItem.value / total) * 100) : 0;

      return {
        value: firstItem.value,
        percentage,
        color: getGaugeColor(percentage),
        label: firstItem.label,
      };
    }

    return { value: 0, percentage: 0, color: "#3b82f6", label: "No data" };
  }, [data, config, title]);

  function getGaugeColor(percentage: number): string {
    if (percentage >= 90) return "#ef4444"; // red
    if (percentage >= 75) return "#f97316"; // orange
    if (percentage >= 50) return "#eab308"; // yellow
    if (percentage >= 25) return "#3b82f6"; // blue
    return "#10b981"; // green
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <CircularProgress
          value={gaugeData.percentage}
          color={gaugeData.color}
          size={100}
          strokeWidth={6}
        >
          <div className="text-center">
            <div className="text-lg font-bold">
              {gaugeData.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(gaugeData.percentage)}%
            </div>
          </div>
        </CircularProgress>

        <div className="text-center space-y-1 w-full">
          <p className="text-sm font-medium truncate">{gaugeData.label}</p>

          {gaugeData.change !== undefined && (
            <div className="flex items-center justify-center text-xs">
              <span
                className={cn(
                  "font-medium",
                  gaugeData.change >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {gaugeData.change >= 0 ? "+" : ""}
                {gaugeData.change.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          )}
        </div>

        {/* Performance indicator bars */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Performance</span>
            <span>
              {gaugeData.percentage >= 75
                ? "Good"
                : gaugeData.percentage >= 50
                  ? "Fair"
                  : "Needs Attention"}
            </span>
          </div>
          <Progress value={gaugeData.percentage} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
};

GaugeWidget.displayName = "GaugeWidget";
