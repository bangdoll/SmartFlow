import { NextResponse } from 'next/server';
import {
    scrapeTechCrunch,
    scrapeArsTechnica,
    scrapeMITTechReview,
    scrapeHackerNews,
    scrapeRedditArtificial,
    scrapeGoogleNews
} from '@/lib/scraper';

// 測試 API：顯示各來源的爬取結果（不寫入資料庫）
export async function GET() {
    console.log('--- Testing All Scrapers ---');

    const results = await Promise.all([
        scrapeTechCrunch().then(items => ({ source: 'TechCrunch', count: items.length, items: items.slice(0, 2) })),
        scrapeArsTechnica().then(items => ({ source: 'Ars Technica', count: items.length, items: items.slice(0, 2) })),
        scrapeMITTechReview().then(items => ({ source: 'MIT Technology Review', count: items.length, items: items.slice(0, 2) })),
        scrapeHackerNews().then(items => ({ source: 'Hacker News', count: items.length, items: items.slice(0, 2) })),
        scrapeRedditArtificial().then(items => ({ source: 'Reddit r/artificial', count: items.length, items: items.slice(0, 2) })),
        scrapeGoogleNews().then(items => ({ source: 'Google News', count: items.length, items: items.slice(0, 2) })),
    ]);

    const summary = results.map(r => `${r.source}: ${r.count} items`);
    const totalCount = results.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
        success: true,
        totalItems: totalCount,
        summary,
        details: results
    });
}
