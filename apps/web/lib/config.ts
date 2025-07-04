// Application Configuration
// Centralizes all configurable values that are currently hardcoded

export const APP_CONFIG = {
  // Widget Refresh Configuration
  widgets: {
    defaultRefreshInterval: 60, // seconds
    refreshIntervals: {
      fast: 30, // 30 seconds - for critical metrics
      normal: 60, // 1 minute - default
      slow: 300, // 5 minutes - for less critical data
      hourly: 3600, // 1 hour - for historical data
    },
  },

  // Dashboard Grid Configuration
  grid: {
    rowHeight: 60, // pixels per grid unit
    margin: [12, 12] as [number, number], // [horizontal, vertical] in pixels
    containerPadding: [16, 16] as [number, number], // [horizontal, vertical] in pixels
    // MODERN BEST PRACTICE: Use standard react-grid-layout breakpoints
    breakpoints: {
      lg: 1200, // Large screens - full layout
      md: 996, // Medium screens - standard tablet landscape
      sm: 768, // Small screens - tablet portrait
      xs: 480, // Extra small - large mobile
      xxs: 0, // Tiny screens - small mobile
    },
    columns: {
      lg: 12, // Full 12-column grid
      md: 10, // Slightly constrained for medium screens
      sm: 6, // 6 columns for tablets
      xs: 4, // 4 columns for mobile
      xxs: 2, // 2 columns for very small screens
    },
  },

  // React Query Configuration
  query: {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retryCount: 3,
    retryDelay: 1000, // 1 second base delay
  },

  // Database Configuration Defaults
  database: {
    defaultHost: "localhost",
    defaultPort: 5432,
    defaultUser: "postgres",
    defaultPassword: "password",
    defaultDatabase: "cyberdash",
  },

  // Date Range Presets Configuration
  dateRanges: {
    presets: {
      "24h": { hours: 24 },
      "7d": { days: 7 },
      "30d": { days: 30 },
      "90d": { days: 90 },
    },
    defaultPreset: "30d" as "24h" | "7d" | "30d" | "90d",
  },

  // Chart Configuration
  charts: {
    defaultHeight: 200, // pixels
    minHeight: 180, // pixels
    margins: {
      top: 10,
      right: 15,
      left: 15,
      bottom: 5,
    },
    fontSize: {
      axis: 11,
      tooltip: 12,
    },
  },

  // Performance Configuration
  performance: {
    skeletonItems: 5, // number of skeleton items to show while loading
    maxTableRows: 100, // maximum rows to display in tables
    debounceDelay: 300, // milliseconds for search/filter debouncing
  },

  // UI Configuration
  ui: {
    animationDuration: 200, // milliseconds for transitions
    tooltipDelay: 500, // milliseconds before tooltip shows
    toastDuration: 5000, // milliseconds for toast notifications
  },

  // Security Configuration
  security: {
    maxDashboardNameLength: 100,
    maxDescriptionLength: 500,
    maxWidgetsPerDashboard: 50,
  },
} as const;

// Type-safe configuration access helpers
export const getRefreshInterval = (
  type: keyof typeof APP_CONFIG.widgets.refreshIntervals = "normal"
) => {
  return APP_CONFIG.widgets.refreshIntervals[type];
};

export const getGridConfig = () => APP_CONFIG.grid;

export const getQueryConfig = () => APP_CONFIG.query;

export const getChartConfig = () => APP_CONFIG.charts;

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    ...APP_CONFIG,
    // Override configurations based on environment
    query: {
      ...APP_CONFIG.query,
      // Faster refreshes in development for better DX
      refetchInterval: isDevelopment
        ? 30 * 1000
        : APP_CONFIG.query.refetchInterval,
      staleTime: isDevelopment ? 15 * 1000 : APP_CONFIG.query.staleTime,
    },
    ui: {
      ...APP_CONFIG.ui,
      // Faster animations in development
      animationDuration: isDevelopment ? 100 : APP_CONFIG.ui.animationDuration,
    },
  };
};

// Date range utilities
export const DEFAULT_DATE_RANGES = {
  hour: 1 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  quarter: 90 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Get a date X milliseconds ago from now
 */
export function getDateAgo(milliseconds: number): Date {
  return new Date(Date.now() - milliseconds);
}

/**
 * Get a date X days ago from now
 */
export function getDaysAgo(days: number): Date {
  return getDateAgo(days * DEFAULT_DATE_RANGES.day);
}

/**
 * Get default date range for API endpoints when no parameters provided
 * @param type - The type of default range to use
 */
export function getDefaultApiDateRange(
  type: keyof typeof DEFAULT_DATE_RANGES = "month"
) {
  const to = new Date();
  const from = getDateAgo(DEFAULT_DATE_RANGES[type]);
  return { from, to };
}
