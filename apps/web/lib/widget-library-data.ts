import {
  BarChart3Icon,
  TableIcon,
  ListIcon,
  Activity,
  Shield,
  Target,
  TrendingUpIcon,
  GaugeIcon,
} from "lucide-react";
import { getRefreshInterval } from "./config";
import { GridLayoutItem, WidgetConfig } from "./types";

// Extended widget config with additional properties used in widget library
export interface ExtendedWidgetConfig extends WidgetConfig {
  category: "Metrics" | "Charts" | "Tables" | "Lists";
  icon: any; // Lucide icon component
  searchTerms: string[];
}

// Default widget sizes by type (used as fallbacks)
export const DEFAULT_WIDGET_TYPE_SIZES = {
  metric_card: { w: 3, h: 3, minW: 2, minH: 3 },
  vendor_card: { w: 3, h: 3, minW: 2, minH: 3 },
  chart: { w: 6, h: 5, minW: 4, minH: 5 },
  table: { w: 6, h: 5, minW: 4, minH: 4 },
  list: { w: 4, h: 4, minW: 3, minH: 3 },
} as const;

export const WIDGET_LIBRARY = {
  "CISA KEV": [
    {
      id: "cisa-kev-count",
      type: "metric_card" as const,
      title: "CISA KEV Total",
      description: "Known Exploited Vulnerabilities",
      dataSource: "cisa" as const,
      metricId: "total-count",
      refreshInterval: getRefreshInterval("normal"),
      category: "Metrics",
      icon: Shield,
      searchTerms: ["cisa", "kev", "total", "count", "vulnerabilities"],
      // Uses default metric_card size: { w: 3, h: 2, minW: 2, minH: 2 }
    },
    {
      id: "cisa-top-vendor",
      type: "vendor_card" as const,
      title: "Top Vendor",
      description: "Most vulnerable vendor",
      dataSource: "cisa" as const,
      metricId: "top-vendor",
      refreshInterval: getRefreshInterval("fast"),
      category: "Metrics",
      icon: TrendingUpIcon,
      searchTerms: ["cisa", "vendor", "top", "most"],
      // Uses default vendor_card size: { w: 3, h: 2, minW: 2, minH: 2 }
    },
    {
      id: "cisa-vendor-leaderboard",
      type: "list" as const,
      title: "Vendor Leaderboard",
      description: "Top vendors by vulnerability count",
      dataSource: "cisa" as const,
      metricId: "vendor-breakdown",
      refreshInterval: getRefreshInterval("slow"),
      category: "Lists",
      icon: ListIcon,
      searchTerms: ["cisa", "vendor", "leaderboard", "top", "ranking", "list"],
      // Uses default list size: { w: 4, h: 4, minW: 3, minH: 3 }
    },
    {
      id: "cisa-due-date-compliance",
      type: "metric_card" as const,
      title: "Due Date Compliance",
      description: "Percentage of vulnerabilities not approaching due date",
      dataSource: "cisa" as const,
      metricId: "due-date-compliance",
      refreshInterval: getRefreshInterval("fast"),
      category: "Metrics",
      icon: GaugeIcon,
      searchTerms: ["cisa", "due", "date", "compliance", "percentage", "gauge"],
      // Uses default metric_card size: { w: 3, h: 2, minW: 2, minH: 2 }
    },
    {
      id: "cisa-vendor-breakdown",
      type: "table" as const,
      title: "Vendor Breakdown",
      description: "Vulnerabilities by vendor",
      dataSource: "cisa" as const,
      metricId: "vendor-breakdown",
      refreshInterval: getRefreshInterval("slow"),
      category: "Tables",
      icon: TableIcon,
      searchTerms: ["cisa", "vendor", "breakdown", "table", "list"],
      // Custom size for larger table
      size: { w: 8, h: 6, minW: 6, minH: 4 },
    },
    {
      id: "cisa-new-vulns-rate",
      type: "chart" as const,
      title: "New Vulnerabilities Rate",
      description: "Rate of new vulnerabilities over time",
      dataSource: "cisa" as const,
      metricId: "new-vulns-rate",
      refreshInterval: getRefreshInterval("normal"),
      category: "Charts",
      icon: BarChart3Icon,
      searchTerms: ["cisa", "new", "vulnerabilities", "rate", "trend", "chart"],
      // Custom size for taller chart with better visualization
      size: { w: 8, h: 5, minW: 6, minH: 5 },
    },
    {
      id: "cisa-product-distribution",
      type: "chart" as const,
      title: "Product Distribution",
      description: "Distribution of vulnerabilities by product",
      dataSource: "cisa" as const,
      metricId: "product-distribution",
      chartType: "pie" as const,
      refreshInterval: getRefreshInterval("slow"),
      category: "Charts",
      icon: BarChart3Icon,
      searchTerms: ["cisa", "product", "distribution", "chart", "pie"],
      // Uses default chart size: { w: 6, h: 5, minW: 4, minH: 5 }
    },
  ],
  "NVD CVE": [
    {
      id: "nvd-cve-critical",
      type: "metric_card" as const,
      title: "Critical CVEs",
      description: "CVSS Score ≥ 9.0",
      dataSource: "nvd" as const,
      metricId: "critical-count",
      refreshInterval: getRefreshInterval("fast"),
      category: "Metrics",
      icon: Shield,
      searchTerms: ["nvd", "cve", "critical", "high", "severity"],
      // Uses default metric_card size: { w: 3, h: 2, minW: 2, minH: 2 }
    },
    {
      id: "nvd-publication-trends",
      type: "chart" as const,
      title: "CVE Publication Trends",
      description: "CVEs published over time",
      dataSource: "nvd" as const,
      metricId: "publication-trends",
      refreshInterval: getRefreshInterval("normal"),
      category: "Charts",
      icon: BarChart3Icon,
      searchTerms: ["nvd", "publication", "trends", "chart", "time"],
      // Custom size for wider chart
      size: { w: 8, h: 5, minW: 6, minH: 5 },
    },
    {
      id: "nvd-severity-distribution",
      type: "table" as const,
      title: "Severity Distribution",
      description: "CVEs by CVSS severity levels",
      dataSource: "nvd" as const,
      metricId: "severity-distribution",
      refreshInterval: getRefreshInterval("slow"),
      category: "Tables",
      icon: TableIcon,
      searchTerms: ["nvd", "severity", "distribution", "cvss", "table"],
      // Uses default table size: { w: 6, h: 5, minW: 4, minH: 4 }
    },
    {
      id: "nvd-recent-high-severity",
      type: "list" as const,
      title: "Recent High Severity",
      description: "Recently published high severity CVEs",
      dataSource: "nvd" as const,
      metricId: "recent-high-severity",
      refreshInterval: getRefreshInterval("fast"),
      category: "Lists",
      icon: ListIcon,
      searchTerms: ["nvd", "recent", "high", "severity", "list"],
    },
    {
      id: "nvd-vuln-status-summary",
      type: "table" as const,
      title: "Vulnerability Status Summary",
      description: "Summary of vulnerability statuses",
      dataSource: "nvd" as const,
      metricId: "vuln-status-summary",
      refreshInterval: getRefreshInterval("normal"),
      category: "Tables",
      icon: TableIcon,
      searchTerms: ["nvd", "vulnerability", "status", "summary", "table"],
    },
  ],
  "MITRE ATT&CK": [
    {
      id: "mitre-technique-count",
      type: "metric_card" as const,
      title: "ATT&CK Techniques",
      description: "Total techniques in framework",
      dataSource: "mitre" as const,
      metricId: "technique-count",
      refreshInterval: getRefreshInterval("hourly"),
      category: "Metrics",
      icon: Target,
      searchTerms: ["mitre", "attack", "techniques", "count", "total"],
    },
    {
      id: "mitre-tactics-coverage",
      type: "table" as const,
      title: "MITRE Tactics Coverage",
      description: "ATT&CK tactics and technique counts",
      dataSource: "mitre" as const,
      metricId: "tactics-coverage",
      refreshInterval: getRefreshInterval("slow"), // MITRE data updates less frequently
      category: "Tables",
      icon: TableIcon,
      searchTerms: [
        "mitre",
        "tactics",
        "coverage",
        "attack",
        "table",
        "techniques",
      ],
    },
    {
      id: "mitre-platform-coverage",
      type: "table" as const,
      title: "Platform Coverage",
      description: "ATT&CK technique coverage by platform",
      dataSource: "mitre" as const,
      metricId: "platform-coverage",
      refreshInterval: getRefreshInterval("slow"), // MITRE data updates less frequently
      category: "Tables",
      icon: TableIcon,
      searchTerms: [
        "mitre",
        "platform",
        "coverage",
        "windows",
        "linux",
        "macos",
        "cloud",
        "techniques",
      ],
    },
    {
      id: "mitre-recent-updates",
      type: "list" as const,
      title: "Recent Framework Updates",
      description: "Latest MITRE ATT&CK technique updates and additions",
      dataSource: "mitre" as const,
      metricId: "recent-updates",
      refreshInterval: getRefreshInterval("slow"), // MITRE updates less frequently
      category: "Lists",
      icon: ListIcon,
      size: { w: 8, h: 7, minW: 6, minH: 7 },
      searchTerms: [
        "mitre",
        "recent",
        "updates",
        "framework",
        "changes",
        "new",
        "modified",
        "techniques",
      ],
    },
    {
      id: "mitre-top-techniques",
      type: "list" as const,
      title: "Most Versatile Techniques",
      description: "Techniques spanning multiple tactics and platforms",
      dataSource: "mitre" as const,
      metricId: "top-techniques",
      refreshInterval: getRefreshInterval("slow"), // MITRE data updates less frequently
      category: "Lists",
      icon: ListIcon,
      searchTerms: [
        "mitre",
        "top",
        "versatile",
        "techniques",
        "multi",
        "tactic",
        "platform",
        "dangerous",
      ],
    },
  ],
};

