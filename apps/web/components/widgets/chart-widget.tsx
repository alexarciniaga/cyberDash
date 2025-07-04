"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { ChartRenderer } from "./widget-renderers";
import { ChartSkeleton } from "./shared/widget-base";

export interface ChartWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function ChartWidget({
  widgetId,
  className,
  onDelete,
}: ChartWidgetProps) {
  return (
    <BaseWidget
      widgetId={widgetId}
      className={className}
      loadingComponent={ChartSkeleton}
      onDelete={onDelete}
    >
      {({ data, config }) => (
        <ChartRenderer
          data={data}
          config={config}
          dataSource={config?.dataSource}
        />
      )}
    </BaseWidget>
  );
}
