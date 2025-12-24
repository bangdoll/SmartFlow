import { TwitterApi } from 'twitter-api-v2';
import { generateXHookPost, type NewsContext } from './social-templates';

interface PostParams {
    title: string;
    takeaway?: string; // 關鍵影響
    url: string;
    tags?: string[];
}

export async function postToSocialMedia(params: PostParams) {
    await postTweet(params);
}

async function postTweet({ title, takeaway, url, tags = [] }: PostParams) {
    const appKey = process.env.TWITTER_APP_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.warn('⚠️ Twitter API keys are missing. Skipping tweet.');
        return;
    }

    try {
        const client = new TwitterApi({
            appKey,
            appSecret,
            accessToken,
            accessSecret,
        });

        const rwClient = client.readWrite;

        // 使用模板生成貼文內容
        const newsContext: NewsContext = {
            title,
            takeaway,
            url,
            tags,
        };

        const tweetText = generateXHookPost(newsContext);

        // 發佈！
        const result = await rwClient.v2.tweet(tweetText);
        console.log('✅ Tweet posted successfully:', result.data.id);
        return result.data;

    } catch (error) {
        console.error('❌ Failed to post tweet:', error);
        // 不拋出錯誤，避免中斷爬蟲流程
    }
}

