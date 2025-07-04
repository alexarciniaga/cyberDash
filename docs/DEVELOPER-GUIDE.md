# Developer Guide

Complete guide for developers contributing to CyberDash.

## 🏗️ Architecture Overview

### System Design

CyberDash is a **full-stack Next.js application** with clear separation of concerns:

```
Frontend (Next.js 15 + React 19)
    ↓
API Layer (Next.js API Routes)
    ↓
Database (PostgreSQL + Drizzle ORM)
    ↓
External APIs (CISA KEV, NVD CVE, MITRE ATT&CK)
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, shadcn/ui, TanStack Query
- **Backend**: Next.js API Routes, Zod validation
- **Database**: PostgreSQL 16, Drizzle ORM
- **Build**: Turbo (monorepo), pnpm, ESLint, Prettier

### Project Structure

```
cyberDash/
├── apps/web/                 # Main Next.js application
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── page.tsx        # Dashboard page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── widgets/       # Dashboard widgets
│   └── lib/               # Utilities and database
├── packages/              # Shared configurations
└── docs/                 # Documentation
```

## 🚀 Development Setup

### Prerequisites

- Node.js 20+, pnpm 9+, Docker Desktop
- See [SETUP.md](./SETUP.md) for detailed installation

### Quick Start

```bash
git clone <repo> && cd cyberdash
pnpm install
docker compose up -d
cd cyberDash/apps/web && pnpm db:push && pnpm dev
```

### Development Workflow

```bash
# Start development
docker compose up -d  # Database
pnpm dev             # Next.js dev server

# Code quality
pnpm typecheck       # TypeScript validation
pnpm lint           # ESLint
pnpm lint:fix       # Auto-fix issues

# Database operations
pnpm db:studio      # Database GUI
pnpm db:push        # Apply schema changes
pnpm db:generate    # Generate migrations
```

## 🎯 Core Concepts

### Data Flow

1. **External APIs** → Validation (Zod) → Database (PostgreSQL)
2. **Database** → API Routes → Frontend (TanStack Query)
3. **Frontend** → Widgets → Real-time Dashboard

### Widget System

```typescript
interface WidgetConfig {
  id: string;
  type: "metric_card" | "chart" | "table" | "list";
  title: string;
  dataSource: "cisa_kev" | "nvd_cve" | "mitre_attack";
  metricId?: string;
  refreshInterval?: number;
}
```

### Dashboard Management

- **Multiple dashboards** with drag-and-drop layouts
- **Persistent storage** in PostgreSQL
- **Real-time updates** with 60-second auto-refresh

## 🎯 Widget System Reference

### Available Widget Types

CyberDash supports 5 distinct widget types with specific data format requirements:

```typescript
type WidgetType = "metric_card" | "vendor_card" | "chart" | "table" | "list";
```

#### Widget Type Specifications

| Widget Type    | Data Types Accepted    | Use Case                | Default Size |
|---------------|------------------------|-------------------------|--------------|
| `metric_card` | `counter`, `gauge`     | Single KPI metrics      | 3×3 grid     |
| `vendor_card` | `counter`              | Top vendor display      | 3×3 grid     |
| `chart`       | `timeseries`           | Trends and time data    | 6×5 grid     |
| `table`       | `table`, `distribution`| Detailed data listings  | 6×5 grid     |
| `list`        | `list`, `distribution` | Rankings and top N      | 4×4 grid     |

### Complete Widget Library (16 widgets)

#### CISA KEV Widgets (7 widgets)

```typescript
// CISA KEV Total Count
{
  id: "cisa-kev-count",
  type: "metric_card",
  title: "CISA KEV Total",
  dataSource: "cisa",
  metricId: "total_count",
  refreshInterval: 60, // seconds
}

// Top Vendor Card
{
  id: "cisa-top-vendor", 
  type: "vendor_card",
  title: "Top Vendor",
  dataSource: "cisa",
  metricId: "top_vendor",
  refreshInterval: 30,
}

// Vendor Leaderboard List
{
  id: "cisa-vendor-leaderboard",
  type: "list",
  title: "Vendor Leaderboard", 
  dataSource: "cisa",
  metricId: "vendor_breakdown",
  refreshInterval: 300,
}

