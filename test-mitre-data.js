const { db } = require('./apps/web/lib/db/connection.ts');
const { sql } = require('drizzle-orm');

async function testQueries() {
    try {
        console.log('Testing MITRE data existence...');

        // Check if MITRE data exists
        const mitreCount = await db.execute(sql`SELECT COUNT(*) as count FROM mitre_attack_techniques`);
        console.log('MITRE techniques count:', mitreCount[0]?.count);

        // Check sample data
        const sampleTechniques = await db.execute(sql`SELECT technique_id, name, tactics, platforms FROM mitre_attack_techniques LIMIT 3`);
        console.log('Sample techniques:', JSON.stringify(sampleTechniques, null, 2));

        // Test the tactics query
        const tacticsQuery = await db.execute(sql`
      SELECT jsonb_array_elements_text(tactics) as label, COUNT(*) as value
      FROM mitre_attack_techniques 
      WHERE is_revoked = false AND is_deprecated = false AND tactics IS NOT NULL
      GROUP BY jsonb_array_elements_text(tactics)
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `);
        console.log('Tactics query result:', JSON.stringify(tacticsQuery, null, 2));

    } catch (error) {
        console.error('Database test error:', error);
    }
    process.exit(0);
}

testQueries();
