import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 刪除所有新聞
        const { error } = await supabase
            .from('news_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'All news items cleared.' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
