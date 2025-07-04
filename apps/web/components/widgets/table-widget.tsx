"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { TableRenderer } from "./widget-renderers";
import { TableSkeleton, TableError } from "./shared/widget-base";

export interface TableWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function TableWidget({
  widgetId,
  className,
  onDelete,
}: TableWidgetProps) {
  return (
    <BaseWidget
      widgetId={widgetId}
      className={className}
      loadingComponent={TableSkeleton}
      errorComponent={TableError}
      onDelete={onDelete}
    >
      {({ data, config }) => <TableRenderer data={data} config={config} />}
    </BaseWidget>
  );
}

TableWidget.displayName = "TableWidget";
