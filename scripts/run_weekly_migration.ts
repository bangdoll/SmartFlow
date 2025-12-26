/**
 * Script to run database migration for weekly_trends i18n support
 * 
 * Usage: npx ts-node scripts/run_weekly_migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration(): Promise<void> {
    console.log('🔄 Adding English columns to weekly_trends table...\n');

    // Use raw SQL query via rpc or pg_query
    // Note: This requires the columns to not already exist
    const queries = [
        `ALTER TABLE weekly_trends ADD COLUMN IF NOT EXISTS title_en text`,
        `ALTER TABLE weekly_trends ADD COLUMN IF NOT EXISTS core_message_en text`,
        `ALTER TABLE weekly_trends ADD COLUMN IF NOT EXISTS persona_advice_en jsonb`,
    ];

    for (const sql of queries) {
        console.log(`Executing: ${sql.substring(0, 60)}...`);

        const { error } = await supabase.rpc('execute_sql', { sql_query: sql });

        if (error) {
            // Try alternative - direct fetch to REST API
            console.log(`   ⚠ RPC failed, column may already exist or need manual migration`);
            console.log(`   Error: ${error.message}`);
        } else {
            console.log(`   ✅ Success`);
        }
    }

    console.log('\n⚠️  If columns were not added, please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log(`ALTER TABLE weekly_trends 
ADD COLUMN IF NOT EXISTS title_en text,
ADD COLUMN IF NOT EXISTS core_message_en text,
ADD COLUMN IF NOT EXISTS persona_advice_en jsonb;`);
}

runMigration().catch(console.error);
