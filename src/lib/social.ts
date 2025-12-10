import { TwitterApi } from 'twitter-api-v2';

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

        // 建構推文內容
        // 限制：280 字元 (連結算 23 字元)
        // [新趨勢] Title
        // 
        // 💡 Takeaway
        //
        // Link #HashTags

        let tweetText = `[新趨勢] ${title}\n\n`;

        if (takeaway) {
            // 移除 "💡 關鍵影響：" 前綴如果存在，避免重複
            const cleanTakeaway = takeaway.replace(/^💡\s*關鍵影響：/, '');
            tweetText += `💡 ${cleanTakeaway}\n\n`;
        }

        tweetText += `${url}`;

        // Add valid hashtags
        if (tags && tags.length > 0) {
            const validTags = tags
                .map(t => t.replace(/\s+/g, '')) // Remove spaces in tags
                .map(t => `#${t}`)
                .join(' ');

            // 簡單檢查長度 (粗略)
            if (tweetText.length + validTags.length + 1 < 280) {
                tweetText += `\n${validTags}`;
            }
        }

        // 發佈！
        const result = await rwClient.v2.tweet(tweetText);
        console.log('✅ Tweet posted successfully:', result.data.id);
        return result.data;

    } catch (error) {
        console.error('❌ Failed to post tweet:', error);
        // 不拋出錯誤，避免中斷爬蟲流程
    }
}
