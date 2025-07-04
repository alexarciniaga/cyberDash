# User Guide

Complete guide to using CyberDash - understanding the dashboard, metrics, and cybersecurity data.

## 🎯 Dashboard Overview

CyberDash displays cybersecurity intelligence from three key sources:

- **CISA KEV** - Known Exploited Vulnerabilities (actively being exploited)
- **NVD CVE** - All published vulnerabilities with severity scores
- **MITRE ATT&CK** - Attack techniques and tactics used by threat actors

## 🖥️ Using the Dashboard

### Navigation Basics

- **Dashboard Selector** (top right) - Switch between multiple dashboards
- **Widget Grid** - Draggable and resizable widgets showing different metrics
- **Auto-refresh** - Data updates every 60 seconds automatically
- **Settings Page** - Access system configuration, data ingestion, and health monitoring

### Managing Dashboards

```
Create New Dashboard:
1. Click dashboard dropdown (top right)
2. Select "Create New Dashboard"
3. Customize with your preferred widgets
4. Changes save automatically
```

### Customizing Widgets

- **Drag to move** - Click and drag widgets to rearrange
- **Resize** - Drag corners to resize widgets
- **Auto-save** - Layout changes are saved automatically

### Widget Types

CyberDash supports 5 distinct widget types:

- **Metric Cards** - Single numbers with trend indicators and progress bars
- **Vendor Cards** - Specialized metric cards for top vendor/product information
- **Charts** - Time series and distribution visualizations (line and bar charts)
- **Tables** - Detailed data listings with sortable columns
- **Lists** - Ranked items and top N displays

## 📊 Complete Widget Library

### 🚨 CISA KEV Widgets (7 widgets)

#### Total CISA KEV Vulnerabilities (`cisa-kev-count`)
- **Type**: Metric Card | **Refresh**: 60s
- **Shows**: Current count of actively exploited vulnerabilities
- **Interpret**: Higher = more active threats in circulation
- **Action**: Use as baseline for threat awareness and patching priority

#### Top Vendor (`cisa-top-vendor`)
- **Type**: Vendor Card | **Refresh**: 30s  
- **Shows**: Vendor with most exploited vulnerabilities and count
- **Interpret**: Microsoft, Adobe, Apple often lead due to widespread use
- **Action**: Focus patching efforts on high-risk vendors

#### Vendor Leaderboard (`cisa-vendor-leaderboard`)
- **Type**: List | **Refresh**: 5min
- **Shows**: Top 10 vendors ranked by vulnerability count
- **Interpret**: Comprehensive view of vendor risk landscape
- **Action**: Use for vendor risk assessment and strategic planning

#### Due Date Compliance (`cisa-due-date-compliance`)
- **Type**: Metric Card | **Refresh**: 30s
- **Shows**: Percentage of vulnerabilities not approaching CISA due dates
- **Interpret**: Lower percentages = more urgent vulnerabilities need attention
- **Action**: Use CISA deadlines as guidance for your patching timeline

#### Vendor Breakdown Table (`cisa-vendor-breakdown`)
- **Type**: Table | **Refresh**: 5min
- **Shows**: Complete vendor vulnerability breakdown with detailed counts
- **Interpret**: Sortable view of all vendor vulnerabilities
- **Action**: Detailed analysis and prioritization by vendor

#### New Vulnerabilities Rate (`cisa-new-vulns-rate`)
- **Type**: Chart | **Refresh**: 60s
- **Shows**: Time series of new vulnerabilities added over time
- **Interpret**: Spikes = surge in new threats requiring immediate attention
- **Action**: High rates may indicate need for emergency patching procedures

#### Product Distribution (`cisa-product-distribution`)
- **Type**: Chart | **Refresh**: 5min
- **Shows**: Distribution of vulnerabilities by specific products
- **Interpret**: Identifies most vulnerable product categories
- **Action**: Focus patching on high-vulnerability products

### 🔒 NVD CVE Widgets (5 widgets)

#### Critical CVE Count (`nvd-cve-critical`)
- **Type**: Metric Card | **Refresh**: 30s
- **Shows**: Vulnerabilities with CVSS score ≥ 9.0 (highest severity)
- **Interpret**: Critical = requires immediate patching
- **Action**: Treat as highest priority for security teams

