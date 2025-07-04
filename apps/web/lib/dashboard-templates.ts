import { WidgetConfig, GridLayoutItem } from "@/lib/types";

// Complete dashboard template with all available widgets - will be used as template for new dashboards
export const sampleDashboardTemplate = {
  name: "New Dashboard",
  description: "Complete cybersecurity dashboard with all available widgets",
  isDefault: false,
  widgets: [
    // CISA KEV Widgets
    {
      id: "cisa-kev-count",
      type: "metric_card" as const,
      title: "CISA KEV Total",
      description: "Known Exploited Vulnerabilities",
      dataSource: "cisa" as const,
      metricId: "total-count",
      refreshInterval: 60,
    },
    {
      id: "cisa-top-vendor",
      type: "vendor_card" as const,
      title: "Top Vendor",
      description: "Most vulnerable vendor",
      dataSource: "cisa" as const,
      metricId: "top-vendor",
      refreshInterval: 30,
    },
    {
      id: "cisa-vendor-leaderboard",
      type: "list" as const,
      title: "Vendor Leaderboard",
      description: "Top vendors by vulnerability count",
      dataSource: "cisa" as const,
      metricId: "vendor-breakdown",
      refreshInterval: 300,
    },
    {
      id: "cisa-due-date-compliance",
      type: "metric_card" as const,
      title: "Due Date Compliance",
      description: "Percentage of vulnerabilities not approaching due date",
      dataSource: "cisa" as const,
      metricId: "due-date-compliance",
      refreshInterval: 30,
    },
    {
      id: "cisa-vendor-breakdown",
      type: "table" as const,
      title: "Vendor Breakdown",
      description: "Vulnerabilities by vendor",
      dataSource: "cisa" as const,
      metricId: "vendor-breakdown",
      refreshInterval: 300,
    },
    {
      id: "cisa-new-vulns-rate",
      type: "chart" as const,
      title: "New Vulnerabilities Rate",
      description: "Rate of new vulnerabilities over time",
      dataSource: "cisa" as const,
      metricId: "new-vulns-rate",
      refreshInterval: 60,
    },
    {
      id: "cisa-product-distribution",
      type: "chart" as const,
      title: "Product Distribution",
      description: "Distribution of vulnerabilities by product",
      dataSource: "cisa" as const,
      metricId: "product-distribution",
      chartType: "pie" as const,
      refreshInterval: 300,
    },
    // NVD CVE Widgets
    {
      id: "nvd-cve-critical",
      type: "metric_card" as const,
      title: "Critical CVEs",
      description: "CVSS Score ≥ 9.0",
      dataSource: "nvd" as const,
      metricId: "critical-count",
      refreshInterval: 30,
    },
    {
      id: "nvd-publication-trends",
      type: "chart" as const,
      title: "CVE Publication Trends",
      description: "CVEs published over time",
      dataSource: "nvd" as const,
      metricId: "publication-trends",
      refreshInterval: 60,
    },
    {
      id: "nvd-severity-distribution",
      type: "table" as const,
      title: "Severity Distribution",
      description: "CVEs by CVSS severity levels",
      dataSource: "nvd" as const,
      metricId: "severity-distribution",
      refreshInterval: 300,
    },
    {
      id: "nvd-recent-high-severity",
      type: "list" as const,
      title: "Recent High Severity",
      description: "Recently published high severity CVEs",
      dataSource: "nvd" as const,
      metricId: "recent-high-severity",
      refreshInterval: 30,
    },
    {
      id: "nvd-vuln-status-summary",
      type: "table" as const,
      title: "Vulnerability Status Summary",
      description: "Summary of vulnerability statuses",
      dataSource: "nvd" as const,
      metricId: "vuln-status-summary",
      refreshInterval: 60,
    },
    // MITRE ATT&CK Widgets
    {
      id: "mitre-technique-count",
      type: "metric_card" as const,
      title: "ATT&CK Techniques",
      description: "Total techniques in framework",
      dataSource: "mitre" as const,
      metricId: "technique-count",
      refreshInterval: 3600,
    },
    {
      id: "mitre-tactics-coverage",
      type: "table" as const,
      title: "MITRE Tactics Coverage",
      description: "ATT&CK tactics and technique counts",
      dataSource: "mitre" as const,
      metricId: "tactics-coverage",
      refreshInterval: 300,
    },
    {
      id: "mitre-platform-coverage",
      type: "table" as const,
      title: "Platform Coverage",
      description: "ATT&CK technique coverage by platform",
      dataSource: "mitre" as const,
      metricId: "platform-coverage",
      refreshInterval: 300,
    },
    {
      id: "mitre-recent-updates",
      type: "list" as const,
      title: "Recent Framework Updates",
      description: "Latest MITRE ATT&CK technique updates and additions",
      dataSource: "mitre" as const,
      metricId: "recent-updates",
      refreshInterval: 300,
    },
    {
      id: "mitre-top-techniques",
      type: "list" as const,
      title: "Most Versatile Techniques",
      description: "Techniques spanning multiple tactics and platforms",
      dataSource: "mitre" as const,
      metricId: "top-techniques",
      refreshInterval: 300,
    },
  ] as WidgetConfig[],
};

