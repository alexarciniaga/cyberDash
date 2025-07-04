"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { MetricCardRenderer } from "./widget-renderers";

export interface MetricCardWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function MetricCardWidget({
  widgetId,
  className,
  onDelete,
}: MetricCardWidgetProps) {
  return (
    <BaseWidget widgetId={widgetId} className={className} onDelete={onDelete}>
      {({ data, dateRange }) => (
        <MetricCardRenderer data={data} dateRange={dateRange} />
      )}
    </BaseWidget>
  );
}

MetricCardWidget.displayName = "MetricCardWidget";