// Due Date Compliance Gauge
{
  id: "cisa-due-date-compliance",
  type: "metric_card",
  title: "Due Date Compliance",
  dataSource: "cisa", 
  metricId: "due_date_compliance",
  refreshInterval: 30,
}

// Vendor Breakdown Table
{
  id: "cisa-vendor-breakdown",
  type: "table",
  title: "Vendor Breakdown",
  dataSource: "cisa",
  metricId: "vendor_breakdown", 
  refreshInterval: 300,
  size: { w: 8, h: 6, minW: 6, minH: 4 }, // Custom larger size
}

// New Vulnerabilities Rate Chart
{
  id: "cisa-new-vulns-rate",
  type: "chart", 
  title: "New Vulnerabilities Rate",
  dataSource: "cisa",
  metricId: "new_vulns_rate",
  refreshInterval: 60,
  size: { w: 8, h: 7, minW: 6, minH: 7 }, // Taller chart
}

// Product Distribution Chart
{
  id: "cisa-product-distribution",
  type: "chart",
  title: "Product Distribution", 
  dataSource: "cisa",
  metricId: "product_distribution",
  refreshInterval: 300,
}
```

#### NVD CVE Widgets (5 widgets)

```typescript
// Critical CVE Count
{
  id: "nvd-cve-critical",
  type: "metric_card",
  title: "Critical CVEs",
  dataSource: "nvd",
  metricId: "critical_count", 
  refreshInterval: 30,
}

// Publication Trends Chart  
{
  id: "nvd-publication-trends",
  type: "chart",
  title: "CVE Publication Trends",
  dataSource: "nvd",
  metricId: "publication_trends",
  refreshInterval: 60,
  size: { w: 8, h: 5, minW: 6, minH: 5 }, // Wider chart
}

// Severity Distribution Table
{
  id: "nvd-severity-distribution", 
  type: "table",
  title: "Severity Distribution",
  dataSource: "nvd",
  metricId: "severity_distribution",
  refreshInterval: 300,
}

// Recent High Severity List
{
  id: "nvd-recent-high-severity",
  type: "list",
  title: "Recent High Severity",
  dataSource: "nvd", 
  metricId: "recent_high_severity",
  refreshInterval: 30,
}

// Vulnerability Status Summary Table
{
  id: "nvd-vuln-status-summary",
  type: "table",
  title: "Vulnerability Status Summary",
  dataSource: "nvd",
  metricId: "vuln_status_summary",
  refreshInterval: 60,
}
```

#### MITRE ATT&CK Widgets (4 widgets)

```typescript
// Technique Count
{
  id: "mitre-technique-count",
  type: "metric_card", 
  title: "ATT&CK Techniques",
  dataSource: "mitre",
  metricId: "technique_count",
  refreshInterval: 3600, // 1 hour - data changes infrequently
}

// Tactics Coverage Table
{
  id: "mitre-tactics-coverage",
  type: "table",
  title: "MITRE Tactics Coverage",
  dataSource: "mitre",
  metricId: "tactics_coverage",
  refreshInterval: 300,
}

// Platform Coverage Table  
{
  id: "mitre-platform-coverage",
  type: "table",
  title: "Platform Coverage",
  dataSource: "mitre",
  metricId: "platform_coverage", 
  refreshInterval: 300,
}

// Recent Updates List
{
  id: "mitre-recent-updates",
  type: "list",
  title: "Recent Framework Updates",
  dataSource: "mitre",
  metricId: "recent_updates",
  refreshInterval: 300,
}

