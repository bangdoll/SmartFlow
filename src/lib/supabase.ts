import { createClient } from '@supabase/supabase-js';

// 確保環境變數存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 使用 Service Role Key 進行後端操作

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.');
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// 建立 Supabase 客戶端
// 注意：在後端 API Route 中使用 Service Role Key 可以繞過 RLS，
// 這對於爬蟲寫入資料是必要的。
export const supabase = createClient(supabaseUrl, supabaseKey);
