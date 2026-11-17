/**
 * 自動修復服務
 * 雙向檢查並修復：
 * 1. 中文版：確保所有新聞都有中文標題和摘要
 * 2. 英文版：確保所有新聞都有英文標題和摘要
 */

import OpenAI from 'openai';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { isEnglishText } from '@/lib/text-language';

export interface AutoFixOptions {
    /** Total wall-clock budget, including reads, translations, writes and pauses. */
    timeBudgetMs: number;
    requestTimeoutMs?: number;
}

interface AutoFixExecution {
    deadline: number;
    signal: AbortSignal;
    requestTimeoutMs: number;
}

function hasTimeRemaining(execution?: AutoFixExecution): boolean {
    return !execution || (!execution.signal.aborted && Date.now() < execution.deadline);
}

function translationOptions(execution?: AutoFixExecution) {
    if (!execution) return undefined;

    const timeout = Math.max(1, Math.min(execution.requestTimeoutMs, execution.deadline - Date.now()));
    return {
        // The SDK timeout ends at response headers; also bound reading the body.
        signal: AbortSignal.any([execution.signal, AbortSignal.timeout(timeout)]),
        timeout,
        // Let the next scheduled run retry instead of extending this short request.
        maxRetries: 0,
    };
}

async function rateLimitPause(execution?: AutoFixExecution) {
    const delay = execution ? Math.min(500, execution.deadline - Date.now()) : 500;
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
}

function getOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    return new OpenAI({ apiKey });
}

// 英→中翻譯
async function translateToChineseWithSummary(title: string, url: string, existingSummary: string | null = null, execution?: AutoFixExecution): Promise<{ title_zh: string; summary_zh: string }> {
    const prompt = `請為以下英文新聞進行繁體中文本地化：

標題：${title}
${existingSummary ? `現有摘要 (可能是英文)：${existingSummary}` : `網址：${url}`}

任務：
1. 翻譯標題成繁體中文 (台灣用語)。產品名稱可保留英文，但標題必須至少含兩個中文字；純產品名稱請加上忠於原文的中文描述，並將 and 翻為「與」。
2. 生成/翻譯繁體中文摘要 (至少 30 字，必須含中文)

請使用以下 JSON 格式回覆：
{
  "title_zh": "繁體中文標題",
  "summary_zh": "🗣 白話文解讀\\n[解釋]\\n\\n⚠️ 這對你的影響\\n[影響]\\n\\n✅ 你不需要做什麼\\n[建議]"
}`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        response_format: { type: 'json_object' },
    }, translationOptions(execution));

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
}

// 中→英翻譯
async function translateToEnglish(title: string, summaryZh: string | null, execution?: AutoFixExecution): Promise<{ title_en: string; summary_en: string }> {
    const prompt = `Translate the following Traditional Chinese news to English:

Title: ${title}
Summary: ${summaryZh?.substring(0, 500) || 'N/A'}

Output JSON format:
{
  "title_en": "Professional English title",
  "summary_en": "MUST follow this strict 3-part structure with emojis:\\n🗣 **Plain English Breakdown**\\n[Explain simply]\\n\\n⚠️ **Impact on You**\\n[Why it matters]\\n\\n✅ **Actionable Advice**\\n[What to do]"
}`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        response_format: { type: 'json_object' },
        temperature: 0.3,
    }, translationOptions(execution));

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
}

type RepairLanguage = 'zh' | 'en';
type RepairItem = {
    id: string;
    title: string;
    original_url?: string | null;
    summary_zh: string | null;
    title_en?: string | null;
    summary_en?: string | null;
    bilingual_zh_retry_after?: string | null;
    bilingual_en_retry_after?: string | null;
};

const RETRY_COOLDOWN_MS = 60 * 60 * 1000;
const REPAIR_COLUMNS = 'id, title, original_url, summary_zh, title_en, summary_en, bilingual_zh_retry_after, bilingual_en_retry_after';

function validText(value: unknown, language: RepairLanguage, minLength = 1): value is string {
    if (typeof value !== 'string' || value.trim().length < minLength) return false;
    return language === 'zh'
        ? (value.match(/[\u4e00-\u9fff]/g)?.length || 0) >= 2
        : isEnglishText(value);
}

// Use the same predicate for selection, proposed output and persisted output.
function repairIssues(item: RepairItem, language: RepairLanguage): string[] {
    const titleField = language === 'zh' ? 'title' : 'title_en';
    const summaryField = language === 'zh' ? 'summary_zh' : 'summary_en';
    return [
        ...(!validText(item[titleField], language) ? [titleField] : []),
        ...(!validText(item[summaryField], language, 30) ? [summaryField] : []),
    ];
}

