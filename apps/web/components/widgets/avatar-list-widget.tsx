"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/ui-utils";

export interface AvatarListWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function AvatarListWidget({
  widgetId,
  className,
  onDelete,
}: AvatarListWidgetProps) {
  return (
    <BaseWidget widgetId={widgetId} className={className} onDelete={onDelete}>
      {({ data, config }) => (
        <AvatarListRenderer
          data={data}
          config={config}
          title={config?.title || "Avatar List"}
          description={config?.description}
        />
      )}
    </BaseWidget>
  );
}

const AvatarListRenderer: React.FC<{
  data: any;
  config?: any;
  title: string;
  description?: string;
}> = ({ data, config, title, description }) => {
  // Transform data for avatar list
  const avatarData = React.useMemo(() => {
    if (!data) return [];

    // Handle list data
    if (data.list && Array.isArray(data.list)) {
      return data.list.slice(0, 8).map((item: any) => ({
        id: item.id || item.title,
        name: item.title,
        subtitle: item.subtitle || item.value,
        value: item.value,
        avatar: generateAvatar(item.title),
        severity: getSeverityFromText(item.title || item.subtitle || ""),
        badge: item.badge,
      }));
    }

    // Handle distribution data as contributors
    if (data.distribution && Array.isArray(data.distribution)) {
      return data.distribution.slice(0, 8).map((item: any) => ({
        id: item.label,
        name: item.label,
        subtitle: `${item.value.toLocaleString()} items`,
        value: item.value,
        avatar: generateAvatar(item.label),
        severity: getSeverityFromText(item.label),
      }));
    }

    // Handle timeseries data as activity feed
    if (data.timeseries && Array.isArray(data.timeseries)) {
      return data.timeseries.slice(-8).map((point: any, index: number) => ({
        id: `activity-${index}`,
        name: new Date(point.timestamp || point.date).toLocaleDateString(),
        subtitle: `${(point.value || point.total || point.count || 0).toLocaleString()} events`,
        value: point.value || point.total || point.count,
        avatar: generateAvatar(`Event ${index + 1}`),
        severity: "info" as const,
      }));
    }

    return [];
  }, [data]);

  function generateAvatar(text: string): { initials: string; color: string } {
    const words = text.trim().split(/\s+/);
    const initials =
      words.length > 1
        ? `${words[0]?.[0] || ""}${words[1]?.[0] || ""}`.toUpperCase()
        : text.slice(0, 2).toUpperCase();

    // Generate consistent color based on text
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];

    const colorIndex =
      text
        .split("")
        .reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0) %
      colors.length;

    return {
      initials,
      color: colors[colorIndex] || "bg-blue-500",
    };
  }

  function getSeverityFromText(
    text: string
  ): "critical" | "high" | "medium" | "low" | "info" {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("critical") || lowerText.includes("error"))
      return "critical";
    if (lowerText.includes("high") || lowerText.includes("warning"))
      return "high";
    if (lowerText.includes("medium")) return "medium";
    if (lowerText.includes("low")) return "low";
    return "info";
  }

  function getSeverityBadgeVariant(severity: string) {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "secondary";
      case "medium":
        return "outline";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  }

  if (!avatarData.length) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {avatarData.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className={cn("h-10 w-10", item.avatar.color)}>
                  <AvatarFallback className="text-white font-medium">
                    {item.avatar.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 ml-2">
                      {item.badge && (
                        <Badge
                          variant={getSeverityBadgeVariant(item.severity)}
                          className="text-xs"
                        >
                          {item.badge.text || item.severity}
                        </Badge>
                      )}
                      <span className="text-xs font-medium text-muted-foreground">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : item.value || ""}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}

            {avatarData.length === 8 && (
              <div className="flex items-center justify-center p-2">
                <p className="text-xs text-muted-foreground">
                  Showing top {avatarData.length} items
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

AvatarListRenderer.displayName = "AvatarListRenderer";

AvatarListWidget.displayName = "AvatarListWidget";
