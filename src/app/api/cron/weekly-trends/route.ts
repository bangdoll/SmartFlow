import { NextResponse } from 'next/server';
import { generateWeeklyTrends } from '@/lib/trends-generator';
import { supabase } from '@/lib/supabase';

// Helper to get the Monday of the current week (or last Monday)
function getMonday(d: Date) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

export async function GET() {
    try {
        console.log('Starting Weekly Trends Generation...');

        // 1. Generate Content
        const trendsData = await generateWeeklyTrends();

        if (!trendsData) {
            return NextResponse.json({ error: 'Failed to generate trends data (no data or LLM error)' }, { status: 500 });
        }

        // 2. Determine Week Start Date (Today or nearest Monday)
        const today = new Date();
        const weekStartDate = getMonday(today).toISOString().split('T')[0]; // YYYY-MM-DD

        // 3. Save to DB
        const { error } = await supabase
            .from('weekly_trends')
            .upsert({
                week_start_date: weekStartDate,
                title: trendsData.title,
                core_message: trendsData.core_message,
                trends: trendsData.trends,
                persona_advice: trendsData.persona_advice,
                created_at: new Date().toISOString()
            }, { onConflict: 'week_start_date' });

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: 'Database insertion failed', details: error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Weekly trends generated and saved.',
            data: trendsData
        });

    } catch (error) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
