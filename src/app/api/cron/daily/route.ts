import { NextRequest, NextResponse } from 'next/server';
import { runScrapeSortAndSummary } from '@/lib/scrape-workflow';
import { sendDailyNewsletter } from '@/lib/newsletter';
import { generateWeeklyTrends, saveWeeklyTrendsToDb } from '@/lib/trends-generator';
import { translatePendingItems } from '@/lib/translation-service';
import { autoFixNewsContent } from '@/lib/auto-fix-service';

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
        const scrapeResult = await runScrapeSortAndSummary();
        console.log('Scrape result:', scrapeResult);

        // 2. 執行電子報發送
        const newsletterResult = await sendDailyNewsletter();
        console.log('Newsletter result:', newsletterResult);

        // 3. 執行中翻英 (Pre-translation)
        // 這會確保用戶打開網站時，最新的新聞已經有英文版，無需等待
        const translatedCount = await translatePendingItems(20);
        console.log('Translated Pending Items:', translatedCount);

        // 4. 自動修復缺少中文/英文內容的新聞（雙向檢查）
        // 檢查過去 7 天的新聞，每次最多修復 20 則
        const fixResult = await autoFixNewsContent(7, 20);
        console.log(`Auto-fixed news items: ${fixResult.chinese} Chinese, ${fixResult.english} English`);

        // 5. (每周一) 執行週報趨勢分析
        // 使用台灣時區判斷星期幾（UTC+8）
        // 因為 Cron 在 UTC 00:00 執行，此時台灣是 08:00
        const taiwanTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
        const taiwanDate = new Date(taiwanTime);
        const dayOfWeek = taiwanDate.getDay(); // 0=Sunday, 1=Monday, ...

        let weeklyTrendsResult = null;

        if (dayOfWeek === 1) {
            console.log('Monday detected (Taiwan time)! Running Weekly Trends Analysis...');
            const trendsData = await generateWeeklyTrends();
            if (trendsData) {
                await saveWeeklyTrendsToDb(trendsData);
                weeklyTrendsResult = { status: 'success', title: trendsData.title };
                console.log('Weekly Trends Saved:', trendsData.title);
            } else {
                weeklyTrendsResult = { status: 'failed', reason: 'No data from generateWeeklyTrends' };
                console.warn('Weekly trends generation returned null');
            }
        } else {
            console.log(`Today is not Monday (Taiwan time). Day of week: ${dayOfWeek}`);
        }

        return NextResponse.json({
            success: true,
            scrape: scrapeResult,
            newsletter: newsletterResult,
            translated: translatedCount,
            autoFixed: fixResult,
            weeklyTrends: weeklyTrendsResult
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Daily job failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

