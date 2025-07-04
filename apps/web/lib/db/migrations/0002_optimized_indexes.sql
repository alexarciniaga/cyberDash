-- Optimized indexes for better query performance

-- CISA KEV optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "cisa_kev_vendor_date_idx" 
ON "cisa_kev" ("vendor_project", "date_added");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "cisa_kev_due_date_idx" 
ON "cisa_kev" ("due_date") WHERE "due_date" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "cisa_kev_ransomware_idx" 
ON "cisa_kev" ("known_ransomware_campaign_use") WHERE "known_ransomware_campaign_use" = true;

-- NVD CVE optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "nvd_cve_severity_published_idx" 
ON "nvd_cve" ("cvss_v3_base_severity", "published");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "nvd_cve_critical_idx" 
ON "nvd_cve" ("cvss_v3_base_score") WHERE "cvss_v3_base_score" >= '9.0';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "nvd_cve_last_modified_idx" 
ON "nvd_cve" ("last_modified");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "nvd_cve_vuln_status_idx" 
ON "nvd_cve" ("vuln_status");

-- MITRE ATT&CK optimizations  
CREATE INDEX CONCURRENTLY IF NOT EXISTS "mitre_techniques_active_idx" 
ON "mitre_attack_techniques" ("technique_id") 
WHERE "is_revoked" = false AND "is_deprecated" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "mitre_techniques_tactics_idx" 
ON "mitre_attack_techniques" USING GIN ("tactics");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "mitre_techniques_platforms_idx" 
ON "mitre_attack_techniques" USING GIN ("platforms");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "mitre_techniques_version_modified_idx" 
ON "mitre_attack_techniques" ("version", "last_modified");

-- Data ingestion log optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ingestion_log_source_status_idx" 
ON "data_ingestion_log" ("source", "status", "started_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ingestion_log_completed_idx" 
ON "data_ingestion_log" ("completed_at") WHERE "completed_at" IS NOT NULL;

-- Composite indexes for common dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "cisa_kev_product_count_idx" 
ON "cisa_kev" ("product", "date_added");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "nvd_cve_published_month_idx" 
ON "nvd_cve" (DATE_TRUNC('month', "published"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS "nvd_cve_cvss_range_idx" 
ON "nvd_cve" (
  CASE 
    WHEN "cvss_v3_base_score" >= '9.0' THEN 'Critical'
    WHEN "cvss_v3_base_score" >= '7.0' THEN 'High'  
    WHEN "cvss_v3_base_score" >= '4.0' THEN 'Medium'
    ELSE 'Low'
  END
); 