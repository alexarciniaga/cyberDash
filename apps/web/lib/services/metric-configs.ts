import { MetricConfig } from "./metric-service";

/**
 * Metric Configuration Mapping
 * Defines how each metric endpoint maps to the unified service methods
 * This replaces 16 individual API route files
 */
export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  // CISA KEV Metrics
  "cisa/total-count": {
    id: "cisa_kev_total_count",
    title: "Total CISA KEV Vulnerabilities",
    description: "Known Exploited Vulnerabilities in CISA catalog",
    type: "counter",
    table: "cisa_kev",
    conditions: {
      dateField: "date_added",
    },
    metadata: {
      source: "cisa_kev",
    },
  },

  "cisa/vendor-breakdown": {
    id: "cisa_kev_vendor_breakdown",
    title: "CISA KEV Vendor Breakdown",
    description: "Top vendors by vulnerability count",
    type: "distribution",
    table: "cisa_kev",
    conditions: {
      groupBy: "vendor_project",
      orderBy: "COUNT(*) DESC, vendor_project ASC",
      limit: 15,
      dateField: "date_added",
    },
    metadata: {
      source: "cisa_kev",
    },
  },

  "cisa/product-distribution": {
    id: "cisa_kev_product_distribution",
    title: "CISA KEV Product Distribution",
    description: "Top products by vulnerability count",
    type: "distribution",
    table: "cisa_kev",
    conditions: {
      groupBy: "product",
      orderBy: "COUNT(*) DESC, product ASC",
      limit: 15,
      dateField: "date_added",
    },
    metadata: {
      source: "cisa_kev",
    },
  },

  "cisa/top-vendor": {
    id: "cisa_kev_top_vendor",
    title: "Top CISA KEV Vendor",
    description: "Vendor with most vulnerabilities",
    type: "distribution",
    table: "cisa_kev",
    conditions: {
      groupBy: "vendor_project",
      orderBy: "COUNT(*) DESC",
      limit: 1,
      dateField: "date_added",
    },
    metadata: {
      source: "cisa_kev",
    },
  },

  "cisa/new-vulns-rate": {
    id: "cisa_kev_new_vulns_rate",
    title: "CISA KEV New Vulnerabilities Rate",
    description: "Rate of new vulnerabilities added over time",
    type: "timeseries",
    table: "cisa_kev",
    conditions: {
      dateField: "date_added",
    },
    metadata: {
      source: "cisa_kev",
    },
  },

  "cisa/due-date-compliance": {
    id: "cisa_kev_due_date_compliance",
    title: "CISA KEV Due Date Compliance",
    description: "Vulnerabilities with due dates vs overdue",
    type: "distribution",
    table: "cisa_kev",
    conditions: {
      groupBy:
        "CASE WHEN due_date IS NULL THEN 'No Due Date' WHEN due_date < NOW() THEN 'Overdue' ELSE 'Active' END",
      orderBy: "COUNT(*) DESC",
      dateField: "date_added",
    },
    metadata: {
      source: "cisa_kev",
    },
  },

  // NVD CVE Metrics
  "nvd/critical-count": {
    id: "nvd_cve_critical_count",
    title: "Critical CVEs",
    description: "CVSS Score ≥ 9.0",
    type: "counter",
    table: "nvd_cve",
    conditions: {
      dateField: "published",
      conditions:
        "CAST(cvss_v3_base_score AS NUMERIC) >= 9.0 AND cvss_v3_base_score IS NOT NULL",
    },
    metadata: {
      source: "nvd_cve",
    },
  },

  "nvd/severity-distribution": {
    id: "nvd_cve_severity_distribution",
    title: "NVD CVE Severity Distribution",
    description: "Distribution of CVEs by CVSS severity",
    type: "distribution",
    table: "nvd_cve",
    conditions: {
      groupBy: "cvss_v3_base_severity",
      orderBy: "COUNT(*) DESC",
      dateField: "published",
      conditions: "cvss_v3_base_severity IS NOT NULL",
    },
    metadata: {
      source: "nvd_cve",
    },
  },

  "nvd/publication-trends": {
    id: "nvd_cve_publication_trends",
    title: "NVD CVE Publication Trends",
    description: "CVE publication trends over time",
    type: "timeseries",
    table: "nvd_cve",
    conditions: {
      dateField: "published",
    },
    metadata: {
      source: "nvd_cve",
    },
  },

  "nvd/recent-high-severity": {
    id: "nvd_cve_recent_high_severity",
    title: "Recent High Severity CVEs",
    description: "Recently published high severity CVEs (CVSS ≥ 7.0)",
    type: "distribution",
    table: "nvd_cve",
    conditions: {
      groupBy: "cve_id",
      orderBy: "MAX(published) DESC",
      limit: 10,
      dateField: "published",
      conditions:
        "CAST(cvss_v3_base_score AS NUMERIC) >= 7.0 AND cvss_v3_base_score IS NOT NULL",
    },
    metadata: {
      source: "nvd_cve",
    },
  },

  "nvd/vuln-status-summary": {
    id: "nvd_cve_vuln_status_summary",
    title: "NVD CVE Status Summary",
    description: "Distribution of CVEs by vulnerability status",
    type: "distribution",
    table: "nvd_cve",
    conditions: {
      groupBy: "vuln_status",
      orderBy: "COUNT(*) DESC",
      dateField: "published",
    },
    metadata: {
      source: "nvd_cve",
    },
  },

  // MITRE ATT&CK Metrics
  "mitre/technique-count": {
    id: "mitre_attack_technique_count",
    title: "ATT&CK Techniques",
    description: "Total techniques in framework",
    type: "simple-counter",
    table: "mitre_attack_techniques",
    conditions: {
      conditions: "is_revoked = false AND is_deprecated = false",
    },
    metadata: {
      source: "mitre_attack",
    },
  },

  "mitre/tactics-coverage": {
    id: "mitre_attack_tactics_coverage",
    title: "MITRE Tactics Coverage",
    description: "ATT&CK tactics and technique counts",
    type: "distribution",
    table: "mitre_attack_tactics",
    conditions: {
      groupBy: "name",
      orderBy: "COUNT(*) DESC",
      dateField: "created_at",
    },
    metadata: {
      source: "mitre_attack",
    },
  },

  "mitre/platform-coverage": {
    id: "mitre_attack_platform_coverage",
    title: "Platform Coverage",
    description: "ATT&CK technique coverage by platform",
    type: "distribution",
    table: "mitre_attack_techniques",
    conditions: {
      groupBy: "jsonb_array_elements_text(platforms)",
      orderBy: "COUNT(*) DESC",
      dateField: "created_at",
      conditions:
        "is_revoked = false AND is_deprecated = false AND platforms IS NOT NULL",
    },
    metadata: {
      source: "mitre_attack",
    },
  },

  "mitre/top-techniques": {
    id: "mitre_attack_top_techniques",
    title: "Most Versatile Techniques",
    description: "Techniques spanning multiple tactics and platforms",
    type: "distribution",
    table: "mitre_attack_techniques",
    conditions: {
      groupBy: "name",
      orderBy: "COUNT(*) DESC",
      dateField: "created_at",
      limit: 10,
      conditions:
        "is_revoked = false AND is_deprecated = false AND tactics IS NOT NULL AND platforms IS NOT NULL",
    },
    metadata: {
      source: "mitre_attack",
    },
  },

  "mitre/recent-updates": {
    id: "mitre_attack_recent_updates",
    title: "MITRE ATT&CK Recent Updates",
    description: "Latest MITRE ATT&CK technique updates and additions",
    type: "distribution",
    table: "mitre_attack_techniques",
    conditions: {
      groupBy: "name",
      orderBy: "MAX(last_modified) DESC",
      dateField: "created_at",
      limit: 10,
      conditions:
        "is_revoked = false AND is_deprecated = false AND last_modified IS NOT NULL",
    },
    metadata: {
      source: "mitre_attack",
    },
  },
};

/**
 * Get metric configuration by source and metric ID
 */
export function getMetricConfig(
  source: string,
  metricId: string
): MetricConfig | null {
  const key = `${source}/${metricId}`;
  return METRIC_CONFIGS[key] || null;
}

/**
 * Get all available metric configurations
 */
export function getAllMetricConfigs(): Record<string, MetricConfig> {
  return METRIC_CONFIGS;
}

/**
 * Get metric configurations by source
 */
export function getMetricConfigsBySource(
  source: string
): Record<string, MetricConfig> {
  const configs: Record<string, MetricConfig> = {};

  Object.entries(METRIC_CONFIGS).forEach(([key, config]) => {
    if (key.startsWith(`${source}/`)) {
      configs[key] = config;
    }
  });

  return configs;
}

/**
 * Validate if a metric configuration exists
 */
export function isValidMetric(source: string, metricId: string): boolean {
  return getMetricConfig(source, metricId) !== null;
}
