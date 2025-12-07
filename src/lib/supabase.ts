import { createClient } from '@supabase/supabase-js';

// 確保環境變數存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 使用 Service Role Key 進行後端操作

if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === 'production' || (typeof window === 'undefined' && process.env.NODE_ENV !== 'test')) {
    console.warn('Missing Supabase environment variables');
  }
}

// 建立 Supabase 客戶端
// 注意：在後端 API Route 中使用 Service Role Key 可以繞過 RLS，
// 這對於爬蟲寫入資料是必要的。
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);
