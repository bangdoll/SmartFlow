import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hasMaintenanceAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
    if (!hasMaintenanceAuth(request)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 刪除所有新聞
        const { error } = await supabase
            .from('news_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'All news items cleared.' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
