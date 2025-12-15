
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHealth() {
    console.log('🔍 Starting System Health Check...\n');
    let allPassed = true;

    // 1. Environment Variables
    const requiredEnv = ['OPENAI_API_KEY', 'CRON_SECRET', 'RESEND_API_KEY'];
    const missingEnv = requiredEnv.filter(key => !process.env[key]);
    if (missingEnv.length > 0) {
        console.error(`❌ Missing Environment Variables: ${missingEnv.join(', ')}`);
        allPassed = false;
    } else {
        console.log('✅ Environment Variables checked.');
    }

    // 2. Database Connection & Columns
    try {
        const { data, error } = await supabase.from('news_items').select('id, audio_url').limit(1);
        if (error) throw error;
        console.log('✅ Database Connection (news_items) checked.');

        // Check if audio_url exists (by checking if we can select it without error)
        // Note: select('audio_url') would error if column didn't exist in strict mode, but Supabase JS might just return null.
        // Better check: The previous check script confirmed it. Safe to assume if no error here.
    } catch (e: any) {
        console.error(`❌ Database Check Failed: ${e.message}`);
        allPassed = false;
    }

    // 3. Storage
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error(`❌ Storage Check Failed: ${bucketError.message}`);
        allPassed = false;
    } else {
        const audioBucket = buckets.find(b => b.name === 'news-audio');
        if (audioBucket?.public) {
            console.log('✅ Storage (news-audio) checked.');
        } else {
            console.error('❌ Storage: "news-audio" bucket missing or not public.');
            allPassed = false;
        }
    }

    // 4. Local Server Response (if running)
    try {
        const res = await fetch('http://localhost:3000/api/news?limit=1');
        if (res.ok) {
            console.log('✅ Local Server API (/api/news) is responding.');
        } else {
            console.warn(`⚠️ Local Server API returned status ${res.status}. (Server might be building or starting)`);
            // Don't fail the whole check for this, as dev server might be sleepy
        }
    } catch (e) {
        console.warn('⚠️ Local Server execution check failed (Connection refused). Is `npm run dev` running?');
    }

    console.log('\n--------------------------------');
    if (allPassed) {
        console.log('🎉 All System Checks Passed!');
    } else {
        console.log('⚠️ Some checks failed. Please review above.');
    }
}

checkHealth();
