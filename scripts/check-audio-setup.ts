import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSetup() {
    console.log('Checking setup...');

    // 1. Check DB Column
    const { data, error: dbError } = await supabase
        .from('news_items')
        .select('audio_url')
        .limit(1);

    if (dbError) {
        console.error('❌ 資料庫檢查失敗:', dbError.message);
    } else {
        console.log('✅ 資料庫檢查通過: "audio_url" 欄位已存在。');
        // console.log('Sample:', data);
    }

    // 2. Check Storage Bucket
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

    if (bucketError) {
        console.error('❌ 儲存空間檢查失敗:', bucketError.message);
    } else {
        const audioBucket = buckets?.find(b => b.name === 'news-audio');
        if (audioBucket) {
            console.log('✅ 儲存空間檢查通過: 找到 "news-audio" 儲存桶。');
            console.log('   公開狀態 (Public):', audioBucket.public);
        } else {
            console.error('❌ 儲存空間檢查失敗: 未找到 "news-audio" 儲存桶。');
            console.log('   目前的儲存桶:', buckets?.map(b => b.name));
        }
    }
}

checkSetup();
