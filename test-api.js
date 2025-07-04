const fetch = require('node-fetch');

async function testAPI() {
    const baseUrl = 'http://localhost:3000/api';

    const endpoints = [
        '/metrics/cisa/total-count',
        '/metrics/cisa/vendor-breakdown',
        '/metrics/nvd/critical-count',
        '/metrics/mitre/technique-count',
        '/health'
    ];

    console.log('Testing API endpoints...\n');

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await fetch(`${baseUrl}${endpoint}`);
            const data = await response.json();

            console.log(`Status: ${response.status}`);
            console.log(`Response:`, JSON.stringify(data, null, 2));
            console.log('---\n');
        } catch (error) {
            console.error(`Error testing ${endpoint}:`, error.message);
            console.log('---\n');
        }
    }
}

testAPI().catch(console.error);
