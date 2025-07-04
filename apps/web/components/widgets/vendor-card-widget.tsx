"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { VendorCardRenderer } from "./widget-renderers";

export interface VendorCardWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function VendorCardWidget({
  widgetId,
  className,
  onDelete,
}: VendorCardWidgetProps) {
  return (
    <BaseWidget widgetId={widgetId} className={className} onDelete={onDelete}>
      {({ data, dateRange }) => (
        <VendorCardRenderer data={data} dateRange={dateRange} />
      )}
    </BaseWidget>
  );
}

VendorCardWidget.displayName = "VendorCardWidget";
