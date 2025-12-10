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

// The Verge AI Category URL
const VERGE_AI_URL = 'https://www.theverge.com/ai';
// Wired AI Category URL
const WIRED_AI_URL = 'https://www.wired.com/category/artificial-intelligence/';

export async function scrapeTheVerge(): Promise<ScrapedNews[]> {
    try {
        console.log(`Fetching ${VERGE_AI_URL}...`);
        const response = await fetch(VERGE_AI_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) throw new Error(`Failed to fetch The Verge: ${response.statusText}`);

        const html = await response.text();
        const $ = cheerio.load(html);
        const newsItems: ScrapedNews[] = [];

        // The Verge - multiple selector strategies
        const selectors = ['h2 a', 'h3 a', 'a[data-analytics-link="article"]', '.c-compact-river__entry a', '.c-entry-box--compact__title a'];
        const seen = new Set<string>();

        for (const selector of selectors) {
            $(selector).each((_, element) => {
                const link = $(element);
                const title = link.text().trim();
                const href = link.attr('href');

                // Filter: must be a Verge article URL and have meaningful title
                if (title && href && title.length > 10 &&
                    (href.includes('theverge.com') || href.startsWith('/')) &&
                    !seen.has(href)) {

                    seen.add(href);
                    const url = href.startsWith('http') ? href : `https://www.theverge.com${href}`;

                    // Skip non-article URLs
                    if (url.includes('/authors/') || url.includes('/about/') || url.includes('/contact')) return;

                    newsItems.push({
                        title,
                        original_url: url,
                        source: 'The Verge',
                        published_at: new Date().toISOString(),
                        content: title
                    });
                }
            });
        }

        console.log(`Found ${newsItems.length} items from The Verge.`);
        return newsItems;

    } catch (error) {
        console.error('Error scraping The Verge:', error);
        return [];
    }
}

export async function scrapeWired(): Promise<ScrapedNews[]> {
    try {
        console.log(`Fetching ${WIRED_AI_URL}...`);
        const response = await fetch(WIRED_AI_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) throw new Error(`Failed to fetch Wired: ${response.statusText}`);

        const html = await response.text();
        const $ = cheerio.load(html);
        const newsItems: ScrapedNews[] = [];

        // Wired - multiple selector strategies
        const wiredSelectors = [
            '.summary-item__content',
            'a[class*="SummaryItem"]',
            'article a',
            'h2 a', 'h3 a'
        ];
        const seenWired = new Set<string>();

        for (const selector of wiredSelectors) {
            $(selector).each((_, element) => {
                let title = '';
                let href = '';

                if (selector.includes('content') || selector.includes('article')) {
                    const titleEl = $(element).find('h3, h2, a');
                    title = titleEl.first().text().trim();
                    const linkEl = $(element).find('a').first();
                    href = linkEl.attr('href') || '';
                } else {
                    const link = $(element);
                    title = link.text().trim();
                    href = link.attr('href') || '';
                }

                if (title && href && title.length > 10 && !seenWired.has(href) &&
                    (href.includes('wired.com') || href.startsWith('/'))) {

                    seenWired.add(href);
                    const url = href.startsWith('http') ? href : `https://www.wired.com${href}`;

                    // Skip non-article URLs
                    if (url.includes('/about/') || url.includes('/contact') || url.includes('/account')) return;

                    newsItems.push({
                        title,
                        original_url: url,
                        source: 'Wired',
                        published_at: new Date().toISOString(),
                        content: title
                    });
                }
            });
        }

        console.log(`Found ${newsItems.length} items from Wired.`);
        return newsItems;

    } catch (error) {
        console.error('Error scraping Wired:', error);
        return [];
    }
}

// Threads AI Tags - Note: Threads is a JS-rendered SPA, this may have limited success
const THREADS_AI_TAGS = ['AI', 'ChatGPT', 'OpenAI', 'GenerativeAI'];

export async function scrapeThreads(): Promise<ScrapedNews[]> {
    const newsItems: ScrapedNews[] = [];

    // Threads URL format for tags: https://www.threads.net/tag/{tag}
    // Note: This is experimental - Threads may block or require JS rendering
    for (const tag of THREADS_AI_TAGS) {
        try {
            const url = `https://www.threads.net/tag/${tag}`;
            console.log(`Fetching Threads tag: #${tag}...`);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
                next: { revalidate: 3600 }
            });

            if (!response.ok) {
                console.log(`Threads tag #${tag} returned ${response.status}, skipping...`);
                continue;
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            // Threads embeds data in JSON within script tags
            // Try to extract from __NEXT_DATA__ or similar
            $('script[type="application/json"]').each((_, element) => {
                try {
                    const jsonStr = $(element).html();
                    if (jsonStr && jsonStr.includes('thread')) {
                        // Parse and extract thread data if available
                        const data = JSON.parse(jsonStr);
                        // This structure varies, so we do a best-effort extraction
                        console.log(`Found JSON data for Threads #${tag}`);
                    }
                } catch {
                    // JSON parsing failed, skip
                }
            });

            // Alternative: Look for any visible text content
            // Threads renders most content client-side, so this may be empty
            $('div[data-pressable-container] span').each((_, element) => {
                const text = $(element).text().trim();
                if (text && text.length > 20 && text.length < 500) {
                    // This might capture some thread content
                    newsItems.push({
                        title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                        original_url: `https://www.threads.net/tag/${tag}`,
                        source: 'Threads',
                        published_at: new Date().toISOString(),
                        content: text
                    });
                }
            });

        } catch (error) {
            console.error(`Error scraping Threads tag #${tag}:`, error);
        }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const deduped = newsItems.filter(item => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
    });

    console.log(`Found ${deduped.length} items from Threads (experimental).`);
    return deduped.slice(0, 10); // Limit to 10 items
}

