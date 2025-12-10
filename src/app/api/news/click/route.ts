import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
        }

        // 使用 rpc (Remote Procedure Call) 或直接 update
        // 由於 Supabase 不直接支援 atomic increment 除非寫 function
        // 這裡我們先用簡單的讀取後更新，雖然有 race condition 風險，但在這個規模可以接受
        // 或者如果使用者有建立 increment function 更好，但我們用 SQL 直接 update 比較簡單：

        // 其實可以直接 update:
        /*
        UPDATE news_items 
        SET click_count = click_count + 1 
        WHERE id = 'uuid'
        */

        // 但 supabase-js 沒辦法直接寫 raw sql update increment 除非用 rpc
        // 我們先用 RPC 方式 (如果使用者沒建 function 會失敗)
        // 替代方案：查詢 -> 加 1 -> 更新 (簡單但不完美)

        const { data: item, error: fetchError } = await supabase
            .from('news_items')
            .select('click_count')
            .eq('id', id)
            .single();

        if (fetchError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const newCount = (item.click_count || 0) + 1;

        const { error: updateError } = await supabase
            .from('news_items')
            .update({ click_count: newCount })
            .eq('id', id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, count: newCount });
    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