// Top Techniques List
{
  id: "mitre-top-techniques",
  type: "list", 
  title: "Most Versatile Techniques",
  dataSource: "mitre",
  metricId: "top_techniques",
  refreshInterval: 300,
}
```

### Widget Data Format Requirements

#### Counter Data Format
```typescript
interface CounterMetric {
  type: "counter";
  value: {
    label: string;
    value: number;
    change?: number;        // Change from previous period
    changePercent?: number; // Percentage change
  };
  metadata?: {
    period?: string;       // Time period for comparison
    lastUpdated: string;   // ISO timestamp
  };
}
```

#### Gauge Data Format  
```typescript
interface GaugeMetric {
  type: "gauge";
  value: {
    label: string;
    value: number;         // Current value (0-100 for percentages)
    target?: number;       // Target/threshold value
    unit?: string;         // "%" for percentages
  };
  metadata?: {
    status?: "good" | "warning" | "critical";
    lastUpdated: string;
  };
}
```

#### Timeseries Data Format
```typescript
interface TimeseriesMetric {
  type: "timeseries";
  timeseries: Array<{
    timestamp: string;     // ISO date string
    value: number;         // Primary metric value
    [key: string]: any;    // Additional data fields
  }>;
  metadata?: {
    interval?: string;     // "hour", "day", "week"
    total?: number;        // Total count across time range
    lastUpdated: string;
  };
}
```

#### Distribution Data Format
```typescript
interface DistributionMetric {
  type: "distribution";
  distribution: Array<{
    label: string;         // Category name
    value: number;         // Count/percentage
    percentage?: number;   // Percentage of total
  }>;
  metadata?: {
    total?: number;        // Sum of all values
    lastUpdated: string;
  };
}
```

#### List Data Format
```typescript
interface ListMetric {
  type: "list";
  list: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string;        // Display value
    badge?: {
      text: string;
      variant?: "default" | "secondary" | "destructive" | "outline";
    };
  }>;
  metadata?: {
    total?: number;
    lastUpdated: string;
  };
}
```

### Refresh Interval Guidelines

**Refresh intervals are optimized based on data volatility:**

- **30 seconds**: Real-time threat indicators (critical CVEs, top vendors)
- **60 seconds**: Primary metrics (totals, rates, trends)  
- **300 seconds (5 min)**: Detailed breakdowns (tables, distributions)
- **3600 seconds (1 hr)**: Framework data (MITRE techniques - changes infrequently)

### Widget Grid System

**Grid Layout Configuration:**
- **Grid units**: 12 columns × unlimited rows
- **Responsive**: Automatically adjusts to screen size
- **Minimum sizes**: Prevent widgets from becoming unusable
- **Drag & drop**: Users can rearrange widgets dynamically

**Standard Widget Sizes:**
```typescript
const DEFAULT_WIDGET_SIZES = {
  metric_card: { w: 3, h: 3, minW: 2, minH: 2 },
  vendor_card: { w: 3, h: 3, minW: 2, minH: 2 },
  chart: { w: 6, h: 5, minW: 4, minH: 5 },
  table: { w: 6, h: 5, minW: 4, minH: 4 },
  list: { w: 4, h: 4, minW: 3, minH: 3 },
};
```

### Data Transformation Functions

**Built-in transformations for widget compatibility:**

```typescript
// Transform distribution data for table display
transformDistributionToTable(distribution: MetricValue[]): TableData

// Transform distribution data for list display  
transformDistributionToList(distribution: MetricValue[]): ListData

// Ensure chronological ordering for charts
ensureChronologicalOrder(timeseries: TimeSeriesPoint[]): TimeSeriesPoint[]
```

## 📡 API Reference

### API Design Patterns

All endpoints follow consistent patterns:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Core API Endpoints

#### Health Check

```bash
GET /api/health
# Returns system status and database connectivity
```

Response includes:
- Database connection status
- Schema readiness
- Table integrity checks
- Timestamp of last check

#### Dashboard Management

```bash
GET /api/dashboards                    # List all dashboards
POST /api/dashboards                   # Create new dashboard
GET /api/dashboards/[id]               # Get specific dashboard
PUT /api/dashboards/[id]               # Update dashboard layout/widgets
DELETE /api/dashboards/[id]            # Delete dashboard

