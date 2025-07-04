#!/usr/bin/env node

import { db } from '../lib/db/connection.js';
import { cisaKev } from '../lib/db/schema.js';
import { sql } from 'drizzle-orm';

async function testDatabase() {
    try {
        console.log('🔍 Testing database connection...');

        // Test basic connection
        const result = await db.execute(sql`SELECT NOW() as current_time`);
        console.log('✅ Database connected successfully');
        console.log('📅 Current time:', result[0].current_time);

        // Check if we have vulnerability data
        console.log('\n🔍 Checking vulnerability data...');
        const count = await db.select({ count: sql`count(*)` }).from(cisaKev);
        const totalVulns = Number(count[0]?.count || 0);

        console.log(`📊 Total vulnerabilities in database: ${totalVulns}`);

        if (totalVulns === 0) {
            console.log('⚠️  No vulnerability data found');
            console.log('💡 Run: POST http://localhost:3000/api/ingestion/cisa-kev to populate data');
            return;
        }

        // Get sample data
        const sample = await db.select({
            cveID: cisaKev.cveID,
            vendorProject: cisaKev.vendorProject,
            product: cisaKev.product,
            dateAdded: cisaKev.dateAdded
        }).from(cisaKev).limit(5);

        console.log('\n📄 Sample vulnerability data:');
        sample.forEach((vuln, i) => {
            console.log(`  ${i + 1}. ${vuln.cveID} - ${vuln.vendorProject} ${vuln.product} (${vuln.dateAdded?.toDateString()})`);
        });

        // Check date range
        const dateRange = await db.execute(sql`
      SELECT 
        MIN(date_added) as earliest,
        MAX(date_added) as latest
      FROM cisa_kev
    `);

        console.log('\n📅 Date range:');
        console.log(`  Earliest: ${dateRange[0]?.earliest?.toDateString()}`);
        console.log(`  Latest: ${dateRange[0]?.latest?.toDateString()}`);

        console.log('\n✅ Database test completed successfully!');

    } catch (error) {
        console.error('❌ Database test failed:', error);
        process.exit(1);
    }
}

// Handle ES module top-level await
if (import.meta.url === `file://${process.argv[1]}`) {
    testDatabase().then(() => process.exit(0));
}

export { testDatabase }; 