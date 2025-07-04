"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/ui-utils";

export interface CarouselWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function CarouselWidget({
  widgetId,
  className,
  onDelete,
}: CarouselWidgetProps) {
  return (
    <BaseWidget widgetId={widgetId} className={className} onDelete={onDelete}>
      {({ data, config }) => (
        <CarouselRenderer
          data={data}
          config={config}
          title={config?.title || "Carousel"}
          description={config?.description}
        />
      )}
    </BaseWidget>
  );
}

const CarouselRenderer: React.FC<{
  data: any;
  config?: any;
  title: string;
  description?: string;
}> = ({ data, config, title, description }) => {
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
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 px-4 py-4">
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
                <CarouselPrevious className="-left-10 h-8 w-8" />
                <CarouselNext className="-right-10 h-8 w-8" />
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
      </CardContent>
    </Card>
  );
};

CarouselWidget.displayName = "CarouselWidget";
