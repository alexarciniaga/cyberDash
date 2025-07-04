import { create } from "zustand";
import { DashboardLayout, WidgetConfig } from "@/lib/types";
import { Layout } from "react-grid-layout";

interface DashboardState {
  // State
  dashboard: DashboardLayout | null;
  layouts: { [key: string]: Layout[] } | null;

  // Actions
  setDashboard: (dashboard: DashboardLayout) => void;
  updateLayouts: (layouts: { [key: string]: Layout[] }) => void;
  updateWidgetConfig: (
    widgetId: string,
    newConfig: Partial<WidgetConfig>
  ) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  dashboard: null,
  layouts: null,

  // Action to initialize or replace the entire dashboard
  setDashboard: (dashboard) =>
    set({
      dashboard,
      layouts: dashboard.layout,
    }),

  // Action to update the layouts (e.g., on drag/resize)
  updateLayouts: (layouts) =>
    set((state) => {
      if (!state.dashboard) return {};
      return {
        layouts,
        dashboard: {
          ...state.dashboard,
          layout: layouts,
        },
      };
    }),

  // Action to update a single widget's configuration
  updateWidgetConfig: (widgetId, newConfig) =>
    set((state) => {
      if (!state.dashboard) return {};

      const newWidgets = state.dashboard.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, ...newConfig } : widget
      );

      return {
        dashboard: {
          ...state.dashboard,
          widgets: newWidgets,
        },
      };
    }),
}));