// Hacker News - Using official Firebase API with parallel requests
export async function scrapeHackerNews(): Promise<ScrapedNews[]> {
    try {
        console.log('Fetching Hacker News top stories...');

        // Get top story IDs
        const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
            next: { revalidate: 3600 }
        });

        if (!topStoriesRes.ok) throw new Error('Failed to fetch HN top stories');

        const storyIds: number[] = await topStoriesRes.json();

        // AI-related keywords to filter
        const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt', 'openai', 'claude', 'anthropic', 'gemini', 'chatgpt', 'neural', 'deep learning'];

        // Fetch first 25 stories in parallel (reduced from 50)
        const storiesToCheck = storyIds.slice(0, 25);

        const storyPromises = storiesToCheck.map(async (id) => {
            try {
                const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                if (!storyRes.ok) return null;
                return await storyRes.json();
            } catch {
                return null;
            }
        });

        const stories = await Promise.all(storyPromises);

        const newsItems: ScrapedNews[] = [];
        for (const story of stories) {
            if (story && story.title && story.url) {
                const titleLower = story.title.toLowerCase();
                const isAI = aiKeywords.some(kw => titleLower.includes(kw));

                if (isAI) {
                    newsItems.push({
                        title: story.title,
                        original_url: story.url,
                        source: 'Hacker News',
                        published_at: new Date(story.time * 1000).toISOString(),
                        content: story.title
                    });
                }
            }
            // Limit to 5 AI stories (reduced from 10)
            if (newsItems.length >= 5) break;
        }

        console.log(`Found ${newsItems.length} AI items from Hacker News.`);
        return newsItems;

    } catch (error) {
        console.error('Error scraping Hacker News:', error);
        return [];
    }
}

// Reddit r/artificial - Using JSON API
export async function scrapeRedditArtificial(): Promise<ScrapedNews[]> {
    try {
        console.log('Fetching Reddit r/artificial...');

        const response = await fetch('https://www.reddit.com/r/artificial/hot.json?limit=20', {
            headers: {
                'User-Agent': 'SmartFlow-AI-News-Bot/1.0',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) throw new Error(`Reddit returned ${response.status}`);

        const data = await response.json();
        const newsItems: ScrapedNews[] = [];

        if (data.data && data.data.children) {
            for (const post of data.data.children) {
                const item = post.data;

                // Skip stickied posts and self-posts without content
                if (item.stickied) continue;

                const url = item.url_overridden_by_dest || `https://www.reddit.com${item.permalink}`;

                newsItems.push({
                    title: item.title,
                    original_url: url,
                    source: 'Reddit r/artificial',
                    published_at: new Date(item.created_utc * 1000).toISOString(),
                    content: item.selftext || item.title
                });
            }
        }

        console.log(`Found ${newsItems.length} items from Reddit r/artificial.`);
        return newsItems.slice(0, 15);

    } catch (error) {
        console.error('Error scraping Reddit:', error);
        return [];
    }
}

// Ars Technica AI Category
const ARS_TECHNICA_AI_URL = 'https://arstechnica.com/ai/';

export async function scrapeArsTechnica(): Promise<ScrapedNews[]> {
    try {
        console.log(`Fetching ${ARS_TECHNICA_AI_URL}...`);

        const response = await fetch(ARS_TECHNICA_AI_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) throw new Error(`Ars Technica returned ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);
        const newsItems: ScrapedNews[] = [];

        // Ars Technica article structure
        $('article').each((_, element) => {
            const titleEl = $(element).find('h2 a, h3 a');
            const title = titleEl.text().trim();
            const href = titleEl.attr('href');

            // Get time if available
            const timeEl = $(element).find('time');
            const timeStr = timeEl.attr('datetime');

            if (title && href) {
                const url = href.startsWith('http') ? href : `https://arstechnica.com${href}`;

                newsItems.push({
                    title,
                    original_url: url,
                    source: 'Ars Technica',
                    published_at: timeStr ? new Date(timeStr).toISOString() : new Date().toISOString(),
                    content: title
                });
            }
        });

        console.log(`Found ${newsItems.length} items from Ars Technica.`);
        return newsItems.slice(0, 15);

    } catch (error) {
        console.error('Error scraping Ars Technica:', error);
        return [];
    }
}

export async function scrapeAllSources(): Promise<ScrapedNews[]> {
    const [techCrunch, verge, wired, threads, hackerNews, reddit, arsTechnica] = await Promise.all([
        scrapeTechCrunch(),
        scrapeTheVerge(),
        scrapeWired(),
        scrapeThreads(),
        scrapeHackerNews(),
        scrapeRedditArtificial(),
        scrapeArsTechnica()
    ]);

    return [...techCrunch, ...verge, ...wired, ...threads, ...hackerNews, ...reddit, ...arsTechnica];
}