async function autoFixContent(language: RepairLanguage, daysBack: number, limit: number, execution?: AutoFixExecution): Promise<number> {
    if (!hasTimeRemaining(execution)) return 0;
    const prefix = `[AutoFix-${language.toUpperCase()}]`;
    const retryField = language === 'zh' ? 'bilingual_zh_retry_after' : 'bilingual_en_retry_after';
    const titleField = language === 'zh' ? 'title' : 'title_en';
    const summaryField = language === 'zh' ? 'summary_zh' : 'summary_en';
    const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    let query = supabase.from('news_items').select(REPAIR_COLUMNS)
        .gte('published_at', cutoffDate.toISOString()).order('published_at', { ascending: false });
    if (execution) query = query.abortSignal(execution.signal);
    const { data: items, error } = await query;
    if (error) {
        console.error(`${prefix} Fetch failed`, { error: error.message });
        return 0;
    }

    // Cooldown happens BEFORE the batch limit so failed records cannot take the
    // next round's slots. State lives in Postgres and survives serverless restarts.
    const pending = (items as RepairItem[] | null)?.filter(item => repairIssues(item, language).length > 0 &&
        (!item[retryField] || Date.parse(item[retryField]) <= Date.now())).slice(0, limit) || [];
    console.log(`${prefix} Eligible: ${pending.length}`);
    let fixedCount = 0;
    for (const candidate of pending) {
        if (!hasTimeRemaining(execution)) break;
        const retryAfter = new Date(Date.now() + RETRY_COOLDOWN_MS).toISOString();
        const context = { id: candidate.id, language, retryAfter };
        try {
            // Conditional UPDATE is an atomic claim shared by daily and bilingual
            // jobs. A failed/aborted attempt keeps the one-hour retry deadline.
            let claim = supabase.from('news_items').update({ [retryField]: retryAfter })
                .eq('id', candidate.id)
                .or(`${retryField}.is.null,${retryField}.lte.${new Date().toISOString()}`)
                .select(REPAIR_COLUMNS);
            if (execution) claim = claim.abortSignal(execution.signal);
            const { data: claimed, error: claimError } = await claim;
            if (claimError) {
                console.error(`${prefix} Claim failed; no AI request`, { ...context, error: claimError.message });
                continue;
            }
            const item = claimed?.[0] as RepairItem | undefined;
            if (!item || !hasTimeRemaining(execution)) continue;
            const issues = repairIssues(item, language);
            if (issues.length === 0) continue;
            console.log(`${prefix} Attempt`, { ...context, issues });
            const result = language === 'zh'
                ? await translateToChineseWithSummary(item.title, item.original_url || '', item.summary_zh, execution)
                : await translateToEnglish(item.title, item.summary_zh || item.summary_en || '', execution);
            if (!hasTimeRemaining(execution)) break;

            const output = result && typeof result === 'object' ? result as unknown as Record<string, unknown> : {};
            const updateData: Record<string, string | null> = {};
            if (issues.includes(titleField) && validText(output[`title_${language}`], language)) {
                updateData[titleField] = (output[`title_${language}`] as string).trim();
            }
            if (issues.includes(summaryField) && validText(output[`summary_${language}`], language, 30)) {
                updateData[summaryField] = (output[`summary_${language}`] as string).trim();
            }
            const remaining = repairIssues({ ...item, ...updateData } as RepairItem, language);
            if (remaining.length > 0) {
                console.warn(`${prefix} Incomplete; retry deferred`, { ...context, issues, remaining });
                continue;
            }

            // Never rewrite healthy fields. Confirm UPDATE actually returned a
            // complete record before counting it; a zero-row write is not success.
            const changed = Object.keys(updateData);
            let update = supabase.from('news_items').update({ ...updateData, [retryField]: null })
                .eq('id', item.id).eq(retryField, retryAfter).eq('title', item.title).select(REPAIR_COLUMNS);
            if (execution) update = update.abortSignal(execution.signal);
            const { data: saved, error: updateError } = await update;
            if (updateError || !saved?.[0] || repairIssues(saved[0] as RepairItem, language).length > 0) {
                console.error(`${prefix} Write not confirmed`, { ...context, error: updateError?.message || 'No complete row returned' });
                continue;
            }
            fixedCount++;
            console.log(`${prefix} Fixed`, { id: item.id, language, changed, remaining: [] });
            await rateLimitPause(execution);
        } catch (error: unknown) {
            console.error(`${prefix} Attempt failed; retry deferred`, { ...context, error: error instanceof Error ? error.message : String(error) });
        }
    }
    console.log(`${prefix} Completed. Fixed ${fixedCount} items.`);
    return fixedCount;
}

export async function autoFixChineseContent(daysBack = 7, limit = 20, execution?: AutoFixExecution): Promise<number> {
    return autoFixContent('zh', daysBack, limit, execution);
}

export async function autoFixEnglishContent(daysBack = 7, limit = 20, execution?: AutoFixExecution): Promise<number> {
    return autoFixContent('en', daysBack, limit, execution);
}

/**
 * 雙向自動修復（中文+英文）
 * 每日 Cron 呼叫此函數
 */
export async function autoFixNewsContent(daysBack = 7, limit = 20, options?: AutoFixOptions): Promise<{ chinese: number; english: number }> {
    console.log(`[AutoFix] Starting bilingual content check...`);

    const startTime = Date.now();
    const requestTimeoutMs = options?.requestTimeoutMs ?? 8_000;
    if (options && (!Number.isFinite(options.timeBudgetMs) || options.timeBudgetMs <= 0 ||
        !Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0)) {
        throw new Error('Auto-fix time budgets must be positive finite numbers');
    }
    const executionFor = (deadline: number): AutoFixExecution => ({
        deadline,
        signal: AbortSignal.timeout(Math.max(0, Math.floor(deadline - Date.now()))),
        requestTimeoutMs,
    });

    // 1. 修復中文內容（英→中）
    // Reserve at least half the budget for English, even if Chinese requests stall.
    const chineseFixed = await autoFixChineseContent(daysBack, limit, options
        ? executionFor(startTime + Math.floor(options.timeBudgetMs / 2)) : undefined);

    // 2. 修復英文內容（中→英）
    // Chinese completes first so English can use the repaired source content.
    const englishFixed = await autoFixEnglishContent(daysBack, limit, options
        ? executionFor(startTime + options.timeBudgetMs) : undefined);

    console.log(`[AutoFix] Total fixed: ${chineseFixed} Chinese, ${englishFixed} English`);

    return { chinese: chineseFixed, english: englishFixed };
}
