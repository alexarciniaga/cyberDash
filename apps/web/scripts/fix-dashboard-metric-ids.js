/**
 * Dashboard MetricId Fix Script
 * 
 * This script fixes existing dashboards that have metricIds with underscores
 * instead of hyphens, which causes 404 errors when trying to fetch API data.
 */

const { db } = require('../lib/db/connection');
const { dashboards } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');

// Mapping of old underscore metricIds to new hyphen metricIds
const METRIC_ID_FIXES = {
    // CISA KEV
    'total_count': 'total-count',
    'top_vendor': 'top-vendor',
    'due_date_compliance': 'due-date-compliance',
    'vendor_breakdown': 'vendor-breakdown',
    'new_vulns_rate': 'new-vulns-rate',
    'product_distribution': 'product-distribution',

    // NVD CVE
    'critical_count': 'critical-count',
    'publication_trends': 'publication-trends',
    'severity_distribution': 'severity-distribution',
    'recent_high_severity': 'recent-high-severity',
    'vuln_status_summary': 'vuln-status-summary',

    // MITRE ATT&CK
    'technique_count': 'technique-count',
    'tactics_coverage': 'tactics-coverage',
    'platform_coverage': 'platform-coverage',
    'recent_updates': 'recent-updates',
    'top_techniques': 'top-techniques',
};

async function fixDashboardMetricIds() {
    try {
        console.log('🔧 Fixing dashboard metricIds...\n');

        // Get all dashboards
        const allDashboards = await db.select().from(dashboards);

        if (allDashboards.length === 0) {
            console.log('No dashboards found.');
            return;
        }

        let totalDashboards = 0;
        let fixedDashboards = 0;
        let totalWidgetsFixed = 0;

        for (const dashboard of allDashboards) {
            totalDashboards++;
            let widgetsFixed = 0;
            let dashboardNeedsFix = false;

            const updatedWidgets = (dashboard.widgets || []).map((widget) => {
                if (widget.metricId && METRIC_ID_FIXES[widget.metricId]) {
                    const oldMetricId = widget.metricId;
                    const newMetricId = METRIC_ID_FIXES[widget.metricId];

                    console.log(`  📝 Widget ${widget.id}: ${oldMetricId} → ${newMetricId}`);

                    widgetsFixed++;
                    dashboardNeedsFix = true;

                    return {
                        ...widget,
                        metricId: newMetricId,
                    };
                }
                return widget;
            });

            // Update dashboard if any widgets were fixed
            if (dashboardNeedsFix) {
                await db
                    .update(dashboards)
                    .set({
                        widgets: updatedWidgets,
                        updatedAt: new Date(),
                    })
                    .where(eq(dashboards.id, dashboard.id));

                fixedDashboards++;
                totalWidgetsFixed += widgetsFixed;

                console.log(`✅ Dashboard "${dashboard.name}": Fixed ${widgetsFixed} widget(s)`);
            } else {
                console.log(`✅ Dashboard "${dashboard.name}": No fixes needed`);
            }
        }

        console.log('\n📊 Fix Summary:');
        console.log(`Total dashboards: ${totalDashboards}`);
        console.log(`Dashboards fixed: ${fixedDashboards}`);
        console.log(`Total widgets fixed: ${totalWidgetsFixed}`);

        if (fixedDashboards > 0) {
            console.log('\n🎉 Dashboard metricIds have been fixed! API calls should now work properly.');
        } else {
            console.log('\n✨ All dashboards already have correct metricIds.');
        }

    } catch (error) {
        console.error('❌ Error fixing dashboard metricIds:', error);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    fixDashboardMetricIds()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixDashboardMetricIds };
