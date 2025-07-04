import { NextResponse } from "next/server";
// Import database connection only when needed at runtime
import { dashboards } from "@/lib/db/schema";
import { getRefreshInterval } from "@/lib/config";

// Complete default dashboard template with all available widgets
const defaultDashboardTemplate = {
  name: "CyberSecurity Overview",
  description:
    "Complete cybersecurity metrics dashboard with all available widgets",
  isDefault: true,
  layout: [
    { i: "cisa-kev-count", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "cisa-top-vendor", x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "cisa-vendor-leaderboard", x: 6, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    {
      i: "cisa-due-date-compliance",
      x: 10,
      y: 0,
      w: 3,
      h: 3,
      minW: 2,
      minH: 2,
    },
    { i: "cisa-vendor-breakdown", x: 0, y: 3, w: 8, h: 4, minW: 6, minH: 4 },
    { i: "cisa-new-vulns-rate", x: 0, y: 8, w: 12, h: 7, minW: 6, minH: 7 },
    {
      i: "cisa-product-distribution",
      x: 0,
      y: 22,
      w: 6,
      h: 5,
      minW: 4,
      minH: 5,
    },
    { i: "nvd-cve-critical", x: 10, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "nvd-publication-trends", x: 0, y: 16, w: 12, h: 5, minW: 6, minH: 5 },
    {
      i: "nvd-severity-distribution",
      x: 6,
      y: 22,
      w: 6,
      h: 5,
      minW: 4,
      minH: 4,
    },
    {
      i: "nvd-recent-high-severity",
      x: 6,
      y: 25,
      w: 6,
      h: 3,
      minW: 3,
      minH: 3,
    },
    { i: "nvd-vuln-status-summary", x: 0, y: 32, w: 5, h: 4, minW: 4, minH: 4 },
    { i: "mitre-technique-count", x: 8, y: 7, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "mitre-tactics-coverage", x: 6, y: 37, w: 6, h: 4, minW: 4, minH: 4 },
    { i: "mitre-platform-coverage", x: 6, y: 29, w: 6, h: 4, minW: 4, minH: 4 },
    { i: "mitre-recent-updates", x: 6, y: 39, w: 6, h: 3, minW: 3, minH: 3 },
    { i: "mitre-top-techniques", x: 6, y: 34, w: 6, h: 3, minW: 3, minH: 3 },
  ],
  widgets: [
    // CISA KEV Widgets
    {
      id: "cisa-kev-count",
      type: "metric_card",
      title: "CISA KEV Total",
      description: "Known Exploited Vulnerabilities",
      dataSource: "cisa",
      metricId: "total-count",
      refreshInterval: getRefreshInterval("normal"),
    },
    {
      id: "cisa-top-vendor",
      type: "vendor_card",
      title: "Top Vendor",
      description: "Most vulnerable vendor",
      dataSource: "cisa",
      metricId: "top-vendor",
      refreshInterval: getRefreshInterval("fast"),
    },
    {
      id: "cisa-vendor-leaderboard",
      type: "list",
      title: "Vendor Leaderboard",
      description: "Top vendors by vulnerability count",
      dataSource: "cisa",
      metricId: "vendor-breakdown",
      refreshInterval: getRefreshInterval("slow"),
    },
    {
      id: "cisa-due-date-compliance",
      type: "metric_card",
      title: "Due Date Compliance",
      description: "Percentage of vulnerabilities not approaching due date",
      dataSource: "cisa",
      metricId: "due-date-compliance",
      refreshInterval: getRefreshInterval("fast"),
    },
    {
      id: "cisa-vendor-breakdown",
      type: "table",
      title: "Vendor Breakdown",
      description: "Vulnerabilities by vendor",
      dataSource: "cisa",
      metricId: "vendor-breakdown",
      refreshInterval: getRefreshInterval("slow"),
    },
    {
      id: "cisa-new-vulns-rate",
      type: "chart",
      title: "New Vulnerabilities Rate",
      description: "Rate of new vulnerabilities over time",
      dataSource: "cisa",
      metricId: "new-vulns-rate",
      refreshInterval: getRefreshInterval("normal"),
    },
    {
      id: "cisa-product-distribution",
      type: "chart",
      title: "Product Distribution",
      description: "Distribution of vulnerabilities by product",
      dataSource: "cisa",
      metricId: "product-distribution",
      chartType: "pie",
      refreshInterval: getRefreshInterval("slow"),
    },
    // NVD CVE Widgets
    {
      id: "nvd-cve-critical",
      type: "metric_card",
      title: "Critical CVEs",
      description: "CVSS Score ≥ 9.0",
      dataSource: "nvd",
      metricId: "critical-count",
      refreshInterval: getRefreshInterval("fast"),
    },
    {
      id: "nvd-publication-trends",
      type: "chart",
      title: "CVE Publication Trends",
      description: "CVEs published over time",
      dataSource: "nvd",
      metricId: "publication-trends",
      refreshInterval: getRefreshInterval("normal"),
    },
    {
      id: "nvd-severity-distribution",
      type: "table",
      title: "Severity Distribution",
      description: "CVEs by CVSS severity levels",
      dataSource: "nvd",
      metricId: "severity-distribution",
      refreshInterval: getRefreshInterval("slow"),
    },
    {
      id: "nvd-recent-high-severity",
      type: "list",
      title: "Recent High Severity",
      description: "Recently published high severity CVEs",
      dataSource: "nvd",
      metricId: "recent-high-severity",
      refreshInterval: getRefreshInterval("fast"),
    },
    {
      id: "nvd-vuln-status-summary",
      type: "table",
      title: "Vulnerability Status Summary",
      description: "Summary of vulnerability statuses",
      dataSource: "nvd",
      metricId: "vuln-status-summary",
      refreshInterval: getRefreshInterval("normal"),
    },
    // MITRE ATT&CK Widgets
    {
      id: "mitre-technique-count",
      type: "metric_card",
      title: "ATT&CK Techniques",
      description: "Total techniques in framework",
      dataSource: "mitre",
      metricId: "technique-count",
      refreshInterval: getRefreshInterval("hourly"),
    },
    {
      id: "mitre-tactics-coverage",
      type: "table",
      title: "MITRE Tactics Coverage",
      description: "ATT&CK tactics and technique counts",
      dataSource: "mitre",
      metricId: "tactics-coverage",
      refreshInterval: getRefreshInterval("slow"),
    },
    {
      id: "mitre-platform-coverage",
      type: "table",
      title: "Platform Coverage",
      description: "ATT&CK technique coverage by platform",
      dataSource: "mitre",
      metricId: "platform-coverage",
      refreshInterval: getRefreshInterval("slow"),
    },
    {
      id: "mitre-recent-updates",
      type: "list",
      title: "Recent Framework Updates",
      description: "Latest MITRE ATT&CK technique updates and additions",
      dataSource: "mitre",
      metricId: "recent-updates",
      refreshInterval: getRefreshInterval("slow"),
    },
    {
      id: "mitre-top-techniques",
      type: "list",
      title: "Most Versatile Techniques",
      description: "Techniques spanning multiple tactics and platforms",
      dataSource: "mitre",
      metricId: "top-techniques",
      refreshInterval: getRefreshInterval("slow"),
    },
  ],
};

// POST /api/dashboards/initialize - Initialize default dashboard if none exists
export async function POST() {
  try {
    // Import database connection at runtime
    const { db } = await import("@/lib/db/connection");

    // Check if any dashboards exist
    const existingDashboards = await db.select().from(dashboards).limit(1);

    if (existingDashboards.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Dashboards already exist",
        data: existingDashboards[0],
      });
    }

    // Create default dashboard
    const [newDashboard] = await db
      .insert(dashboards)
      .values(defaultDashboardTemplate)
      .returning();

    return NextResponse.json({
      success: true,
      message: "Default dashboard created",
      data: newDashboard,
    });
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize dashboard",
      },
      { status: 500 }
    );
  }
}
