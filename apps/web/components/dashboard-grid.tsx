"use client";

import * as React from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { DashboardLayout, GridLayoutItem, WidgetConfig } from "@/lib/types";
import { MetricCardWidget } from "./widgets/metric-card-widget";
import { ChartWidget } from "./widgets/chart-widget";
import { TableWidget } from "./widgets/table-widget";
import { ListWidget } from "./widgets/list-widget";
import { VendorCardWidget } from "./widgets/vendor-card-widget";
import { getGridConfig } from "@/lib/config";

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";

// MODERN BEST PRACTICE: Memoize WidthProvider to prevent unnecessary re-renders
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  dashboard: DashboardLayout;
  onLayoutChange?: (
    layout: Layout[],
    layouts: { [key: string]: Layout[] }
  ) => void;
  onRemoveWidget?: (widgetId: string) => void;
  className?: string;
}

// Error boundary for individual widgets
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; widgetId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Widget ${this.props.widgetId} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full bg-destructive/10 rounded-lg border border-destructive/20 p-4 flex items-center justify-center">
          <div className="text-center">
            <span className="text-destructive text-sm font-medium">
              Widget Error
            </span>
            <p className="text-destructive/70 text-xs mt-1">
              Failed to load widget
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Generate responsive layouts based on widget configurations
// MODERN BEST PRACTICE: Follow official react-grid-layout responsive patterns
const generateResponsiveLayouts = (
  baseLayout: GridLayoutItem[]
): { [key: string]: Layout[] } => {
  return {
    lg: baseLayout, // 12 cols - use original layout
    md: baseLayout.map((item) => ({
      ...item,
      // Better scaling for 10 columns - maintain proportions
      w: Math.ceil((item.w * 10) / 12),
      x: Math.floor((item.x * 10) / 12),
    })),
    sm: baseLayout.map((item, index) => ({
      ...item,
      // 6 columns - create a more compact 2-column layout
      w: Math.min(Math.ceil((item.w * 6) / 12), 3),
      x: (index % 2) * 3,
      y: Math.floor(index / 2) * item.h,
    })),
    xs: baseLayout.map((item, index) => ({
      ...item,
      // 4 columns - single column, full width
      w: 4,
      x: 0,
      y: index * item.h,
    })),
    xxs: baseLayout.map((item, index) => ({
      ...item,
      // 2 columns - very compact layout for tiny screens
      w: 2,
      x: 0,
      y: index * item.h,
    })),
  };
};

export function DashboardGrid({
  dashboard,
  onLayoutChange,
  onRemoveWidget,
  className,
}: DashboardGridProps) {
  // Generate responsive layouts
  const responsiveLayouts = React.useMemo(
    () => generateResponsiveLayouts(dashboard.layout),
    [dashboard.layout]
  );

  const [layouts, setLayouts] = React.useState<{ [key: string]: Layout[] }>(
    responsiveLayouts
  );

  // Update layouts when dashboard changes
  React.useEffect(() => {
    setLayouts(generateResponsiveLayouts(dashboard.layout));
  }, [dashboard.layout]);

  // Simple layout change handler - react-grid-layout handles compaction automatically
  const handleLayoutChange = React.useCallback(
    (layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
      setLayouts(allLayouts);
      onLayoutChange?.(layout, allLayouts);
    },
    [onLayoutChange]
  );

  // MODERN BEST PRACTICE: Memoize children to prevent unnecessary re-renders
  const gridItems = React.useMemo(
    () =>
      dashboard.widgets.map((widget) => (
        <div key={widget.id} className="grid-item">
          <WidgetErrorBoundary widgetId={widget.id}>
            <div className="relative h-full group">
              {(() => {
                switch (widget.type) {
                  case "metric_card":
                    return (
                      <MetricCardWidget config={widget} className="h-full" />
                    );
                  case "vendor_card":
                    return (
                      <VendorCardWidget config={widget} className="h-full" />
                    );
                  case "chart":
                    return <ChartWidget config={widget} className="h-full" />;
                  case "table":
                    return <TableWidget config={widget} className="h-full" />;
                  case "list":
                    return <ListWidget config={widget} className="h-full" />;
                  default:
                    console.warn(
                      "🚨 Unknown widget type:",
                      widget.type,
                      "for widget:",
                      widget.id
                    );
                    return (
                      <div className="h-full bg-muted/50 rounded-lg border border-dashed border-muted-foreground/25 p-4 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-muted-foreground font-medium">
                            Unknown Widget
                          </span>
                          <p className="text-muted-foreground/70 text-sm mt-1">
                            Type: {widget.type}
                          </p>
                        </div>
                      </div>
                    );
                }
              })()}
              {onRemoveWidget && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveWidget(widget.id);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="absolute top-2 right-2 z-[1000] p-1.5 bg-destructive text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 shadow-lg border border-destructive-foreground/20 pointer-events-auto"
                  title="Remove widget"
                  style={{ pointerEvents: "auto" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ pointerEvents: "none" }}
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          </WidgetErrorBoundary>
        </div>
      )),
    [dashboard.widgets, onRemoveWidget]
  );

  // Get grid configuration
  const gridConfig = React.useMemo(() => getGridConfig(), []);

  return (
    <div className={className}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={gridConfig.breakpoints}
        cols={gridConfig.columns}
        rowHeight={gridConfig.rowHeight}
        margin={gridConfig.margin}
        containerPadding={gridConfig.containerPadding}
        // Standard react-grid-layout configuration for gap filling
        isDraggable={true}
        isResizable={true}
        useCSSTransforms={true}
        compactType="vertical" // Default - automatically fills gaps vertically
        preventCollision={false} // Default - allows items to move for compaction
        autoSize={true} // Default - container adjusts height to content
        resizeHandles={["se"]} // Default - southeast corner handle
        // MODERN BEST PRACTICE: Use CSS class for drag handle
        draggableHandle=".drag-handle"
      >
        {gridItems}
      </ResponsiveGridLayout>
    </div>
  );
}

// Export helper functions for external use
export { generateResponsiveLayouts, WidgetErrorBoundary };