#### CVE Publication Trends (`nvd-publication-trends`)
- **Type**: Chart | **Refresh**: 60s
- **Shows**: New vulnerabilities published over time
- **Interpret**: Spikes may indicate major disclosure events
- **Action**: Plan security capacity around high-volume periods

#### Severity Distribution (`nvd-severity-distribution`)
- **Type**: Table | **Refresh**: 5min
- **Shows**: Complete breakdown by CVSS severity levels with statistics
- **Interpret**: Most vulnerabilities are Medium/High - this is normal
- **Action**: Allocate patching resources proportionally, focus on Critical/High first

#### Recent High Severity CVEs (`nvd-recent-high-severity`)
- **Type**: List | **Refresh**: 30s
- **Shows**: Latest Critical and High severity vulnerabilities with descriptions
- **Interpret**: Immediate threats requiring rapid response
- **Action**: Quick triage and emergency patching assessment

#### Vulnerability Status Summary (`nvd-vuln-status-summary`)
- **Type**: Table | **Refresh**: 60s
- **Shows**: CVE status distribution (Analyzed, Modified, Awaiting Analysis, etc.)
- **Interpret**: Processing state of vulnerability database
- **Action**: Understand data freshness and analysis completeness

### ⚔️ MITRE ATT&CK Widgets (5 widgets)

#### Total ATT&CK Techniques (`mitre-technique-count`)
- **Type**: Metric Card | **Refresh**: 1hr
- **Shows**: Number of known attack techniques in the framework
- **Interpret**: Growing numbers = expanding threat landscape complexity
- **Action**: Use for security control coverage assessment

#### MITRE Tactics Coverage (`mitre-tactics-coverage`)
- **Type**: Table | **Refresh**: 5min
- **Shows**: Attack techniques grouped by tactics (phases of attack)
- **Interpret**: Tactics with many techniques = areas where attackers have many options
- **Action**: Ensure security controls cover all tactics, especially high-technique ones

#### Platform Coverage (`mitre-platform-coverage`)
- **Type**: Table | **Refresh**: 5min
- **Shows**: Technique coverage across Windows, Linux, macOS, Cloud platforms
- **Interpret**: Windows typically highest due to enterprise prevalence
- **Action**: Focus on platforms actually used in your environment

#### Recent Framework Updates (`mitre-recent-updates`)
- **Type**: List | **Refresh**: 5min
- **Shows**: Latest MITRE ATT&CK technique updates and additions
- **Interpret**: New techniques = evolving attack landscape
- **Action**: Update security controls to address new techniques

#### Most Versatile Techniques (`mitre-top-techniques`)
- **Type**: List | **Refresh**: 5min
- **Shows**: Techniques spanning multiple tactics and platforms
- **Interpret**: High-impact techniques used across attack stages
- **Action**: Prioritize detection and prevention for versatile techniques

## ⚙️ Settings & System Management

### Accessing Settings

Navigate to `/settings` or click the settings icon to access:

- **System Health Monitoring**
- **Manual Data Ingestion**
- **Database Status**
- **Configuration Management**

### System Health Dashboard

**Real-time monitoring of:**
- Database connectivity status
- Schema readiness
- Table integrity checks
- Last health check timestamp

**Status indicators:**
- 🟢 **Healthy** - All systems operational
- 🟡 **Warning** - Minor issues detected
- 🔴 **Unhealthy** - Critical issues require attention

### Manual Data Ingestion

**Trigger fresh data loads:**

#### CISA KEV Ingestion
- **Source**: CISA Known Exploited Vulnerabilities Catalog
- **Frequency**: Updates when CISA releases new data
- **Shows**: Records processed, added, updated, catalog version

#### NVD CVE Ingestion  
- **Source**: NIST National Vulnerability Database
- **Frequency**: Continuous updates as CVEs are published
- **Shows**: Records processed, date range, processing duration

#### MITRE ATT&CK Ingestion
- **Source**: MITRE ATT&CK Framework
- **Frequency**: Framework updates (monthly/quarterly)
- **Shows**: Techniques and tactics processed, framework version

**Ingestion Status Tracking:**
- Real-time progress indicators
- Detailed results with record counts
- Error reporting and troubleshooting
- Processing duration metrics

