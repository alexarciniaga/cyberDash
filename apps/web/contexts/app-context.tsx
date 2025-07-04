"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { DashboardLayout } from "@/lib/types";
import { Layout } from "react-grid-layout";

// Date Range Types
export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = "24h" | "7d" | "30d" | "90d";

// Dashboard Types
interface DashboardState {
  dashboard: DashboardLayout | null;
  layouts: { [key: string]: Layout[] } | null;
}

// Combined App Context Interface
interface AppContextValue {
  // Dashboard state
  dashboard: DashboardLayout | null;
  layouts: { [key: string]: Layout[] } | null;
  setDashboard: (dashboard: DashboardLayout) => void;
  updateLayouts: (layouts: { [key: string]: Layout[] }) => void;

  // Date range state
  dateRangePreset: DateRangePreset;
  setDateRangePreset: (preset: DateRangePreset) => void;

  // Additional app-wide state
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
}

const AppContext = createContext<AppContextValue>({
  // Dashboard defaults
  dashboard: null,
  layouts: null,
  setDashboard: () => {},
  updateLayouts: () => {},

  // Date range defaults
  dateRangePreset: "30d",
  setDateRangePreset: () => {},

  // App state defaults
  isRefreshing: false,
  setIsRefreshing: () => {},
});

interface AppProviderProps {
  children: ReactNode;
  initialDashboard?: DashboardLayout | null;
  defaultDateRangePreset?: DateRangePreset;
}

/**
 * Consolidated App Context Provider
 * Combines dashboard context, date range context, and app-wide state
 */
export function AppProvider({
  children,
  initialDashboard = null,
  defaultDateRangePreset = "30d",
}: AppProviderProps) {
  // Dashboard state
  const [dashboard, setDashboard] = useState<DashboardLayout | null>(
    initialDashboard
  );
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] } | null>(
    initialDashboard?.layout || null
  );

  // Update dashboard state when initialDashboard prop changes
  React.useEffect(() => {
    if (initialDashboard) {
      setDashboard(initialDashboard);
      setLayouts(initialDashboard.layout || null);
    }
  }, [initialDashboard]);

  // Date range state
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>(
    defaultDateRangePreset
  );

  // App-wide state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dashboard methods
  const updateLayouts = (newLayouts: { [key: string]: Layout[] }) => {
    setLayouts(newLayouts);
    if (dashboard) {
      setDashboard({
        ...dashboard,
        layout: newLayouts,
      });
    }
  };

  const contextValue: AppContextValue = {
    // Dashboard state
    dashboard,
    layouts,
    setDashboard,
    updateLayouts,

    // Date range state
    dateRangePreset,
    setDateRangePreset,

    // App state
    isRefreshing,
    setIsRefreshing,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

/**
 * Hook to access the consolidated app context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

/**
 * Hook to access dashboard-specific context
 * Maintains compatibility with existing dashboard context usage
 */
export function useDashboardContext() {
  const { dashboard, layouts, setDashboard, updateLayouts } = useAppContext();
  return {
    dashboard,
    layouts,
    setDashboard,
    updateLayouts,
  };
}

/**
 * Hook to access date range context
 * Maintains compatibility with existing date range context usage
 */
export function useDateRange() {
  const { dateRangePreset, setDateRangePreset } = useAppContext();
  return {
    preset: dateRangePreset,
    setPreset: setDateRangePreset,
  };
}

/**
 * Hook to access app-wide refresh state
 * New functionality for coordinated refresh across components
 */
export function useAppRefresh() {
  const { isRefreshing, setIsRefreshing } = useAppContext();
  return {
    isRefreshing,
    setIsRefreshing,
  };
}

// Export types for external use
export type { AppContextValue, DashboardState };
