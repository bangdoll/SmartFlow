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
export const maxDuration = 120; // 給予較長時間處理大量項目

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

        // 檢查過去 14 天的新聞，每次最多修復 100 則
        // 確保：中文版全部是中文標題，英文版全部有英文標題
        const fixResult = await autoFixNewsContent(14, 100);
        
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
