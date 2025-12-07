import * as cheerio from 'cheerio';
import { ScrapedNews } from '@/types';

// TechCrunch AI Category URL
const TECHCRUNCH_AI_URL = 'https://techcrunch.com/category/artificial-intelligence/';

export async function scrapeTechCrunch(): Promise<ScrapedNews[]> {
    try {
        console.log(`Fetching ${TECHCRUNCH_AI_URL}...`);
        const response = await fetch(TECHCRUNCH_AI_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch TechCrunch: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const newsItems: ScrapedNews[] = [];

        // TechCrunch 的結構可能會變，這裡針對目前的結構進行解析
        // 通常文章列表在 loop-card 或者 post-block 中
        // 假設結構：.loop-card__title > a (標題與連結), .loop-card__meta (時間)

        // 注意：TechCrunch 最近改版了，結構可能不同。
        // 這裡嘗試通用的解析方式，尋找 h2 或 h3 內的連結

        $('h2.loop-card__title, h3.loop-card__title').each((_, element) => {
            const titleLink = $(element).find('a');
            const title = titleLink.text().trim();
            const url = titleLink.attr('href');

            // 嘗試抓取時間，通常在附近的 time 元素或 meta 區塊
            // 這裡簡化處理，如果抓不到時間就用當前時間 (實際應用需更精確)
            // TechCrunch 通常有 <time class="loop-card__time-datetime">
            const timeStr = $(element).closest('article').find('time').attr('datetime');
            const publishedAt = timeStr ? new Date(timeStr).toISOString() : new Date().toISOString();

            if (title && url) {
                newsItems.push({
                    title,
                    original_url: url,
                    source: 'TechCrunch',
                    published_at: publishedAt,
                    // 內容暫時留空，後續可以針對單頁再爬取，或者僅用標題摘要
                    content: title
                });
            }
        });

        console.log(`Found ${newsItems.length} items from TechCrunch.`);
        return newsItems;

    } catch (error) {
        console.error('Error scraping TechCrunch:', error);
        return [];
    }
}

export async function scrapeAllSources(): Promise<ScrapedNews[]> {
    // 目前僅實作 TechCrunch，未來可加入其他來源
    const techCrunchNews = await scrapeTechCrunch();
    return [...techCrunchNews];
}