# Specialized endpoints
POST /api/dashboards/initialize        # Create default dashboard if none exists
POST /api/dashboards/migrate-vendor-widgets  # Migrate legacy widget configs
```

#### Data Ingestion Endpoints

```bash
POST /api/ingestion/cisa-kev          # Trigger CISA KEV data ingestion
POST /api/ingestion/nvd-cve           # Trigger NVD CVE data ingestion  
POST /api/ingestion/mitre-attack      # Trigger MITRE ATT&CK ingestion
```

**Ingestion Response Format:**
```json
{
  "success": true,
  "data": {
    "message": "CISA KEV ingestion completed successfully",
    "recordsProcessed": 1127,
    "recordsAdded": 45,
    "recordsUpdated": 12,
    "catalogVersion": "2024.01.15",
    "dateReleased": "2024-01-15T00:00:00.000Z",
    "totalVulnerabilities": 1127,
    "duration": 2341
  }
}
```

### Complete Metrics API Reference

#### CISA KEV Metrics (6 endpoints)

```bash
GET /api/metrics/cisa/total-count           # Total known exploited vulnerabilities
GET /api/metrics/cisa/top-vendor            # Vendor with most vulnerabilities  
GET /api/metrics/cisa/vendor-breakdown      # All vendors with vulnerability counts
GET /api/metrics/cisa/due-date-compliance   # Percentage compliance with CISA deadlines
GET /api/metrics/cisa/new-vulns-rate        # Time series of new vulnerabilities
GET /api/metrics/cisa/product-distribution  # Vulnerability distribution by product
```

**Data Types by Endpoint:**
- `total-count` → `counter` (single number with metadata)
- `top-vendor` → `counter` (vendor name + count) 
- `vendor-breakdown` → `distribution` (vendor rankings)
- `due-date-compliance` → `gauge` (percentage with progress)
- `new-vulns-rate` → `timeseries` (chronological data points)
- `product-distribution` → `distribution` (product rankings)

#### NVD CVE Metrics (5 endpoints)

```bash
GET /api/metrics/nvd/critical-count        # Critical severity CVEs (CVSS ≥ 9.0)
GET /api/metrics/nvd/publication-trends    # CVE publication over time
GET /api/metrics/nvd/severity-distribution # Breakdown by CVSS severity levels
GET /api/metrics/nvd/recent-high-severity  # Latest Critical/High severity CVEs
GET /api/metrics/nvd/vuln-status-summary   # CVE processing status distribution
```

**Data Types by Endpoint:**
- `critical-count` → `counter` (single number)
- `publication-trends` → `timeseries` (chronological publication data)
- `severity-distribution` → `distribution` (severity level breakdown)
- `recent-high-severity` → `list` (latest high-impact CVEs)
- `vuln-status-summary` → `distribution` (status category breakdown)

#### MITRE ATT&CK Metrics (5 endpoints)

```bash
GET /api/metrics/mitre/technique-count    # Total techniques in framework
GET /api/metrics/mitre/tactics-coverage   # Techniques grouped by attack tactics
GET /api/metrics/mitre/platform-coverage  # Technique coverage by target platform
GET /api/metrics/mitre/recent-updates     # Latest framework updates and additions
GET /api/metrics/mitre/top-techniques     # Most versatile cross-platform techniques
```

**Data Types by Endpoint:**
- `technique-count` → `counter` (single number)
- `tactics-coverage` → `distribution` (tactic breakdown with counts)
- `platform-coverage` → `distribution` (platform breakdown)
- `recent-updates` → `list` (latest technique updates)
- `top-techniques` → `list` (versatile techniques ranking)

#### CVE Detail Lookup

```bash
GET /api/vulnerabilities/cisa            # List CISA KEV vulnerabilities with pagination
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 100)
- `search` - Search term for CVE ID, vendor, or product
- `vendor` - Filter by specific vendor
- `dateAdded` - Filter by date added (ISO format)

### Widget Data Type Compatibility

**Widget Type Requirements:**
- `metric_card` → Expects `counter` or `gauge` data types
- `vendor_card` → Expects `counter` data type with vendor information
- `chart` → Expects `timeseries` data type with chronological ordering
- `table` → Expects `table` or `distribution` data types  
- `list` → Expects `list` or `distribution` data types

**Data Transformation:**
- Tables can render `distribution` data via `transformDistributionToTable()`
- Lists can render `distribution` data via `transformDistributionToList()`
- Charts require chronological ordering (oldest to newest) for proper time flow

### API Query Parameters

Most metrics endpoints support optional query parameters:

```bash
# Date range filtering (where applicable)
?startDate=2024-01-01&endDate=2024-01-31

# Pagination for list endpoints  
?page=1&limit=50

# Search/filtering
?search=microsoft&vendor=Microsoft
```

### Error Handling

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Descriptive error message",
  "details": "Additional technical details (in development mode)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Invalid request parameters