## 📈 Interpreting Trends

### What to Watch For

#### Sudden Spikes

- **CISA KEV spikes** = Major exploitation campaigns
- **NVD CVE spikes** = Mass vulnerability discoveries
- **ATT&CK updates** = New attack techniques identified

#### Gradual Increases

- **Normal growth** in attack surface and threats
- **Plan security scaling** accordingly
- **Opportunity for proactive measures**

#### Correlations

- **High CISA KEV + High CVE** = Active threat period requiring heightened response
- **New techniques + CVE spikes** = Potential new attack campaigns

### Using Data for Decisions

#### Security Team Prioritization

1. **Start with CISA KEV** - these are actively exploited
2. **Add Critical CVEs** - highest severity new threats
3. **Consider ATT&CK popularity** - focus on common attack methods

#### Executive Reporting

- **CISA KEV totals** for immediate threat context
- **CVE trends** for ongoing risk management
- **ATT&CK coverage** for strategic planning

#### Budget Justification

- **Higher metrics** = stronger case for security investment
- **Trend analysis** = capacity planning for security teams
- **Vendor analysis** = risk assessment for technology choices

## 🎯 Best Practices

### Daily Monitoring

- Check dashboard each morning for overnight changes
- Focus on CISA KEV for immediate threats
- Monitor Critical CVE count for new high-severity issues

### Weekly Reviews

- Analyze trends and patterns
- Review vendor/product distributions
- Assess ATT&CK technique coverage

### Monthly Analysis

- Compare metrics month-over-month
- Identify seasonal patterns
- Plan security initiatives based on trends

## ⚠️ Important Limitations

### What Metrics Don't Show

- **Your specific risk** depends on your actual technology stack
- **Threat actors targeting your industry** may use different techniques
- **Internal threats** and misconfigurations aren't captured
- **Zero-day attacks** won't appear until publicly disclosed

### Context Matters

- **Volume isn't everything** - one critical vulnerability can be worse than many minor ones
- **Combine with other intelligence** - use additional threat feeds and internal data
- **Consider your environment** - interpret metrics within your specific risk context

## 🔄 Data Refresh

### Auto-refresh Behavior

- **Widgets update automatically** at configured intervals (30s - 1hr)
- **Data ingestion runs independently** (manual or scheduled)
- **"Last updated" timestamps** show data freshness

### Manual Data Loading

Access Settings page for manual ingestion triggers, or use API:

```bash
# Trigger fresh data ingestion
curl -X POST http://localhost:3000/api/ingestion/cisa-kev
curl -X POST http://localhost:3000/api/ingestion/nvd-cve
curl -X POST http://localhost:3000/api/ingestion/mitre-attack
```

## 🚀 Tips for Power Users

### Keyboard Shortcuts

- **Refresh page** - F5 or Ctrl+R for manual refresh
- **Browser zoom** - Ctrl +/- to adjust widget sizes
- **Full screen** - F11 for distraction-free monitoring

### Multiple Dashboards

- **Create focused dashboards** for different purposes (executive, analyst, operations)
- **Use descriptive names** to quickly identify dashboard purpose
- **Share configurations** by copying dashboard JSON

### API Access

```bash
# Direct API access for automation
curl http://localhost:3000/api/metrics/cisa/total-count
curl http://localhost:3000/api/dashboards
curl http://localhost:3000/api/health
```

---

**Remember**: CyberDash provides situational awareness, but combine it with threat intelligence specific to your industry and environment for informed security decisions.

# Data Ingestion

CyberDash supports ingesting security data from three major sources:

## 🎯 Supported Data Sources

### 1. CISA Known Exploited Vulnerabilities (KEV)

- **Source**: CISA KEV Catalog
- **Endpoint**: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- **Update Frequency**: Daily
- **Data**: Known exploited vulnerabilities with due dates

### 2. NVD CVE Database

- **Source**: NIST National Vulnerability Database
- **Endpoint**: `https://services.nvd.nist.gov/rest/json/cves/2.0/`
- **Rate Limit**: 5 requests per 30 seconds (without API key)
- **Data**: Complete CVE details with CVSS scores

### 3. MITRE ATT&CK Framework

