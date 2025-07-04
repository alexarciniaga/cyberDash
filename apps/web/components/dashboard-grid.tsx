"use client";

import * as React from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { DashboardLayout, GridLayoutItem, WidgetConfig } from "@/lib/types";
import { MetricCardWidget } from "./widgets/metric-card-widget";
import { ChartWidget } from "./widgets/chart-widget";
import { TableWidget } from "./widgets/table-widget";
import { ListWidget } from "./widgets/list-widget";
import { VendorCardWidget } from "./widgets/vendor-card-widget";
import { ProgressBarWidget } from "./widgets/progress-bar-widget";
import { CarouselWidget } from "./widgets/carousel-widget";
import { GaugeWidget } from "./widgets/gauge-widget";
import { AvatarListWidget } from "./widgets/avatar-list-widget";
import { getGridConfig } from "@/lib/config";
import { useUpdateDashboard } from "@/lib/hooks/use-dashboards";
import { useDebouncedCallback } from "use-debounce";
import { useDashboardContext } from "@/contexts/app-context";

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";

// BEST PRACTICE: Create ResponsiveGridLayout outside component to prevent re-creation
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  dashboardId: string;
  onRemoveWidget?: (widgetId: string) => void;
}

// Error boundary for individual widgets
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string; widgetType: string },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Widget error in ${this.props.widgetType} (${this.props.widgetId}):`,
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full bg-muted/50 rounded-lg border border-dashed border-muted-foreground/25 p-4 flex items-center justify-center">
          <div className="text-center">
            <span className="text-muted-foreground font-medium">
              Widget Error
            </span>
            <p className="text-muted-foreground/70 text-sm mt-1">
              {this.props.widgetType} failed to load
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// BEST PRACTICE: Optimized responsive layout generation
// Generates layouts for all breakpoints based on base layout
const generateResponsiveLayouts = (
  baseLayout: GridLayoutItem[]
): { [key: string]: Layout[] } => {
  if (!baseLayout || baseLayout.length === 0) {
    return { lg: [], md: [], sm: [], xs: [], xxs: [] };
  }

  // Sort by y position first, then x position for consistent stacking
  const sortedLayout = [...baseLayout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return {
    // Large screens (1200px+) - 16 columns, full layout
    lg: sortedLayout,

    // Medium screens (996px+) - 12 columns, proportionally scaled from 16
    md: sortedLayout.map((item) => ({
      ...item,
      w: Math.max(1, Math.ceil((item.w * 12) / 16)),
      x: Math.min(11, Math.floor((item.x * 12) / 16)),
    })),

    // Small screens (768px+) - 8 columns, proportionally scaled from 16
    sm: sortedLayout.map((item) => ({
      ...item,
      w: Math.max(1, Math.ceil((item.w * 8) / 16)),
      x: Math.min(7, Math.floor((item.x * 8) / 16)),
    })),

    // Extra small (480px+) - 4 columns, single column
    xs: sortedLayout.map((item, index) => ({
      ...item,
      w: 4,
      x: 0,
      y: index * Math.max(item.h, 3),
    })),

    // Tiny screens - 2 columns, minimal single column
    xxs: sortedLayout.map((item, index) => ({
      ...item,
      w: 2,
      x: 0,
      y: index * Math.max(item.h, 4),
    })),
  };
};

// A map of widget types to their components
const widgetComponentMap: {
  [key: string]: React.ComponentType<any>;
} = {
  list: ListWidget,
  metric_card: MetricCardWidget,
  chart: ChartWidget,
  table: TableWidget,
  vendor_card: VendorCardWidget,
  progress_bar: ProgressBarWidget,
  carousel: CarouselWidget,
  gauge: GaugeWidget,
  avatar_list: AvatarListWidget,
};

export function DashboardGrid({
  dashboardId,
  onRemoveWidget,
}: DashboardGridProps) {
  const { mutate: updateDashboard } = useUpdateDashboard();

  // Get state and actions from the React Context
  const { dashboard, layouts, updateLayouts } = useDashboardContext();

  // Set the current dashboard in context if it's not already set
  React.useEffect(() => {
    if (dashboard?.id !== dashboardId) {
      // The dashboard context should be managed by the parent AppProvider
      // This component just uses the dashboard from context
    }
  }, [dashboard?.id, dashboardId]);

  const handleLayoutChange = useDebouncedCallback(
    (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
      // Validate layouts before updating
      if (!allLayouts || Object.keys(allLayouts).length === 0) return;

      // Validate that layouts don't have overlapping items
      const validatedLayouts = Object.keys(allLayouts).reduce(
        (acc, breakpoint) => {
          const layout = allLayouts[breakpoint];
          if (!layout) return acc;
          // Sort by y position to ensure consistent ordering
          const sortedLayout = layout.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
          });
          acc[breakpoint] = sortedLayout;
          return acc;
        },
        {} as { [key: string]: Layout[] }
      );

      // Optimistically update the context for a snappy UI
      updateLayouts(validatedLayouts);

      // Persist the changes to the database
      if (dashboard) {
        updateDashboard({
          id: dashboard.id,
          data: { layout: validatedLayouts },
        });
      }
    },
    300 // Reduced debounce for more responsive feel
  );

  // Memoize children to prevent unnecessary re-renders
  const gridChildren = React.useMemo(() => {
    if (!dashboard) return [];

    return dashboard.widgets.map((widget: WidgetConfig) => (
      <div
        key={widget.id}
        className="relative h-full group bg-card rounded-lg shadow-sm border"
      >
        <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
          <div className="relative h-full group">
            {(() => {
              const WidgetComponent = widgetComponentMap[widget.type];
              if (WidgetComponent) {
                // We now pass only the ID and the delete handler. The widget will use a hook to get its config.
                return (
                  <WidgetComponent
                    widgetId={widget.id}
                    onDelete={
                      onRemoveWidget
                        ? () => onRemoveWidget(widget.id)
                        : undefined
                    }
                  />
                );
              } else {
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
          </div>
        </WidgetErrorBoundary>
      </div>
    ));
  }, [dashboard, onRemoveWidget]);

  if (!dashboard || !layouts) {
    return <div>Dashboard not found or an error occurred.</div>;
  }

  return (
    <div
      role="grid"
      aria-label="Dashboard widget grid"
      className="w-full h-full flex justify-center"
    >
      <div className="w-full max-w-7xl">
        <ResponsiveGridLayout
          key={dashboard.id}
          className="w-full h-full"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          {...getGridConfig()}
          draggableHandle=".drag-handle"
          useCSSTransforms={true}
          preventCollision={false}
          autoSize={true}
          isDraggable={true}
          isResizable={true}
          isBounded={false}
          allowOverlap={false}
          measureBeforeMount={false}
          resizeHandles={["se"]}
        >
          {gridChildren}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

// Export helper functions for external use
export { generateResponsiveLayouts, WidgetErrorBoundary };
