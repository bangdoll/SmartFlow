/**
 * 社群貼文模板生成器
 * 根據 Growth Strategy 建議，生成觀點型貼文而非單純分享連結
 */

export interface NewsContext {
    title: string;
    summary?: string;
    takeaway?: string;
    tags?: string[];
    url: string;
    source?: string;
}

// =============================================================================
// X (Twitter) 模板
// =============================================================================

/**
 * X 鉤子型貼文 - 短小精悍、引發好奇
 * 策略：觀點鉤子，一句話版本
 */
export function generateXHookPost(news: NewsContext): string {
    const hooks = [
        `如果你今天還沒看到這則 AI 新聞，其實已經晚了一週。`,
        `這則消息，半年後會變成「早知道」。`,
        `今天不在意，明天就變你的競爭劣勢。`,
        `你的同事可能已經知道了。`,
        `這不是新聞，這是你下一個決策的依據。`,
    ];

    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];

    let post = `${randomHook}\n\n`;
    post += `📌 ${news.title}\n\n`;

    if (news.takeaway) {
        const cleanTakeaway = news.takeaway.replace(/^💡\s*關鍵影響：/, '').substring(0, 100);
        post += `💡 ${cleanTakeaway}\n\n`;
    }

    post += `👉 ${news.url}`;

    // 加標籤 (如果還有空間)
    if (news.tags && news.tags.length > 0) {
        const hashtags = news.tags.slice(0, 3).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
        if (post.length + hashtags.length + 1 < 280) {
            post += `\n\n${hashtags}`;
        }
    }

    return post;
}

/**
 * X Thread 開頭 - 深度分析型
 */
export function generateXThreadStart(news: NewsContext): string {
    let thread = `🧵 [AI 決策風險分析]\n\n`;
    thread += `${news.title}\n\n`;
    thread += `這則新聞對你的影響可能比你想的還大。\n`;
    thread += `來拆解一下 👇`;

    return thread;
}

/**
 * X Thread 內容片段
 */
export function generateXThreadContent(news: NewsContext): string[] {
    const parts: string[] = [];

    // Part 1: 白話解釋
    if (news.summary) {
        const plainExplanation = news.summary
            .split('🧠')[1]?.split('⚠️')[0]?.trim() ||
            news.summary.substring(0, 200);

        parts.push(`1/ 🧠 白話解讀\n\n${plainExplanation.substring(0, 240)}`);
    }

    // Part 2: 關鍵影響
    if (news.takeaway) {
        const impact = news.takeaway.replace(/^💡\s*關鍵影響：/, '');
        parts.push(`2/ ⚠️ 這對你的影響\n\n${impact.substring(0, 240)}`);
    }

    // Part 3: CTA
    parts.push(`3/ 📖 完整分析，包含「你不需要做什麼」的部分：\n\n${news.url}\n\n每天 5 分鐘，掌握 AI 決策風險。`);

    return parts;
}

// =============================================================================
// LinkedIn 模板
// =============================================================================

/**
 * LinkedIn 觀點型貼文
 * 策略：專業觀點，帶有個人見解
 */
export function generateLinkedInPost(news: NewsContext): string {
    let post = `📊 今天最重要的 AI 動態：\n\n`;
    post += `「${news.title}」\n\n`;

    // 添加分析觀點
    post += `🔍 我的觀察：\n\n`;

    if (news.summary) {
        // 提取核心觀點
        const coreMessage = news.summary.substring(0, 300).split('\n')[0];
        post += `${coreMessage}\n\n`;
    }

    // 針對企業主/決策者的觀點
    post += `💼 企業主應該注意什麼？\n\n`;

    if (news.takeaway) {
        const cleanTakeaway = news.takeaway.replace(/^💡\s*關鍵影響：/, '');
        post += `${cleanTakeaway.substring(0, 200)}\n\n`;
    } else {
        post += `這則消息可能影響你團隊的工作方式。越早了解，越有競爭優勢。\n\n`;
    }

    // CTA
    post += `---\n\n`;
    post += `📌 完整分析在 Smart Flow：\n`;
    post += `${news.url}\n\n`;
    post += `#AI #人工智慧 #企業轉型 #科技趨勢`;

    if (news.tags && news.tags.length > 0) {
        const additionalTags = news.tags.slice(0, 2).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');
        post += ` ${additionalTags}`;
    }

    return post;
}

/**
 * LinkedIn 長文型貼文 - 深度分析
 */
export function generateLinkedInLongPost(news: NewsContext): string {
    let post = `🚨 AI 決策風險警報\n\n`;
    post += `---\n\n`;
    post += `📰 ${news.title}\n\n`;

    if (news.summary) {
        // 分段處理摘要
        const sections = news.summary.split(/[🧠⚠️💡✅📊]/);

        if (sections.length > 1) {
            post += `🔑 重點摘要：\n\n`;
            post += `${sections[1]?.trim().substring(0, 300) || ''}\n\n`;
        }
    }

    post += `---\n\n`;
    post += `💬 這則新聞告訴我們什麼？\n\n`;
    post += `AI 的變化速度，已經快到我們需要每天關注才能跟上。\n`;
    post += `但重點不是追新聞，而是理解「這對我的決策有什麼影響」。\n\n`;

    post += `📖 完整分析（含白話解讀、影響評估）：\n`;
    post += `${news.url}\n\n`;

    post += `---\n\n`;
    post += `💡 每天 5 分鐘，不錯過讓你做錯決策的 AI 風險。\n`;
    post += `追蹤 Smart Flow，掌握 AI 趨勢不焦慮。\n\n`;

    post += `#AI決策 #人工智慧 #企業風險管理 #數位轉型 #科技新聞`;

    return post;
}

// =============================================================================
// 工具函數
// =============================================================================

/**
 * 根據平台選擇最適合的模板
 */
export function generateSocialPost(
    news: NewsContext,
    platform: 'x' | 'x-thread' | 'linkedin' | 'linkedin-long'
): string | string[] {
    switch (platform) {
        case 'x':
            return generateXHookPost(news);
        case 'x-thread':
            return [generateXThreadStart(news), ...generateXThreadContent(news)];
        case 'linkedin':
            return generateLinkedInPost(news);
        case 'linkedin-long':
            return generateLinkedInLongPost(news);
        default:
            return generateXHookPost(news);
    }
}

/**
 * 生成所有平台的貼文預覽
 */
export function generateAllPreviews(news: NewsContext): Record<string, string | string[]> {
    return {
        x: generateXHookPost(news),
        xThread: [generateXThreadStart(news), ...generateXThreadContent(news)],
        linkedin: generateLinkedInPost(news),
        linkedinLong: generateLinkedInLongPost(news),
    };
}