- **Source**: MITRE ATT&CK STIX Data
- **Endpoint**: `https://api.github.com/repos/mitre-attack/attack-stix-data/releases/latest`
- **Update Frequency**: When new releases are published
- **Data**: Tactics, techniques, and procedures (TTPs)

## 🚀 **Fixed Commands (Updated)**

All data ingestion endpoints have been updated with the correct API parameters:

```bash
# ✅ CISA Known Exploited Vulnerabilities
curl -X POST http://localhost:3000/api/ingestion/cisa-kev

# ✅ NVD CVE Database (Fixed API 2.0 parameters)
curl -X POST http://localhost:3000/api/ingestion/nvd-cve

# ✅ MITRE ATT&CK Framework (Fixed GitHub access)
curl -X POST http://localhost:3000/api/ingestion/mitre-attack
```

## 🔧 **What Was Fixed**

### 1. **NVD CVE API Issue**

- **Problem**: NVD API 2.0 requires both `lastModStartDate` AND `lastModEndDate` parameters
- **Solution**: Updated to provide both start and end dates for proper filtering
- **Status**: ✅ **Fixed and working**

### 2. **MITRE ATT&CK API Issue**

- **Problem**: Enterprise ATT&CK JSON file not found in GitHub release assets
- **Solution**: Added fallback to download directly from repository when asset not found
- **Status**: ✅ **Fixed and working**

### 3. **CISA KEV API**

- **Status**: ✅ **Already working correctly**

## 🔧 Running Data Ingestion

### Using cURL Commands

```bash
# Make sure your development server is running
cd cyberDash/apps/web
npm run dev

# In a new terminal, run ingestion commands:

# 1. CISA KEV Data (typically 2-5 minutes)
curl -X POST http://localhost:3000/api/ingestion/cisa-kev

# 2. NVD CVE Data (may take 15-30 minutes for initial run)
curl -X POST http://localhost:3000/api/ingestion/nvd-cve

# 3. MITRE ATT&CK Data (typically 1-2 minutes)
curl -X POST http://localhost:3000/api/ingestion/mitre-attack
```

### Using the Web Interface

1. Navigate to the Admin Dashboard (if available)
2. Go to Data Management → Ingestion
3. Click "Run Ingestion" for each data source

### Checking Ingestion Status

```bash
# Check ingestion logs
curl http://localhost:3000/api/ingestion/status

# Check specific source status
curl http://localhost:3000/api/ingestion/cisa-kev
curl http://localhost:3000/api/ingestion/nvd-cve
curl http://localhost:3000/api/ingestion/mitre-attack
```

## ⏱️ Expected Duration & Data Volume

| Source           | Initial Run   | Incremental | Records   |
| ---------------- | ------------- | ----------- | --------- |
| **CISA KEV**     | 2-5 minutes   | 30 seconds  | ~1,200    |
| **NVD CVE**      | 15-30 minutes | 2-5 minutes | ~250,000+ |
| **MITRE ATT&CK** | 1-2 minutes   | 30 seconds  | ~800      |

## 🚦 Rate Limiting & Best Practices

### NVD API Rate Limits

- **Without API Key**: 5 requests per 30 seconds
- **With API Key**: 50 requests per 30 seconds
- CyberDash automatically handles rate limiting

### Recommended Schedule

```bash
# Daily ingestion (recommended cron schedule)
0 2 * * * curl -X POST http://localhost:3000/api/ingestion/cisa-kev
0 3 * * * curl -X POST http://localhost:3000/api/ingestion/nvd-cve
0 4 * * * curl -X POST http://localhost:3000/api/ingestion/mitre-attack
```

## 🔍 Monitoring & Troubleshooting

### View Ingestion Logs

```bash
# Database logs (if using a database viewer)
SELECT * FROM data_ingestion_log ORDER BY started_at DESC LIMIT 10;

# Application logs
docker logs cyberdash-web -f
```

### Common Issues

- **Rate Limiting**: NVD may return 403 errors if rate limits exceeded
- **Network Timeouts**: Large CVE datasets may cause timeouts on slower connections
- **Memory Usage**: Initial NVD ingestion can use significant memory

### Success Indicators

- HTTP 200 response with JSON containing `success: true`
- Records processed count matches expected data volume
- Updated timestamps in ingestion state
