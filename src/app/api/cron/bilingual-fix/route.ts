import { NextRequest, NextResponse } from 'next/server';
import { autoFixNewsContent } from '@/lib/auto-fix-service';

/**
 * 雙語內容修復 Cron Job
 * 每日三次執行（台灣時間 00:00, 08:00, 16:00）
 * 
 * 功能：
 * 1. 檢查所有中文版頁面，將英文標題/摘要修正為中文
 * 2. 檢查所有英文版頁面，將中文標題/摘要修正為英文
 */
// 優化版：每次只處理少量項目，確保在 30 秒內完成
// cron-job.org 免費方案 timeout 是 30 秒
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
        const startTime = Date.now();
        console.log('--- Starting Bilingual Fix Cron Job ---');
        console.log(`Taiwan Time: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);

        // 優化：每次只處理 5 則，7 天內，確保 30 秒內完成
        // cron job 會定期執行，最終會處理完所有項目
        const fixResult = await autoFixNewsContent(7, 5);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Bilingual Fix Cron] Completed in ${duration}s`);
        console.log(`[Bilingual Fix Cron] Fixed: ${fixResult.chinese} Chinese, ${fixResult.english} English`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            taiwanTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
            durationSeconds: parseFloat(duration),
            fixed: {
                chinese: fixResult.chinese,
                english: fixResult.english,
                total: fixResult.chinese + fixResult.english
            }
        });

    } catch (error: unknown) {
        console.error('Bilingual fix cron job failed:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
