CREATE TABLE IF NOT EXISTS "cisa_kev" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cve_id" text NOT NULL,
	"vendor_project" text NOT NULL,
	"product" text NOT NULL,
	"vulnerability_name" text NOT NULL,
	"date_added" timestamp NOT NULL,
	"short_description" text NOT NULL,
	"required_action" text NOT NULL,
	"due_date" timestamp,
	"known_ransomware_campaign_use" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cisa_kev_cve_id_unique" UNIQUE("cve_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_ingestion_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_added" integer DEFAULT 0,
	"records_updated" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mitre_attack_tactics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tactic_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"short_name" text,
	"version" text,
	"created" timestamp,
	"last_modified" timestamp,
	"references" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mitre_attack_tactics_tactic_id_unique" UNIQUE("tactic_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mitre_attack_techniques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"technique_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tactics" jsonb,
	"platforms" jsonb,
	"data_components" jsonb,
	"defenses" jsonb,
	"detection" text,
	"version" text,
	"created" timestamp,
	"last_modified" timestamp,
	"is_revoked" boolean DEFAULT false,
	"is_deprecated" boolean DEFAULT false,
	"kill_chain_phases" jsonb,
	"mitigations" jsonb,
	"references" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mitre_attack_techniques_technique_id_unique" UNIQUE("technique_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nvd_cve" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cve_id" text NOT NULL,
	"source_identifier" text,
	"published" timestamp NOT NULL,
	"last_modified" timestamp NOT NULL,
	"vuln_status" text NOT NULL,
	"cvss_v3_base_score" numeric(3, 1),
	"cvss_v3_base_severity" text,
	"cvss_v3_vector" text,
	"cvss_v2_base_score" numeric(3, 1),
	"cvss_v2_base_severity" text,
	"cvss_v2_vector" text,
	"descriptions" jsonb,
	"references" jsonb,
	"weaknesses" jsonb,
	"configurations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nvd_cve_cve_id_unique" UNIQUE("cve_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cisa_kev_cve_id_idx" ON "cisa_kev" USING btree ("cve_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cisa_kev_date_added_idx" ON "cisa_kev" USING btree ("date_added");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cisa_kev_vendor_idx" ON "cisa_kev" USING btree ("vendor_project");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingestion_source_idx" ON "data_ingestion_log" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingestion_status_idx" ON "data_ingestion_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingestion_started_at_idx" ON "data_ingestion_log" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mitre_tactic_id_idx" ON "mitre_attack_tactics" USING btree ("tactic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mitre_tactic_name_idx" ON "mitre_attack_tactics" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mitre_technique_id_idx" ON "mitre_attack_techniques" USING btree ("technique_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mitre_technique_name_idx" ON "mitre_attack_techniques" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mitre_last_modified_idx" ON "mitre_attack_techniques" USING btree ("last_modified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nvd_cve_cve_id_idx" ON "nvd_cve" USING btree ("cve_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nvd_cve_published_idx" ON "nvd_cve" USING btree ("published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nvd_cve_base_score_idx" ON "nvd_cve" USING btree ("cvss_v3_base_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nvd_cve_severity_idx" ON "nvd_cve" USING btree ("cvss_v3_base_severity");