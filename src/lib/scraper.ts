import * as cheerio from 'cheerio';
import { ScrapedNews } from '@/types';

// 通用 RSS Feed 解析器
async function parseRSSFeed(
    feedUrl: string,
    sourceName: string,
    limit: number = 10
): Promise<ScrapedNews[]> {
    try {
        console.log(`Fetching RSS: ${feedUrl}...`);

        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartFlowBot/1.0)',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            console.log(`RSS feed ${sourceName} returned ${response.status}`);
            return [];
        }

        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const newsItems: ScrapedNews[] = [];

        // 解析 RSS items (支持 RSS 2.0 和 Atom)
        $('item, entry').each((index, element) => {
            if (index >= limit) return;

            // RSS 2.0 格式
            let title = $(element).find('title').first().text().trim();
            let link = $(element).find('link').first().text().trim();
            let pubDate = $(element).find('pubDate').first().text().trim();

            // Atom 格式 fallback
            if (!link) {
                link = $(element).find('link').attr('href') || '';
            }
            if (!pubDate) {
                pubDate = $(element).find('published, updated').first().text().trim();
            }

            // 移除 CDATA 和清理標題
            title = title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();

            if (title && link) {
                newsItems.push({
                    title,
                    original_url: link,
                    source: sourceName,
                    published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                    content: title
                });
            }
        });

        console.log(`Found ${newsItems.length} items from ${sourceName}.`);
        return newsItems;

    } catch (error) {
        console.error(`Error parsing RSS ${sourceName}:`, error);
        return [];
    }
}

// TechCrunch AI - 使用 RSS Feed
export async function scrapeTechCrunch(): Promise<ScrapedNews[]> {
    return parseRSSFeed(
        'https://techcrunch.com/category/artificial-intelligence/feed/',
        'TechCrunch',
        10
    );
}

// Ars Technica - 使用 RSS Feed
export async function scrapeArsTechnica(): Promise<ScrapedNews[]> {
    return parseRSSFeed(
        'https://feeds.arstechnica.com/arstechnica/index',
        'Ars Technica',
        10
    );
}

// MIT Technology Review AI - 使用 RSS Feed
export async function scrapeMITTechReview(): Promise<ScrapedNews[]> {
    return parseRSSFeed(
        'https://www.technologyreview.com/feed/',
        'MIT Technology Review',
        10
    );
}

// Hacker News - 使用官方 API (保持原有邏輯但優化)
export async function scrapeHackerNews(): Promise<ScrapedNews[]> {
    try {
        console.log('Fetching Hacker News top stories...');

        const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
            next: { revalidate: 3600 }
        });

        if (!topStoriesRes.ok) throw new Error('Failed to fetch HN top stories');

        const storyIds: number[] = await topStoriesRes.json();

        const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt', 'openai', 'claude', 'anthropic', 'gemini', 'chatgpt', 'neural', 'deep learning'];

        // 並行請求前 20 個故事
        const storiesToCheck = storyIds.slice(0, 20);

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
            if (newsItems.length >= 5) break;
        }

        console.log(`Found ${newsItems.length} AI items from Hacker News.`);
        return newsItems;

    } catch (error) {
        console.error('Error scraping Hacker News:', error);
        return [];
    }
}

// Reddit r/artificial - 使用 JSON API
export async function scrapeRedditArtificial(): Promise<ScrapedNews[]> {
    try {
        console.log('Fetching Reddit r/artificial...');

        const response = await fetch('https://www.reddit.com/r/artificial/hot.json?limit=15', {
            headers: {
                'User-Agent': 'SmartFlow-AI-News-Bot/1.0',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            console.log(`Reddit returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        const newsItems: ScrapedNews[] = [];

        if (data.data && data.data.children) {
            for (const post of data.data.children) {
                const item = post.data;

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
        return newsItems.slice(0, 10);

    } catch (error) {
        console.error('Error scraping Reddit:', error);
        return [];
    }
}

// Google News - 使用 RSS (台灣繁體中文)
export async function scrapeGoogleNews(): Promise<ScrapedNews[]> {
    const newsItems: ScrapedNews[] = [];

    const queries = ['AI 人工智慧', '科技新聞', '蘋果 Apple'];

    try {
        console.log('Fetching Google News RSS...');

        for (const query of queries) {
            try {
                const encodedQuery = encodeURIComponent(query);
                const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;

                const response = await fetch(rssUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; SmartFlowBot/1.0)',
                    },
                    next: { revalidate: 3600 }
                });

                if (!response.ok) continue;

                const xml = await response.text();
                const $ = cheerio.load(xml, { xmlMode: true });

                $('item').each((index, element) => {
                    if (index >= 3) return; // 每個關鍵字只取 3 則

                    const title = $(element).find('title').text().trim();
                    const link = $(element).find('link').text().trim();
                    const pubDate = $(element).find('pubDate').text().trim();
                    const source = $(element).find('source').text().trim() || 'Google News';

                    if (title && link) {
                        newsItems.push({
                            title,
                            original_url: link,
                            source: `Google News (${source})`,
                            published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                            content: title
                        });
                    }
                });

            } catch (error) {
                console.error(`Error fetching Google News for "${query}":`, error);
            }
        }

        // 去重
        const seen = new Set<string>();
        const deduped = newsItems.filter(item => {
            if (seen.has(item.original_url)) return false;
            seen.add(item.original_url);
            return true;
        });

        console.log(`Found ${deduped.length} items from Google News.`);
        return deduped.slice(0, 8);

    } catch (error) {
        console.error('Error scraping Google News:', error);
        return [];
    }
}

// 聚合所有來源
export async function scrapeAllSources(): Promise<ScrapedNews[]> {
    const [techCrunch, arsTechnica, mitTechReview, hackerNews, reddit, googleNews] = await Promise.all([
        scrapeTechCrunch(),
        scrapeArsTechnica(),
        scrapeMITTechReview(),
        scrapeHackerNews(),
        scrapeRedditArtificial(),
        scrapeGoogleNews()
    ]);

    const all = [...techCrunch, ...arsTechnica, ...mitTechReview, ...hackerNews, ...reddit, ...googleNews];

    console.log(`Total scraped: ${all.length} items from all sources.`);
    return all;
}
