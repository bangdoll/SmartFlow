import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'latest'; // 'latest' | 'popular'

    try {
        let query = supabase
            .from('news_items')
            .select('*');

        // 排序邏輯
        if (sort === 'popular') {
            // 先按點擊數降序，再按發布時間降序
            query = query.order('click_count', { ascending: false }).order('published_at', { ascending: false });
        } else {
            // 默認按發布時間降序
            query = query.order('published_at', { ascending: false });
        }

        // 分頁
        query = query.range(offset, offset + limit - 1);

        if (tag) {
            // 注意：Supabase 的 array 欄位過濾
            // contains 檢查 array 是否包含特定值
            query = query.contains('tags', [tag]);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching news:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