// Widget type info for badges and icons
export const WIDGET_TYPE_INFO = {
  metric_card: {
    icon: Activity,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  vendor_card: {
    icon: TrendingUpIcon,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  chart: {
    icon: BarChart3Icon,
    color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  table: {
    icon: TableIcon,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  list: {
    icon: ListIcon,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
};

// Helper function to get widget size (custom or default)
export const getWidgetSize = (widget: {
  type: keyof typeof DEFAULT_WIDGET_TYPE_SIZES;
  size?: any;
}) => {
  return widget.size || DEFAULT_WIDGET_TYPE_SIZES[widget.type];
};

// Priority order for widget categories (higher priority = positioned first)
const CATEGORY_PRIORITY = {
  Metrics: 1,
  Charts: 2,
  Tables: 3,
  Lists: 4,
} as const;

// Data source priority order (for consistent grouping)
const DATASOURCE_PRIORITY = {
  cisa: 1,
  nvd: 2,
  mitre: 3,
} as const;

/**
 * Smart layout generator that dynamically arranges widgets without gaps
 * Uses widget library data for proper sizing and organization
 */
export const generateSmartLayout = (
  selectedWidgetIds: string[]
): GridLayoutItem[] => {
  // Flatten all widgets from WIDGET_LIBRARY to get their configurations
  const allWidgets: ExtendedWidgetConfig[] = [];
  Object.entries(WIDGET_LIBRARY).forEach(([category, categoryWidgets]) => {
    allWidgets.push(...(categoryWidgets as ExtendedWidgetConfig[]));
  });

  // Filter to only selected widgets
  const selectedWidgetSet = new Set(selectedWidgetIds);
  const selectedWidgets = allWidgets.filter((widget) =>
    selectedWidgetSet.has(widget.id)
  );

  // Sort widgets by priority: category first, then data source, then alphabetically by id
  const sortedWidgets = selectedWidgets.sort((a, b) => {
    // First by category priority
    const categoryA =
      CATEGORY_PRIORITY[a.category as keyof typeof CATEGORY_PRIORITY] || 999;
    const categoryB =
      CATEGORY_PRIORITY[b.category as keyof typeof CATEGORY_PRIORITY] || 999;
    if (categoryA !== categoryB) return categoryA - categoryB;

    // Then by data source priority
    const dataSourceA =
      DATASOURCE_PRIORITY[a.dataSource as keyof typeof DATASOURCE_PRIORITY] ||
      999;
    const dataSourceB =
      DATASOURCE_PRIORITY[b.dataSource as keyof typeof DATASOURCE_PRIORITY] ||
      999;
    if (dataSourceA !== dataSourceB) return dataSourceA - dataSourceB;

    // Finally alphabetically by id for consistent ordering
    return a.id.localeCompare(b.id);
  });

  // Grid packing algorithm
  const layout: GridLayoutItem[] = [];
  const GRID_COLUMNS = 12;
  let currentRow = 0;
  let currentCol = 0;

  // Track occupied spaces for collision detection
  const occupiedSpaces = new Set<string>();

  const isSpaceOccupied = (
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean => {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        if (occupiedSpaces.has(`${col},${row}`)) {
          return true;
        }
      }
    }
    return false;
  };

  const markSpaceOccupied = (
    x: number,
    y: number,
    w: number,
    h: number
  ): void => {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        occupiedSpaces.add(`${col},${row}`);
      }
    }
  };

  const findNextAvailablePosition = (
    w: number,
    h: number
  ): { x: number; y: number } => {
    // Start from current position and find the next available space
    for (let row = currentRow; ; row++) {
      for (let col = 0; col <= GRID_COLUMNS - w; col++) {
        if (!isSpaceOccupied(col, row, w, h)) {
          return { x: col, y: row };
        }
      }
    }
  };

  // Position each widget
  for (const widget of sortedWidgets) {
    const size = getWidgetSize(widget);

    // Find the next available position
    const position = findNextAvailablePosition(size.w, size.h);

    // Create layout item
    const layoutItem: GridLayoutItem = {
      i: widget.id,
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      minW: size.minW,
      minH: size.minH,
    };

    layout.push(layoutItem);
    markSpaceOccupied(position.x, position.y, size.w, size.h);

    // Update current position for next widget
    currentRow = position.y;
    currentCol = position.x + size.w;

    // If we've reached the end of the row, move to next row
    if (currentCol >= GRID_COLUMNS) {
      currentRow++;
      currentCol = 0;
    }
  }

  return layout;
};

// Legacy function for backwards compatibility (now uses smart layout)
export const generateSampleLayout = (): GridLayoutItem[] => {
  // Get all available widget IDs
  const allWidgetIds: string[] = [];
  Object.entries(WIDGET_LIBRARY).forEach(([category, categoryWidgets]) => {
    allWidgetIds.push(...categoryWidgets.map((w) => w.id));
  });

  return generateSmartLayout(allWidgetIds);
};
