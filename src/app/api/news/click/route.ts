import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
        }

        // Click tracking temporarily disabled due to missing click_count column in DB
        /*
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
        */

        return NextResponse.json({ success: true });


    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
