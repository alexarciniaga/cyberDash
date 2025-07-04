/**
 * Widget-API Compatibility Verification Script
 * 
 * This script verifies that all widgets in the widget library:
 * 1. Have corresponding API endpoints that exist
 * 2. Receive data in formats their widget types can handle
 * 3. Use correct data source and metric ID combinations
 */

const fs = require('fs');
const path = require('path');

// Widget library configuration from the actual file
const WIDGET_LIBRARY = {
    "CISA KEV": [
        {
            id: "cisa-kev-count",
            type: "metric_card",
            dataSource: "cisa",
            metricId: "total-count",
        },
        {
            id: "cisa-top-vendor",
            type: "metric_card",
            dataSource: "cisa",
            metricId: "top-vendor",
        },
        {
            id: "cisa-due-date-compliance",
            type: "metric_card",
            dataSource: "cisa",
            metricId: "due-date-compliance",
        },
        {
            id: "cisa-vendor-breakdown",
            type: "table",
            dataSource: "cisa",
            metricId: "vendor-breakdown",
        },
        {
            id: "cisa-new-vulns-rate",
            type: "chart",
            dataSource: "cisa",
            metricId: "new-vulns-rate",
        },
        {
            id: "cisa-product-distribution",
            type: "list",
            dataSource: "cisa",
            metricId: "product-distribution",
        },
    ],
    "NVD CVE": [
        {
            id: "nvd-critical-count",
            type: "metric_card",
            dataSource: "nvd",
            metricId: "critical-count",
        },
        {
            id: "nvd-publication-trends",
            type: "chart",
            dataSource: "nvd",
            metricId: "publication-trends",
        },
        {
            id: "nvd-severity-distribution",
            type: "table",
            dataSource: "nvd",
            metricId: "severity-distribution",
        },
        {
            id: "nvd-recent-high-severity",
            type: "list",
            dataSource: "nvd",
            metricId: "recent-high-severity",
        },
        {
            id: "nvd-vuln-status-summary",
            type: "chart",
            dataSource: "nvd",
            metricId: "vuln-status-summary",
        },
    ],
    "MITRE ATT&CK": [
        {
            id: "mitre-technique-count",
            type: "metric_card",
            dataSource: "mitre",
            metricId: "technique-count",
        },
        {
            id: "mitre-tactics-coverage",
            type: "table",
            dataSource: "mitre",
            metricId: "tactics-coverage",
        },
        {
            id: "mitre-platform-coverage",
            type: "table",
            dataSource: "mitre",
            metricId: "platform-coverage",
        },
        {
            id: "mitre-recent-updates",
            type: "list",
            dataSource: "mitre",
            metricId: "recent-updates",
        },
        {
            id: "mitre-top-techniques",
            type: "list",
            dataSource: "mitre",
            metricId: "top-techniques",
        },
    ],
};

// Expected data formats for each widget type
const WIDGET_TYPE_EXPECTATIONS = {
    metric_card: ['counter', 'gauge'],
    chart: ['timeseries'],
    table: ['table', 'distribution'],  // Table can handle both
    list: ['list', 'distribution'],    // List can now handle both
};

// Function to check if API endpoint exists
function checkEndpointExists(dataSource, metricId) {
    const endpointPath = path.join(__dirname, '..', 'app', 'api', 'metrics', dataSource, metricId.replace(/_/g, '-'), 'route.ts');
    return fs.existsSync(endpointPath);
}

// Function to extract expected data type from API endpoint
function getEndpointDataType(dataSource, metricId) {
    const endpointPath = path.join(__dirname, '..', 'app', 'api', 'metrics', dataSource, metricId.replace(/_/g, '-'), 'route.ts');

    if (!fs.existsSync(endpointPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(endpointPath, 'utf8');

        // Look for type declaration in the response
        const typeMatch = content.match(/type:\s*["']([^"']+)["']/);
        if (typeMatch) {
            return typeMatch[1];
        }

        return 'unknown';
    } catch (error) {
        return 'error';
    }
}

// Main verification function
function verifyWidgetLibrary() {
    console.log('🔍 Verifying Widget Library Compatibility...\n');

    let totalWidgets = 0;
    let compatibleWidgets = 0;
    let errors = [];

    Object.entries(WIDGET_LIBRARY).forEach(([category, widgets]) => {
        console.log(`📂 ${category}:`);

        widgets.forEach(widget => {
            totalWidgets++;
            const endpoint = `${widget.dataSource}/${widget.metricId.replace(/_/g, '-')}`;

            // Check if endpoint exists
            const exists = checkEndpointExists(widget.dataSource, widget.metricId);
            if (!exists) {
                errors.push(`❌ ${widget.id}: API endpoint missing - /api/metrics/${endpoint}`);
                console.log(`  ❌ ${widget.id}: Missing endpoint`);
                return;
            }

            // Check data type compatibility
            const apiDataType = getEndpointDataType(widget.dataSource, widget.metricId);
            const expectedTypes = WIDGET_TYPE_EXPECTATIONS[widget.type];

            if (apiDataType && !expectedTypes.includes(apiDataType)) {
                errors.push(`⚠️  ${widget.id}: Data type mismatch - Widget expects ${expectedTypes.join(' or ')}, API returns ${apiDataType}`);
                console.log(`  ⚠️  ${widget.id}: Type mismatch (${apiDataType} -> ${widget.type})`);
            } else {
                compatibleWidgets++;
                console.log(`  ✅ ${widget.id}: Compatible (${apiDataType} -> ${widget.type})`);
            }
        });

        console.log('');
    });

    // Summary
    console.log('📊 Verification Summary:');
    console.log(`Total widgets: ${totalWidgets}`);
    console.log(`Compatible: ${compatibleWidgets}`);
    console.log(`Issues: ${totalWidgets - compatibleWidgets}`);

    if (errors.length > 0) {
        console.log('\n🚨 Issues Found:');
        errors.forEach(error => console.log(`  ${error}`));
        process.exit(1);
    } else {
        console.log('\n🎉 All widgets are compatible with their API endpoints!');
        process.exit(0);
    }
}

// Run verification
if (require.main === module) {
    verifyWidgetLibrary();
}

module.exports = { verifyWidgetLibrary };
