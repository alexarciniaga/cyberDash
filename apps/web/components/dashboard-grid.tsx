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
import { useDashboard, useUpdateDashboard } from "@/lib/hooks/use-dashboards";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { useDebouncedCallback } from "use-debounce";
import { DashboardProvider } from "@/contexts/dashboard-context";

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";

// MODERN BEST PRACTICE: Memoize WidthProvider to prevent unnecessary re-renders
const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  dashboardId: string;
}

// Error boundary for individual widgets
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: string; widgetType: string },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    widgetId: string;
    widgetType: string;
  }) {
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

// A map of widget types to their components
const widgetComponentMap: {
  [key: string]: React.ComponentType<any>;
} = {
  list: ListWidget,
  metric_card: MetricCardWidget,
  chart: ChartWidget,
  table: TableWidget,
  vendor_card: VendorCardWidget,
};

export function DashboardGrid({ dashboardId }: DashboardGridProps) {
  const { data: initialDashboard, isLoading } = useDashboard(dashboardId);
  const { mutate: updateDashboard } = useUpdateDashboard();

  // Get state and actions from the Zustand store
  const { dashboard, layouts, setDashboard, updateLayouts } =
    useDashboardStore();

  // Load initial data into the store once it's fetched
  React.useEffect(() => {
    if (initialDashboard) {
      setDashboard(initialDashboard);
    }
  }, [initialDashboard, setDashboard]);

  const handleLayoutChange = useDebouncedCallback(
    (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
      // Optimistically update the store for a snappy UI
      updateLayouts(allLayouts);

      // Persist the changes to the database
      if (dashboard) {
        updateDashboard({ id: dashboard.id, data: { layout: allLayouts } });
      }
    },
    500 // Debounce for 500ms
  );

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  if (!dashboard || !layouts) {
    return <div>Dashboard not found or an error occurred.</div>;
  }

  return (
    <DashboardProvider value={{ dashboard }}>
      <ResponsiveGridLayout
        className="w-full h-full"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        {...getGridConfig()}
        draggableHandle=".widget-drag-handle"
      >
        {dashboard.widgets.map((widget) => (
          <div
            key={widget.id}
            className="relative h-full group bg-card rounded-lg shadow-sm border"
          >
            <WidgetErrorBoundary widgetId={widget.id} widgetType={widget.type}>
              <div className="relative h-full group">
                {(() => {
                  const WidgetComponent = widgetComponentMap[widget.type];
                  if (WidgetComponent) {
                    // We now pass only the ID. The widget will use a hook to get its config.
                    return <WidgetComponent widgetId={widget.id} />;
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
        ))}
      </ResponsiveGridLayout>
    </DashboardProvider>
  );
}

// Export helper functions for external use
export { generateResponsiveLayouts, WidgetErrorBoundary };
