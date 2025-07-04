"use client";

import { createContext, useContext } from "react";
import { DashboardLayout, WidgetConfig } from "@/lib/types";

// 1. Define the shape of the context data
interface DashboardContextProps {
  dashboard: DashboardLayout | null;
}

// 2. Create the context with a default value
const DashboardContext = createContext<DashboardContextProps>({
  dashboard: null,
});

// 3. Create a provider component for convenience
export const DashboardProvider = DashboardContext.Provider;

// 4. Create the custom hook for consuming widget data
// This is the key to our performance optimization. It allows a component
// to subscribe to just its own data, preventing unnecessary re-renders.
export function useWidgetConfig(widgetId: string): WidgetConfig | undefined {
  const { dashboard } = useContext(DashboardContext);

  if (!dashboard) {
    // This can happen during initial load, it's a normal condition.
    return undefined;
  }

  // Find the specific widget config from the full dashboard layout
  return dashboard.widgets.find((widget) => widget.id === widgetId);
}
