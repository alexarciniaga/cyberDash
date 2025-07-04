import { z } from "zod";

// CISA KEV Types
export const CisaKevSchema = z.object({
  cveID: z.string(),
  vendorProject: z.string(),
  product: z.string(),
  vulnerabilityName: z.string(),
  dateAdded: z.string().datetime(),
  shortDescription: z.string(),
  requiredAction: z.string(),
  dueDate: z.string().datetime().optional(),
  knownRansomwareCampaignUse: z.boolean().default(false),
  notes: z.string().optional(),
});

export type CisaKev = z.infer<typeof CisaKevSchema>;

// NVD CVE Types
export const NvdCveSchema = z.object({
  cveID: z.string(),
  sourceIdentifier: z.string().optional(),
  published: z.string().datetime(),
  lastModified: z.string().datetime(),
  vulnStatus: z.string(),
  cvssV3BaseScore: z.number().optional(),
  cvssV3BaseSeverity: z.string().optional(),
  cvssV3Vector: z.string().optional(),
  cvssV2BaseScore: z.number().optional(),
  cvssV2BaseSeverity: z.string().optional(),
  cvssV2Vector: z.string().optional(),
  descriptions: z
    .array(
      z.object({
        lang: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  references: z
    .array(
      z.object({
        url: z.string(),
        source: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

export type NvdCve = z.infer<typeof NvdCveSchema>;

// MITRE ATT&CK Types
export const MitreAttackTechniqueSchema = z.object({
  techniqueId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tactics: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  dataComponents: z.array(z.string()).optional(),
  detection: z.string().optional(),
  version: z.string().optional(),
  created: z.string().datetime().optional(),
  lastModified: z.string().datetime().optional(),
  isRevoked: z.boolean().default(false),
  isDeprecated: z.boolean().default(false),
});

export type MitreAttackTechnique = z.infer<typeof MitreAttackTechniqueSchema>;

export const MitreAttackTacticSchema = z.object({
  tacticId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  shortName: z.string().optional(),
  version: z.string().optional(),
  created: z.string().datetime().optional(),
  lastModified: z.string().datetime().optional(),
});

export type MitreAttackTactic = z.infer<typeof MitreAttackTacticSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  pagination: z
    .object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Metrics Types
export interface MetricValue {
  label: string;
  value: number;
  change?: number; // Change from previous period
  changePercent?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

// Extended timeseries point for APIs that return additional data
export interface TimeSeriesPointExtended {
  timestamp?: string;
  date?: string;
  value?: number;
  total?: number;
  count?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListData {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface MetricData {
  id: string;
  title: string;
  description: string;
  type: "counter" | "gauge" | "timeseries" | "distribution" | "table" | "list";
  value?: MetricValue;
  timeseries?: (TimeSeriesPoint | TimeSeriesPointExtended)[];
  distribution?: MetricValue[];
  table?: TableData;
  list?: ListData[];
  lastUpdated: string;
  source: "cisa" | "nvd" | "mitre";
  metadata?: Record<string, any>; // Additional metadata from API responses
}

// Grid Layout Types
export interface GridLayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean; // cannot be dragged or resized
}

export interface WidgetConfig {
  id: string;
  type:
    | "metric_card"
    | "chart"
    | "table"
    | "list"
    | "vendor_card"
    | "progress_bar"
    | "carousel"
    | "avatar_list"
    | "gauge"
    | "heatmap";
  title: string;
  description?: string;
  dataSource: "cisa" | "nvd" | "mitre";
  metricId?: string;
  refreshInterval?: number; // seconds, defaults to 60
  chartType?: "line" | "bar" | "pie"; // for chart widgets
  settings?: Record<string, any>; // widget-specific settings
  size?: {
    // optional custom grid size
    w: number;
    h: number;
    minW: number;
    minH: number;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  layout: { [key: string]: GridLayoutItem[] };
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
}
