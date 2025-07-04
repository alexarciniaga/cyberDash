import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  decimal,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// CISA Known Exploited Vulnerabilities (KEV)
export const cisaKev = pgTable(
  "cisa_kev",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cveID: text("cve_id").notNull().unique(),
    vendorProject: text("vendor_project").notNull(),
    product: text("product").notNull(),
    vulnerabilityName: text("vulnerability_name").notNull(),
    dateAdded: timestamp("date_added").notNull(),
    shortDescription: text("short_description").notNull(),
    requiredAction: text("required_action").notNull(),
    dueDate: timestamp("due_date"),
    knownRansomwareCampaignUse: boolean(
      "known_ransomware_campaign_use"
    ).default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("cisa_kev_cve_id_idx").on(table.cveID),
    index("cisa_kev_date_added_idx").on(table.dateAdded),
    index("cisa_kev_vendor_idx").on(table.vendorProject),
  ]
);

// NVD CVE Data
export const nvdCve = pgTable(
  "nvd_cve",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cveID: text("cve_id").notNull().unique(),
    sourceIdentifier: text("source_identifier"),
    published: timestamp("published").notNull(),
    lastModified: timestamp("last_modified").notNull(),
    vulnStatus: text("vuln_status").notNull(),

    // CVSS Metrics
    cvssV3BaseScore: decimal("cvss_v3_base_score", { precision: 3, scale: 1 }),
    cvssV3BaseSeverity: text("cvss_v3_base_severity"),
    cvssV3Vector: text("cvss_v3_vector"),
    cvssV2BaseScore: decimal("cvss_v2_base_score", { precision: 3, scale: 1 }),
    cvssV2BaseSeverity: text("cvss_v2_base_severity"),
    cvssV2Vector: text("cvss_v2_vector"),

    // Descriptions and References
    descriptions: jsonb("descriptions"),
    references: jsonb("references"),

    // Weakness and Configuration
    weaknesses: jsonb("weaknesses"),
    configurations: jsonb("configurations"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("nvd_cve_cve_id_idx").on(table.cveID),
    index("nvd_cve_published_idx").on(table.published),
    index("nvd_cve_base_score_idx").on(table.cvssV3BaseScore),
    index("nvd_cve_severity_idx").on(table.cvssV3BaseSeverity),
  ]
);

// MITRE ATT&CK Techniques
export const mitreAttackTechniques = pgTable(
  "mitre_attack_techniques",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    techniqueId: text("technique_id").notNull().unique(), // T1234
    name: text("name").notNull(),
    description: text("description"),

    // ATT&CK Framework Data
    tactics: jsonb("tactics"), // Array of tactic IDs
    platforms: jsonb("platforms"), // Array of platforms
    dataComponents: jsonb("data_components"),
    defenses: jsonb("defenses"),
    detection: text("detection"),

    // Metadata
    version: text("version"),
    created: timestamp("created"),
    lastModified: timestamp("last_modified"),
    isRevoked: boolean("is_revoked").default(false),
    isDeprecated: boolean("is_deprecated").default(false),

    // Additional Data
    killChainPhases: jsonb("kill_chain_phases"),
    mitigations: jsonb("mitigations"),
    references: jsonb("references"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mitre_technique_id_idx").on(table.techniqueId),
    index("mitre_technique_name_idx").on(table.name),
    index("mitre_last_modified_idx").on(table.lastModified),
  ]
);

// MITRE ATT&CK Tactics
export const mitreAttackTactics = pgTable(
  "mitre_attack_tactics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tacticId: text("tactic_id").notNull().unique(), // TA1234
    name: text("name").notNull(),
    description: text("description"),
    shortName: text("short_name"),

    // Metadata
    version: text("version"),
    created: timestamp("created"),
    lastModified: timestamp("last_modified"),

    references: jsonb("references"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("mitre_tactic_id_idx").on(table.tacticId),
    index("mitre_tactic_name_idx").on(table.name),
  ]
);

// Data ingestion tracking
export const dataIngestionLog = pgTable(
  "data_ingestion_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(), // 'cisa_kev', 'nvd_cve', 'mitre_attack'
    status: text("status").notNull(), // 'success', 'failed', 'in_progress'
    recordsProcessed: integer("records_processed").default(0),
    recordsAdded: integer("records_added").default(0),
    recordsUpdated: integer("records_updated").default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ingestion_source_idx").on(table.source),
    index("ingestion_status_idx").on(table.status),
    index("ingestion_started_at_idx").on(table.startedAt),
  ]
);

// Data ingestion state tracking - NEW TABLE
export const dataIngestionState = pgTable(
  "data_ingestion_state",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull().unique(), // 'cisa_kev', 'nvd_cve', 'mitre_attack'
    lastSuccessfulRun: timestamp("last_successful_run"),
    lastModifiedTimestamp: timestamp("last_modified_timestamp"), // Track API's lastModified
    lastRecordId: text("last_record_id"), // For pagination
    configurationHash: text("configuration_hash"), // Track API endpoint changes

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("ingestion_state_source_idx").on(table.source)]
);

// Dashboard configurations
export const dashboards = pgTable(
  "dashboards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false),
    layout: jsonb("layout").notNull(), // GridLayoutItem[]
    widgets: jsonb("widgets").notNull(), // WidgetConfig[]
    settings: jsonb("settings"), // Dashboard-specific settings

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("dashboard_name_idx").on(table.name),
    index("dashboard_is_default_idx").on(table.isDefault),
  ]
);

// Dashboard sharing and permissions (for future use)
export const dashboardPermissions = pgTable(
  "dashboard_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dashboardId: uuid("dashboard_id")
      .notNull()
      .references(() => dashboards.id, { onDelete: "cascade" }),
    userId: text("user_id"), // For future user authentication
    permission: text("permission").notNull(), // 'read', 'write', 'admin'

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("dashboard_permissions_dashboard_id_idx").on(table.dashboardId),
    index("dashboard_permissions_user_id_idx").on(table.userId),
  ]
);
