import { db } from './lib/db/connection.ts';
import { sql } from 'drizzle-orm';

async function checkMitreData() {
    try {
        console.log('Checking MITRE data in database...');

        // Check technique count
        const techCount = await db.execute(sql`SELECT COUNT(*) as count FROM mitre_attack_techniques WHERE is_revoked = false AND is_deprecated = false`);
        console.log('Active techniques:', techCount[0]?.count);

        // Check tactics count
        const tacticsCount = await db.execute(sql`SELECT COUNT(*) as count FROM mitre_attack_tactics`);
        console.log('Tactics count:', tacticsCount[0]?.count);

        // Test sample data
        const sampleTech = await db.execute(sql`SELECT technique_id, name, tactics, platforms FROM mitre_attack_techniques LIMIT 3`);
        console.log('Sample techniques:', JSON.stringify(sampleTech, null, 2));

        // Test tactics coverage query (what the widget actually uses)
        const tacticsQuery = await db.execute(sql`
      SELECT 
        t.name,
        t.short_name,
        COUNT(tech.id) as technique_count
      FROM mitre_attack_tactics t
      LEFT JOIN mitre_attack_techniques tech ON 
        tech.tactics @> to_jsonb(ARRAY[t.short_name])
        AND tech.is_revoked = false 
        AND tech.is_deprecated = false
      GROUP BY t.tactic_id, t.name, t.short_name
      ORDER BY technique_count DESC
      LIMIT 5
    `);
        console.log('Tactics coverage query result:', JSON.stringify(tacticsQuery, null, 2));

        // Test platform coverage
        const platformQuery = await db.execute(sql`
      SELECT 
        jsonb_array_elements_text(platforms) as platform,
        COUNT(*) as value
      FROM mitre_attack_techniques 
      WHERE is_revoked = false 
        AND is_deprecated = false 
        AND platforms IS NOT NULL
      GROUP BY jsonb_array_elements_text(platforms)
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `);
        console.log('Platform coverage query result:', JSON.stringify(platformQuery, null, 2));

        // Check API endpoints availability 
        console.log('\nTesting API endpoints...');
        const testUrls = [
            'http://localhost:3000/api/metrics/mitre/technique-count',
            'http://localhost:3000/api/metrics/mitre/tactics-coverage',
            'http://localhost:3000/api/metrics/mitre/platform-coverage'
        ];

        for (const url of testUrls) {
            try {
                const response = await fetch(url);
                const data = await response.json();
                console.log(`${url}:`, response.status, data.success ? 'SUCCESS' : 'FAILED');
                if (!data.success) {
                    console.log('  Error:', data.error);
                } else {
                    console.log('  Data:', JSON.stringify(data.data, null, 2));
                }
            } catch (error) {
                console.log(`${url}: FETCH ERROR -`, error.message);
            }
        }

    } catch (error) {
        console.error('Database Error:', error);
    }
    process.exit(0);
}

checkMitreData(); 