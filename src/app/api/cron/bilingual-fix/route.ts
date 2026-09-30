import { NextRequest, NextResponse } from 'next/server';
import { autoFixNewsContent } from '@/lib/auto-fix-service';
import { hasMaintenanceAuth } from '@/lib/api-auth';

/**
 * 雙語內容修復 Cron Job
 * 由外部排程定期執行，未完成的項目留待下次處理
 * 
 * 功能：
 * 1. 檢查所有中文版頁面，將英文標題/摘要修正為中文
 * 2. 檢查所有英文版頁面，將中文標題/摘要修正為英文
 */
// cron-job.org waits at most 30s; leave 5s for startup and the HTTP response.
// maxDuration alone does not limit work or extend the scheduler's timeout.
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    if (!hasMaintenanceAuth(req)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const startTime = Date.now();
        console.log('--- Starting Bilingual Fix Cron Job ---');
        console.log(`Taiwan Time: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);

        // At most 2 Chinese + 2 English repairs, with cancellable I/O and no retries.
        const fixResult = await autoFixNewsContent(7, 2, {
            timeBudgetMs: 25_000,
            requestTimeoutMs: 8_000,
        });

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
