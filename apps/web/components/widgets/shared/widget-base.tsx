"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVerticalIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/ui-utils";

// Shared Loading Skeleton Component
export const LoadingSkeleton = React.memo(() => (
  <div className="space-y-1.5">
    <div className="animate-pulse bg-muted rounded-md h-8 w-20"></div>
    <div className="space-y-0.5">
      <div className="animate-pulse bg-muted rounded h-2.5 w-24"></div>
    </div>
  </div>
));
LoadingSkeleton.displayName = "LoadingSkeleton";

// Shared Error State Component
export const ErrorState = React.memo(() => (
  <div className="space-y-1.5">
    <div className="text-2xl font-bold text-destructive">—</div>
    <div className="space-y-0.5">
      <p className="text-xs text-destructive/80 font-medium">
        Failed to load data
      </p>
    </div>
  </div>
));
ErrorState.displayName = "ErrorState";

// Shared Widget Header Component
export const WidgetHeader = React.memo<{
  title: string;
  description?: string;
  onDelete?: () => void;
}>(({ title, description, onDelete }) => (
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
    <CardTitle className="text-sm font-medium text-muted-foreground flex flex-col">
      {title}
      {description && (
        <span className="text-xs text-muted-foreground leading-tight">
          {description}
        </span>
      )}
    </CardTitle>
    <div className="flex items-center gap-1">
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground/60 hover:text-destructive"
          title="Remove widget"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
      <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing hover:text-muted-foreground/60 transition-colors" />
      </div>
    </div>
  </CardHeader>
));
WidgetHeader.displayName = "WidgetHeader";

// Shared Empty State Component
export const EmptyState = React.memo<{
  icon?: string;
  title?: string;
  description?: string;
  dataSource?: string;
}>(({ icon = "📋", title = "No data available", description, dataSource }) => {
  const isMitreWidget = dataSource === "mitre";

  const defaultDescription = isMitreWidget
    ? "MITRE ATT&CK updates less frequently. Try expanding the date range to see more results, or check back later."
    : "No data available for the selected date range.";

  return (
    <div className="h-full w-full flex items-center justify-center text-muted-foreground min-h-[200px]">
      <div className="text-center space-y-3 p-4">
        <div className="text-4xl opacity-50">{icon}</div>
        <div className="space-y-2">
          <span className="text-sm font-medium block">{title}</span>
          <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto leading-relaxed">
            {description || defaultDescription}
          </p>
        </div>
      </div>
    </div>
  );
});
EmptyState.displayName = "EmptyState";

// Widget Container with common layout and loading states
export const WidgetContainer = React.memo<{
  config?: any;
  isLoading?: boolean;
  error?: any;
  children: React.ReactNode;
  className?: string;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType;
  onDelete?: () => void;
}>(
  ({
    config,
    isLoading,
    error,
    children,
    className,
    loadingComponent: LoadingComponent = LoadingSkeleton,
    errorComponent: ErrorComponent = ErrorState,
    onDelete,
  }) => {
    // Show skeleton while config is loading
    if (!config) {
      return (
        <Card className={cn("h-full overflow-hidden", className)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent className="pt-0 pb-3 h-full overflow-hidden">
            <LoadingComponent />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("h-full overflow-hidden flex flex-col", className)}>
        <WidgetHeader
          title={config.title}
          description={config.description}
          onDelete={onDelete}
        />
        <CardContent className="pt-0 pb-3 flex-1 overflow-hidden">
          {isLoading && <LoadingComponent />}
          {error && <ErrorComponent />}
          {!isLoading && !error && children}
        </CardContent>
      </Card>
    );
  }
);
WidgetContainer.displayName = "WidgetContainer";

// List-specific loading skeleton
export const ListSkeleton = React.memo(() => (
  <div className="h-full flex flex-col space-y-3 py-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="flex-1 h-6 bg-muted animate-pulse rounded" />
        <div className="w-20 h-6 bg-muted animate-pulse rounded" />
      </div>
    ))}
  </div>
));
ListSkeleton.displayName = "ListSkeleton";

// Table-specific loading skeleton
export const TableSkeleton = React.memo(() => (
  <div className="h-full flex flex-col space-y-3 py-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="flex-1 h-6 bg-muted animate-pulse rounded" />
        <div className="w-20 h-6 bg-muted animate-pulse rounded" />
        <div className="w-16 h-6 bg-muted animate-pulse rounded" />
      </div>
    ))}
  </div>
));
TableSkeleton.displayName = "TableSkeleton";

// Chart-specific loading skeleton
export const ChartSkeleton = React.memo(() => (
  <Skeleton className="w-full h-full" />
));
ChartSkeleton.displayName = "ChartSkeleton";

// List-specific error state
export const ListError = React.memo(() => (
  <div className="h-full bg-destructive/10 rounded border border-destructive/20 flex items-center justify-center">
    <div className="text-center">
      <span className="text-destructive text-sm font-medium">List Error</span>
      <p className="text-destructive/70 text-xs mt-1">
        Failed to load list data
      </p>
    </div>
  </div>
));
ListError.displayName = "ListError";

// Table-specific error state
export const TableError = React.memo(() => (
  <div className="h-full bg-destructive/10 rounded border border-destructive/20 flex items-center justify-center">
    <div className="text-center">
      <span className="text-destructive text-sm font-medium">Table Error</span>
      <p className="text-destructive/70 text-xs mt-1">
        Failed to load table data
      </p>
    </div>
  </div>
));
TableError.displayName = "TableError";
