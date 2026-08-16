import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const ClickSchema = z.object({ id: z.string().uuid() });

export async function POST(request: Request) {
    try {
        const parsed = ClickSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
        }

        const { error } = await supabase.rpc('increment_news_click', { news_id: parsed.data.id });
        if (error) throw error;

        return NextResponse.json({ success: true });


    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