- `404` - Resource not found
- `500` - Internal server error
- `503` - Database connectivity issues

## 🗄️ Database Schema

### Complete Database Schema

#### Raw Data Storage Tables

```sql
-- CISA Known Exploited Vulnerabilities
CREATE TABLE cisa_kev (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cve_id TEXT NOT NULL UNIQUE,
    vendor_project TEXT NOT NULL,
    product TEXT NOT NULL,
    vulnerability_name TEXT NOT NULL,
    date_added TIMESTAMP NOT NULL,
    short_description TEXT NOT NULL,
    required_action TEXT NOT NULL,
    due_date TIMESTAMP,
    known_ransomware_campaign_use BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for CISA KEV
CREATE INDEX cisa_kev_cve_id_idx ON cisa_kev (cve_id);
CREATE INDEX cisa_kev_date_added_idx ON cisa_kev (date_added);
CREATE INDEX cisa_kev_vendor_idx ON cisa_kev (vendor_project);

-- NVD CVE Database
CREATE TABLE nvd_cve (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cve_id TEXT NOT NULL UNIQUE,
    source_identifier TEXT,
    published TIMESTAMP NOT NULL,
    last_modified TIMESTAMP NOT NULL,
    vuln_status TEXT NOT NULL,
    
    -- CVSS v3 Metrics
    cvss_v3_base_score DECIMAL(3,1),
    cvss_v3_base_severity TEXT,
    cvss_v3_vector TEXT,
    
    -- CVSS v2 Metrics  
    cvss_v2_base_score DECIMAL(3,1),
    cvss_v2_base_severity TEXT,
    cvss_v2_vector TEXT,
    
    -- JSON Data
    descriptions JSONB,        -- Array of {lang, value} objects
    references JSONB,          -- Array of {url, source, tags} objects
    weaknesses JSONB,          -- CWE information
    configurations JSONB,      -- CPE configurations
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for NVD CVE
CREATE INDEX nvd_cve_cve_id_idx ON nvd_cve (cve_id);
CREATE INDEX nvd_cve_published_idx ON nvd_cve (published);
CREATE INDEX nvd_cve_base_score_idx ON nvd_cve (cvss_v3_base_score);
CREATE INDEX nvd_cve_severity_idx ON nvd_cve (cvss_v3_base_severity);

-- MITRE ATT&CK Techniques
CREATE TABLE mitre_attack_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technique_id TEXT NOT NULL UNIQUE,  -- T1234, T1234.001
    name TEXT NOT NULL,
    description TEXT,
    
    -- ATT&CK Framework Data (stored as JSON arrays)
    tactics JSONB,               -- Array of tactic IDs/names
    platforms JSONB,             -- Array of platforms
    data_components JSONB,       -- Array of data components
    defenses JSONB,              -- Array of defense techniques
    detection TEXT,              -- Detection methodology
    
    -- Metadata
    version TEXT,
    created TIMESTAMP,
    last_modified TIMESTAMP,
    is_revoked BOOLEAN DEFAULT false,
    is_deprecated BOOLEAN DEFAULT false,
    
    -- Additional Framework Data
    kill_chain_phases JSONB,    -- Array of kill chain phases
    mitigations JSONB,          -- Array of mitigation IDs
    references JSONB,           -- Array of external references
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for MITRE Techniques
CREATE INDEX mitre_technique_id_idx ON mitre_attack_techniques (technique_id);
CREATE INDEX mitre_technique_name_idx ON mitre_attack_techniques (name);
CREATE INDEX mitre_last_modified_idx ON mitre_attack_techniques (last_modified);

-- MITRE ATT&CK Tactics  
CREATE TABLE mitre_attack_tactics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tactic_id TEXT NOT NULL UNIQUE,     -- TA0001, etc.
    name TEXT NOT NULL,
    description TEXT,
    short_name TEXT,                    -- Used for technique mapping
    
    -- Metadata
    version TEXT,
    created TIMESTAMP,
    last_modified TIMESTAMP,
    references JSONB,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for MITRE Tactics
CREATE INDEX mitre_tactic_id_idx ON mitre_attack_tactics (tactic_id);
CREATE INDEX mitre_tactic_name_idx ON mitre_attack_tactics (name);
```