// Generate layout for complete dashboard using optimized positioning
export const generateSampleLayout = (): GridLayoutItem[] => {
  // Improved layout organized by data source with better flow and grouping
  return [
    // === TOP ROW: KEY METRICS (Most Important Summary Data) ===
    { i: "cisa-kev-count", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "nvd-cve-critical", x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "mitre-technique-count", x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "cisa-due-date-compliance", x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },

    // === CISA SECTION (Rows 3-10) ===
    { i: "cisa-top-vendor", x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 3 },
    { i: "cisa-vendor-leaderboard", x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "cisa-vendor-breakdown", x: 8, y: 3, w: 4, h: 4, minW: 4, minH: 4 },

    { i: "cisa-new-vulns-rate", x: 0, y: 7, w: 8, h: 4, minW: 6, minH: 4 },
    {
      i: "cisa-product-distribution",
      x: 8,
      y: 7,
      w: 4,
      h: 4,
      minW: 4,
      minH: 4,
    },

    // === NVD SECTION (Rows 11-18) ===
    { i: "nvd-publication-trends", x: 0, y: 11, w: 12, h: 4, minW: 8, minH: 4 },

    {
      i: "nvd-severity-distribution",
      x: 0,
      y: 15,
      w: 6,
      h: 4,
      minW: 4,
      minH: 4,
    },
    {
      i: "nvd-recent-high-severity",
      x: 6,
      y: 15,
      w: 6,
      h: 4,
      minW: 4,
      minH: 4,
    },

    {
      i: "nvd-vuln-status-summary",
      x: 0,
      y: 19,
      w: 12,
      h: 3,
      minW: 6,
      minH: 3,
    },

    // === MITRE SECTION (Rows 22-29) ===
    { i: "mitre-tactics-coverage", x: 0, y: 22, w: 6, h: 4, minW: 4, minH: 4 },
    { i: "mitre-platform-coverage", x: 6, y: 22, w: 6, h: 4, minW: 4, minH: 4 },

    { i: "mitre-recent-updates", x: 0, y: 26, w: 6, h: 3, minW: 4, minH: 3 },
    { i: "mitre-top-techniques", x: 6, y: 26, w: 6, h: 3, minW: 4, minH: 3 },
  ];
};

// Minimal dashboard template for quick setup
export const minimalDashboardTemplate = {
  name: "Essential Dashboard",
  description: "Key cybersecurity metrics at a glance",
  isDefault: false,
  widgets: [
    {
      id: "cisa-kev-count",
      type: "metric_card" as const,
      title: "CISA KEV Total",
      description: "Known Exploited Vulnerabilities",
      dataSource: "cisa" as const,
      metricId: "total-count",
      refreshInterval: 60,
    },
    {
      id: "nvd-cve-critical",
      type: "metric_card" as const,
      title: "Critical CVEs",
      description: "CVSS Score ≥ 9.0",
      dataSource: "nvd" as const,
      metricId: "critical-count",
      refreshInterval: 30,
    },
    {
      id: "mitre-technique-count",
      type: "metric_card" as const,
      title: "ATT&CK Techniques",
      description: "Total techniques in framework",
      dataSource: "mitre" as const,
      metricId: "technique-count",
      refreshInterval: 3600,
    },
    {
      id: "nvd-recent-high-severity",
      type: "list" as const,
      title: "Recent High Severity",
      description: "Recently published high severity CVEs",
      dataSource: "nvd" as const,
      metricId: "recent-high-severity",
      refreshInterval: 30,
    },
  ] as WidgetConfig[],
};

export const generateMinimalLayout = (): GridLayoutItem[] => {
  return [
    { i: "cisa-kev-count", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "nvd-cve-critical", x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "mitre-technique-count", x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    {
      i: "nvd-recent-high-severity",
      x: 0,
      y: 3,
      w: 12,
      h: 4,
      minW: 6,
      minH: 4,
    },
  ];
};
