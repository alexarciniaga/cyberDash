"use client";

import * as React from "react";

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = "24h" | "7d" | "30d" | "90d" | "custom";

interface DateRangeContextValue {
  dateRange: DateRange;
  preset: DateRangePreset;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: DateRangePreset) => void;
  isCustomRange: boolean;
}

const DateRangeContext = React.createContext<DateRangeContextValue | undefined>(
  undefined
);

// Default to last 30 days
const getDefaultDateRange = (): DateRange => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: thirtyDaysAgo, to: now };
};

// Preset configurations
const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const now = new Date();
  const hours = (h: number) => h * 60 * 60 * 1000;
  const days = (d: number) => d * 24 * hours(1);

  switch (preset) {
    case "24h":
      return { from: new Date(now.getTime() - hours(24)), to: now };
    case "7d":
      return { from: new Date(now.getTime() - days(7)), to: now };
    case "30d":
      return { from: new Date(now.getTime() - days(30)), to: now };
    case "90d":
      return { from: new Date(now.getTime() - days(90)), to: now };
    case "custom":
    default:
      return getDefaultDateRange();
  }
};

interface DateRangeProviderProps {
  children: React.ReactNode;
  defaultPreset?: DateRangePreset;
}

export function DateRangeProvider({
  children,
  defaultPreset = "30d",
}: DateRangeProviderProps) {
  const [preset, setPresetState] =
    React.useState<DateRangePreset>(defaultPreset);
  const [dateRange, setDateRangeState] = React.useState<DateRange>(() =>
    getDateRangeFromPreset(defaultPreset)
  );

  const setPreset = React.useCallback((newPreset: DateRangePreset) => {
    setPresetState(newPreset);
    if (newPreset !== "custom") {
      setDateRangeState(getDateRangeFromPreset(newPreset));
    }
  }, []);

  const setDateRange = React.useCallback((range: DateRange) => {
    setDateRangeState(range);
    // If custom range is set, switch to custom preset
    setPresetState("custom");
  }, []);

  const isCustomRange = preset === "custom";

  const value = React.useMemo(
    () => ({
      dateRange,
      preset,
      setDateRange,
      setPreset,
      isCustomRange,
    }),
    [dateRange, preset, setDateRange, setPreset, isCustomRange]
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = React.useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}

// Utility function to format date range for API calls
export function formatDateRangeForAPI(dateRange: DateRange) {
  return {
    from: dateRange.from.toISOString(),
    to: dateRange.to.toISOString(),
  };
}

// Utility function to get relative time description
export function getDateRangeDescription(dateRange: DateRange): string {
  const now = new Date();
  const diffMs = now.getTime() - dateRange.from.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 2) {
    return "from last hour";
  } else if (diffHours < 25) {
    return "from last 24 hours";
  } else if (diffDays < 8) {
    return `from last ${diffDays} days`;
  } else if (diffDays < 32) {
    return `from last ${diffDays} days`;
  } else {
    return `from ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`;
  }
}