#### Application Management Tables

```sql
-- Dashboard Configurations
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    
    -- Dashboard Layout and Widgets (JSON)
    layout JSONB NOT NULL,              -- Array of GridLayoutItem objects
    widgets JSONB NOT NULL,             -- Array of WidgetConfig objects
    settings JSONB,                     -- Dashboard-specific settings
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for Dashboards
CREATE INDEX dashboard_name_idx ON dashboards (name);
CREATE INDEX dashboard_default_idx ON dashboards (is_default);
```

#### Data Pipeline Management Tables

```sql
-- Data Ingestion Logging
CREATE TABLE data_ingestion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,               -- 'cisa_kev', 'nvd_cve', 'mitre_attack'
    status TEXT NOT NULL,               -- 'success', 'failed', 'in_progress'
    
    -- Processing Statistics
    records_processed INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    
    -- Error Information
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for Ingestion Log
CREATE INDEX ingestion_source_idx ON data_ingestion_log (source);
CREATE INDEX ingestion_status_idx ON data_ingestion_log (status);
CREATE INDEX ingestion_started_at_idx ON data_ingestion_log (started_at);

-- Data Ingestion State Tracking
CREATE TABLE data_ingestion_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL UNIQUE,        -- 'cisa_kev', 'nvd_cve', 'mitre_attack'
    
    -- State Tracking
    last_successful_run TIMESTAMP,
    last_modified_timestamp TIMESTAMP,   -- Track API's lastModified for incremental updates
    last_record_id TEXT,                 -- For pagination/cursor-based APIs
    configuration_hash TEXT,             -- Track API endpoint/config changes
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for Ingestion State
CREATE INDEX ingestion_state_source_idx ON data_ingestion_state (source);
```

### Schema Management

```bash
# Make schema changes in lib/db/schema.ts
pnpm db:generate    # Generate migration files from schema changes
pnpm db:push        # Apply schema directly to development database
pnpm db:migrate     # Run migrations in production (recommended)
pnpm db:studio      # Open Drizzle Studio for visual database management
```

### Key Schema Design Decisions

#### JSON Storage Strategy

**Why JSONB for complex data:**
- **ATT&CK Framework Data**: Tactics, platforms, and references are arrays that vary in structure
- **CVE References**: External links and metadata have flexible schema  
- **Dashboard Layouts**: Widget configurations need to be flexible and extensible
- **Performance**: PostgreSQL JSONB provides indexing and querying capabilities

**JSONB Fields:**
- `mitre_attack_techniques.tactics` - Array of tactic names/IDs
- `nvd_cve.descriptions` - Multilingual vulnerability descriptions
- `nvd_cve.references` - External links with metadata
- `dashboards.layout` - Grid layout configuration
- `dashboards.widgets` - Widget configuration array

#### Indexing Strategy

**Performance Optimizations:**
- **Primary lookups**: CVE IDs, technique IDs get unique indexes
- **Time-based queries**: Date fields indexed for time series metrics
- **Filtering**: Vendor, severity, and platform fields indexed for dashboard widgets
- **JSON querying**: JSONB fields support GIN indexes where needed

#### Data Integrity

**Constraints and Validation:**
- **Unique constraints**: Prevent duplicate CVEs and techniques
- **Not null constraints**: Ensure critical fields are always populated
- **Foreign key relationships**: Maintained at application level for flexibility
- **Data validation**: Zod schemas validate data before database insertion

### Migration History

**Applied Migrations:**
1. **0000_productive_gladiator.sql** - Initial schema with basic tables
2. **0001_public_stature.sql** - Added MITRE ATT&CK tables and dashboard support
3. **0002_fair_sunset_bain.sql** - Enhanced ingestion tracking and optimization
4. **0002_optimized_indexes.sql** - Performance improvements and additional indexes

**Future Migrations:**
- User authentication tables (planned)
- Audit logging for dashboard changes (planned)
- Data source configuration management (planned)

## 🧩 Adding Features

### Adding New Widgets

1. **Create Widget Component**

```typescript
// components/widgets/my-new-widget.tsx
export function MyNewWidget({ config }: { config: WidgetConfig }) {
  const { data } = useMetricData(config);
  return <div>{/* Widget content */}</div>;
}
```

