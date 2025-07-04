"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GripVerticalIcon } from "lucide-react";
import { WidgetConfig, TableData } from "@/lib/types";
import { useMetricData } from "@/lib/hooks/use-metric-data";
import { cn } from "@/lib/ui-utils";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { useVulnerabilityData } from "@/lib/hooks/use-vulnerability-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for distribution data formats
interface VendorBreakdownItem {
  label: string;
  value: number;
}

interface TacticsItem {
  name: string;
  techniqueCount: number;
  shortName?: string;
}

export interface TableWidgetProps {
  widgetId: string;
  className?: string;
}

// Type guards
const isVendorBreakdownItem = (item: unknown): item is VendorBreakdownItem => {
  return (
    typeof item === "object" &&
    item !== null &&
    "label" in item &&
    "value" in item
  );
};

const isTacticsItem = (item: unknown): item is TacticsItem => {
  return (
    typeof item === "object" &&
    item !== null &&
    "name" in item &&
    "techniqueCount" in item
  );
};

// Helper function to transform distribution data to table format - pure function, no hooks needed
function transformDistributionToTable(
  distribution: unknown[]
): TableData | null {
  if (!Array.isArray(distribution) || distribution.length === 0) {
    return null;
  }

  const firstItem = distribution[0];

  // Handle CISA vendor breakdown format
  if (isVendorBreakdownItem(firstItem)) {
    return {
      headers: ["Vendor", "Count"],
      rows: distribution.map((item) => [
        String((item as VendorBreakdownItem).label || "Unknown"),
        String((item as VendorBreakdownItem).value || 0),
      ]),
    };
  }

  // Handle MITRE tactics format
  if (isTacticsItem(firstItem)) {
    return {
      headers: ["Tactic", "Techniques", "Short Name"],
      rows: distribution.map((item) => [
        String((item as TacticsItem).name || "Unknown"),
        String((item as TacticsItem).techniqueCount || 0),
        String((item as TacticsItem).shortName || "N/A"),
      ]),
    };
  }

  return null;
}

// Memoized loading skeleton component
const TableSkeleton = React.memo(() => (
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

// Memoized error display component
const TableError = React.memo(() => (
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

// Memoized empty state component
const EmptyTable = React.memo(() => (
  <div className="h-full flex items-center justify-center text-muted-foreground">
    <div className="text-center">
      <span className="text-sm">No data available</span>
    </div>
  </div>
));
EmptyTable.displayName = "EmptyTable";

// Memoized widget header component
const WidgetHeader = React.memo<{
  title: string;
  description?: string;
}>(({ title, description }) => (
  <CardHeader className="pb-2">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium flex flex-col">
        {title}
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </CardTitle>
      <div className="drag-handle cursor-move p-1 hover:bg-muted/50 rounded transition-colors">
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors" />
      </div>
    </div>
  </CardHeader>
));
WidgetHeader.displayName = "WidgetHeader";

// Memoized table cell component
const TableCellMemo = React.memo<{
  cell: string;
  columnWidth: string;
}>(({ cell, columnWidth }) => (
  <TableCell className="text-xs px-3 py-2" style={{ width: columnWidth }}>
    <div className="truncate" title={cell}>
      {cell}
    </div>
  </TableCell>
));
TableCellMemo.displayName = "TableCellMemo";

// Memoized table row component
const TableRowMemo = React.memo<{
  row: string[];
  rowIndex: number;
  columnWidth: string;
}>(({ row, rowIndex, columnWidth }) => (
  <TableRow>
    {row.map((cell, cellIndex) => (
      <TableCellMemo
        key={`cell-${rowIndex}-${cellIndex}`}
        cell={cell}
        columnWidth={columnWidth}
      />
    ))}
  </TableRow>
));
TableRowMemo.displayName = "TableRowMemo";

// Memoized main table display component
const TableDisplay = React.memo<{ data: TableData }>(({ data }) => {
  const columnWidth = React.useMemo(
    () => `${100 / data.headers.length}%`,
    [data.headers.length]
  );

  return (
    <div className="relative w-full h-full overflow-hidden rounded-md border">
      <div className="h-full overflow-x-auto overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {data.headers.map((header, index) => (
                <TableHead
                  key={`header-${index}`}
                  className="text-xs font-semibold px-3 py-2 border-b"
                  style={{ width: columnWidth }}
                >
                  <div className="truncate" title={header}>
                    {header}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRowMemo
                key={`row-${rowIndex}`}
                row={row}
                rowIndex={rowIndex}
                columnWidth={columnWidth}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
TableDisplay.displayName = "TableDisplay";

// Main component
export function TableWidget({ widgetId, className }: TableWidgetProps) {
  const config = useDashboardStore((state) =>
    state.dashboard?.widgets.find((w) => w.id === widgetId)
  );

  const { data, isLoading, error } = useMetricData({
    dataSource: config?.dataSource,
    metricId: config?.metricId,
    enabled: !!config,
  });

  if (!config) {
    return <Skeleton className={cn("h-full w-full", className)} />;
  }

  // Transform data to table format with memoization
  const tableData = React.useMemo((): TableData | null => {
    if (data?.table) {
      return data.table;
    }

    if (data?.distribution) {
      return transformDistributionToTable(data.distribution);
    }

    return null;
  }, [data]);

  // Memoize header props
  const headerProps = React.useMemo(
    () => ({
      title: config.title,
      description: config.description,
    }),
    [config.title, config.description]
  );

  return (
    <Card className={cn("w-full h-full flex flex-col", className)}>
      <WidgetHeader {...headerProps} />
      <CardContent className="p-3 flex-1 flex flex-col min-h-0">
        {isLoading && (
          <div className="flex-1 min-h-0">
            <TableSkeleton />
          </div>
        )}

        {error && (
          <div className="flex-1 min-h-0">
            <TableError />
          </div>
        )}

        {!isLoading && !error && tableData && (
          <div className="flex-1 min-h-0">
            <TableDisplay data={tableData} />
          </div>
        )}

        {!isLoading && !error && !tableData && (
          <div className="flex-1 min-h-0">
            <EmptyTable />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

TableWidget.displayName = "TableWidget";
