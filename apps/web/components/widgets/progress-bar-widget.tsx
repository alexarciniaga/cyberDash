"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/ui-utils";

export interface ProgressBarWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function ProgressBarWidget({
  widgetId,
  className,
  onDelete,
}: ProgressBarWidgetProps) {
  return (
    <BaseWidget widgetId={widgetId} className={className} onDelete={onDelete}>
      {({ data, config }) => (
        <ProgressBarRenderer
          data={data}
          config={config}
          title={config?.title || "Progress Bars"}
          description={config?.description}
        />
      )}
    </BaseWidget>
  );
}

const ProgressBarRenderer: React.FC<{
  data: any;
  config?: any;
  title: string;
  description?: string;
}> = ({ data, config, title, description }) => {
  // Transform data for progress bars
  const progressData = React.useMemo(() => {
    if (!data) return [];

    // Handle distribution data
    if (data.distribution && Array.isArray(data.distribution)) {
      const total = data.distribution.reduce(
        (sum: number, item: any) => sum + (item.value || 0),
        0
      );

      return data.distribution.slice(0, 6).map((item: any) => ({
        label: item.label,
        value: item.value,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
        color: getProgressColor(item.label, item.value, total),
      }));
    }

    // Handle single metric data
    if (data.value) {
      const percentage = Math.min(Math.max(data.value.value || 0, 0), 100);
      return [
        {
          label: title,
          value: data.value.value,
          percentage,
          color: getProgressColor("default", percentage, 100),
        },
      ];
    }

    return [];
  }, [data, title]);

  function getProgressColor(
    label: string,
    value: number,
    total: number
  ): string {
    const percentage = (value / total) * 100;

    // Color based on severity or common cybersecurity terms
    if (
      label.toLowerCase().includes("critical") ||
      label.toLowerCase().includes("high")
    ) {
      return "bg-red-500";
    }
    if (
      label.toLowerCase().includes("medium") ||
      label.toLowerCase().includes("warning")
    ) {
      return "bg-yellow-500";
    }
    if (
      label.toLowerCase().includes("low") ||
      label.toLowerCase().includes("info")
    ) {
      return "bg-blue-500";
    }
    if (
      label.toLowerCase().includes("success") ||
      label.toLowerCase().includes("resolved")
    ) {
      return "bg-green-500";
    }

    // Gradient based on percentage
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-500";
    if (percentage >= 40) return "bg-yellow-500";
    if (percentage >= 20) return "bg-blue-500";
    return "bg-green-500";
  }

  if (!progressData.length) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="space-y-4 py-4">
        {progressData.map((item: any, index: number) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate flex-1 mr-2">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {item.value.toLocaleString()}
                </Badge>
                <span className="text-muted-foreground min-w-[3ch]">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress value={item.percentage} className="h-2" />
              <div
                className={cn(
                  "absolute top-0 left-0 h-2 rounded-full transition-all",
                  item.color
                )}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}

        {progressData.length > 1 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total items</span>
              <span>
                {progressData
                  .reduce((sum: number, item: any) => sum + item.value, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

ProgressBarWidget.displayName = "ProgressBarWidget";
