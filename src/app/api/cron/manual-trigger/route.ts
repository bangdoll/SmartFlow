import { NextRequest, NextResponse } from 'next/server';
import { runScrapeSortAndSummary } from '@/lib/scrape-workflow';
import { supabase } from '@/lib/supabase';

// Simple rate limit: 1 request per minute per IP (conceptually)
// Since we are serverless, we'll check the logs table or latest run timestamp.
// For now, let's just use a simple DB check to see when the last scrape happened.

export const maxDuration = 60; // Allow 60 seconds

export async function POST(req: NextRequest) {
    try {
        // 1. Rate Limiting Check
        // Check standard log table to see if a manual run happened recently
        // Or simply check the latest news item created_at
        const { data: latestNews } = await supabase
            .from('news_items')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latestNews) {
            const lastRunTime = new Date(latestNews.created_at).getTime();
            const now = Date.now();
            const diffInMinutes = (now - lastRunTime) / 1000 / 60;

            // If last news was created < 5 minutes ago, skip scraping to prevent spamming APIs
            if (diffInMinutes < 5) {
                return NextResponse.json({
                    success: false,
                    message: 'Recently updated. Please try again later.'
                });
            }
        }

        console.log('--- Starting Manual Scraper Trigger ---');

        // 2. Run Scraper (Only Scrape & Summary, NO Email)
        const scrapeResult = await runScrapeSortAndSummary();
        console.log('Manual scrape result:', scrapeResult);

        return NextResponse.json({
            success: true,
            data: scrapeResult,
            message: 'Scraping completed successfully'
        });

    } catch (error: any) {
        console.error('Manual trigger failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
