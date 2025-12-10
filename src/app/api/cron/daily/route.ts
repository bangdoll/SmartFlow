import { NextRequest, NextResponse } from 'next/server';
import { runScrapeSortAndSummary } from '@/lib/scrape-workflow';
import { sendDailyNewsletter } from '@/lib/newsletter';

// 設定最大執行時間 (Vercel Hobby 10s/60s，合併後更需注意)
// 爬蟲限制了處理數量，電子報應該也很快
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    // 驗證 Cron Secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV !== 'development') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('--- Starting Daily Job ---');

        // 1. 執行爬蟲與摘要
        // 使用 Promise.all 可能並行較快，但為了邏輯順序（先有新聞再發信），依序執行較安全
        // 且並行容易撞到 Vercel/DB 資源限制
        const scrapeResult = await runScrapeSortAndSummary();
        console.log('Scrape result:', scrapeResult);

        // 2. 執行電子報發送
        const newsletterResult = await sendDailyNewsletter();
        console.log('Newsletter result:', newsletterResult);

        return NextResponse.json({
            success: true,
            scrape: scrapeResult,
            newsletter: newsletterResult
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Daily job failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