2. **Add to Widget Registry**

```typescript
// Update widget type unions and component mapping
type WidgetType = "metric_card" | "chart" | "table" | "my_new_widget";
```

3. **Create API Endpoint**

```typescript
// app/api/metrics/source/my-metric/route.ts
export async function GET() {
  // Fetch and return metric data
}
```

### Adding New Data Sources

1. **Define Schema**

```typescript
// lib/db/schema.ts
export const myDataSource = pgTable("my_data_source", {
  id: serial("id").primaryKey(),
  // ... other fields
});
```

2. **Create Ingestion Endpoint**

```typescript
// app/api/ingestion/my-source/route.ts
export async function POST() {
  // Fetch external data, validate, store in database
}
```

3. **Add Metrics Endpoints**

```typescript
// app/api/metrics/my-source/[metric]/route.ts
export async function GET() {
  // Query database and return processed metrics
}
```

## 🧪 Testing

### Current Testing Status

- **Manual testing** via API endpoints and UI
- **Type safety** enforced by TypeScript and Zod
- **Automated testing** planned (see roadmap)

### Manual Testing

```bash
# API testing
curl http://localhost:3000/api/health
curl http://localhost:3000/api/metrics/cisa/total-count

# Database testing
pnpm db:studio  # Visual database inspection

# Frontend testing
# Open http://localhost:3000 and test widgets
```

### Future Testing Plans

- **Unit tests** with Vitest
- **Integration tests** for API endpoints
- **E2E tests** with Playwright

## 🔒 Security Considerations

### Type Safety

- **End-to-end TypeScript** from database to UI
- **Zod validation** for all external data
- **Drizzle ORM** prevents SQL injection

### Data Validation

```typescript
// All external data validated with Zod schemas
const CisaKevApiResponse = z.object({
  vulnerabilities: z.array(CisaKevVulnerability),
});
```

### Error Handling

- **Graceful degradation** when data unavailable
- **Comprehensive logging** for debugging
- **Rate limiting** respect for external APIs

## 📊 Performance

### Frontend Optimizations

- **TanStack Query** for caching and deduplication
- **React Server Components** where appropriate
- **Optimistic updates** for dashboard modifications

### Backend Optimizations

- **Database indexing** on frequently queried fields
- **Batch processing** for data ingestion
- **Efficient SQL queries** with Drizzle ORM

### Monitoring

```bash
# Check performance
curl http://localhost:3000/api/health  # API health
pnpm db:studio                        # Database queries
# Browser DevTools for frontend performance
```

## 📝 Code Style

### TypeScript Guidelines

- Use **strict mode** TypeScript
- **Explicit types** for public APIs
- **Zod schemas** for runtime validation

### React Patterns

- **Functional components** with hooks
- **Custom hooks** for data fetching
- **Error boundaries** for component errors

### Database Patterns

- **Type-safe queries** with Drizzle
- **Batch operations** for performance
- **Proper indexing** for common queries

## 🚀 Deployment

### Development

```bash
pnpm dev  # Next.js development server
```

### Production Build

```bash
pnpm build  # Build optimized production bundle
pnpm start  # Start production server
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/db
NVD_API_KEY=optional_api_key
NODE_ENV=production
```

## 🤝 Contributing

### Pull Request Process

1. **Fork repository** and create feature branch
2. **Make changes** following code style guidelines
3. **Test thoroughly** (manual testing currently)
4. **Submit PR** with clear description

### Issue Reporting

Include:

- Environment details (OS, Node.js version)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs

### Feature Requests

- Check existing issues first
- Provide clear use case and benefits
- Consider implementation complexity

## 🔮 Future Development

### Planned Features

- **Automated testing** (unit, integration, E2E)
- **Authentication system** (JWT, RBAC)
- **Real-time updates** (WebSockets)
- **Enhanced visualizations** (interactive charts)

### Architecture Evolution

- **Microservices** for scaling
- **Caching layer** (Redis)
- **Message queues** for async processing
- **GraphQL** for flexible queries

## 📚 Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)

### External APIs

- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [NVD CVE API](https://nvd.nist.gov/developers)
- [MITRE ATT&CK](https://attack.mitre.org/)

---

**Questions?** Create an issue or check existing documentation for more details.
