"use client";

import * as React from "react";
import { BaseWidget } from "./base-widget";
import { ListRenderer } from "./widget-renderers";
import { ListSkeleton, ListError } from "./shared/widget-base";

export interface ListWidgetProps {
  widgetId: string;
  className?: string;
  onDelete?: () => void;
}

export function ListWidget({ widgetId, className, onDelete }: ListWidgetProps) {
  return (
    <BaseWidget
      widgetId={widgetId}
      className={className}
      loadingComponent={ListSkeleton}
      errorComponent={ListError}
      onDelete={onDelete}
    >
      {({ data, config }) => <ListRenderer data={data} config={config} />}
    </BaseWidget>
  );
}

ListWidget.displayName = "ListWidget";
