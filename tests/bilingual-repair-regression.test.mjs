import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTS } from './load-ts.mjs';

const language = loadTS('src/lib/text-language.ts');
const summary = '這是一段完整的繁體中文摘要，說明人工智慧最新發展，以及對日常工作和生活帶來的實際影響。';
const englishSummary = 'An English summary explaining the latest AI developments and their practical impact.';
const item = (id, extra = {}) => ({ id, title: 'MAI Code 2 and Code 2 Flash', summary_zh: summary,
    title_en: 'MAI Code 2 and Code 2 Flash', summary_en: englishSummary,
    original_url: 'https://example.com/news', ...extra });

function harness(rows, output, { writeError = false, zeroWrites = false, claimError = false } = {}) {
    const calls = [], writes = [], logs = [];
    let now = Date.now();
    class Clock extends Date {
        constructor(...args) { super(...(args.length ? args : [now])); }
        static now() { return now; }
    }
    const supabase = { from: () => {
        let update, filters = [], orFilter;
        const query = {
            select() { return this; }, gte() { return this; }, order() { return this; },
            abortSignal() { return this; }, update(value) { update = value; return this; },
            eq(key, value) { filters.push([key, value]); return this; },
            or(value) { orFilter = value; return this; },
            then(resolve, reject) { return Promise.resolve().then(() => {
                let selected = rows.filter(row => filters.every(([key, value]) => row[key] === value));
                if (orFilter) {
                    const column = orFilter.split('.')[0];
                    selected = selected.filter(row => !row[column] || Date.parse(row[column]) <= now);
                }
                if (update) {
                    const claim = Object.keys(update).every(key => key.endsWith('_retry_after'));
                    if ((claim && claimError) || (!claim && writeError)) return { data: null, error: new Error('write failed') };
                    if (!claim && zeroWrites) return { data: [], error: null };
                    for (const row of selected) { Object.assign(row, update); writes.push({ id: row.id, update }); }
                }
                return { data: structuredClone(selected), error: null };
            }).then(resolve, reject); },
        };
        return query;
    } };
    class FakeOpenAI {
        chat = { completions: { create: async body => {
            calls.push(body);
            const value = typeof output === 'function' ? output(body) : output;
            return { choices: [{ message: { content: JSON.stringify(value) } }] };
        } } };
    }
    const makeService = () => loadTS('src/lib/auto-fix-service.ts', {
        openai: FakeOpenAI, '@/lib/supabase': { supabaseAdmin: supabase }, '@/lib/text-language': language,
    }, { Date: Clock, process: { env: { OPENAI_API_KEY: 'test-only' } },
        setTimeout(callback) { callback(); },
        console: { log(...args) { logs.push(args); }, warn(...args) { logs.push(args); }, error(...args) { logs.push(args); } },
    });
    return { service: makeService(), makeService, rows, calls, writes, logs, advance(ms) { now += ms; } };
}

test('summary-only AI response never counts an unresolved English title as fixed', async () => {
    const h = harness([item('repeated')], { title_zh: 'MAI Code 2 and Code 2 Flash', summary_zh: summary });
    assert.equal(await h.service.autoFixChineseContent(7, 1), 0);
    assert.ok(h.writes.every(write => !('summary_zh' in write.update)), 'healthy summary must not be rewritten');
    assert.ok(h.logs.some(args => JSON.stringify(args).includes('repeated')), 'logs must identify the record');
});

test('failed record survives cold starts, skips the next round quota and retries after cooldown', async () => {
    const h = harness([item('repeated'), item('next')], body => ({
        title_zh: body.messages[0].content.includes('next-source') ? '下一則人工智慧新聞' : 'MAI Code 2 and Code 2 Flash', summary_zh: summary,
    }));
    h.rows[1].title = 'next-source AI news';
    assert.equal(await h.service.autoFixChineseContent(7, 1), 0);
    assert.equal(await h.makeService().autoFixChineseContent(7, 1), 1);
    assert.equal(h.calls.length, 2);
    assert.equal(await h.makeService().autoFixChineseContent(7, 1), 0);
    assert.equal(h.calls.length, 2);
    h.advance(60 * 60 * 1000 + 1);
    await h.makeService().autoFixChineseContent(7, 1);
    assert.equal(h.calls.length, 3);
});

test('title-only repair preserves the valid summary and is not selected again', async () => {
    const h = harness([item('title-only')], { title_zh: 'MAI Code 2 與 Code 2 Flash 程式碼模型', summary_zh: '不應覆寫的另一份完整繁體中文摘要。'.repeat(3) });
    assert.equal(await h.service.autoFixChineseContent(7, 1), 1);
    assert.equal(h.rows[0].summary_zh, summary);
    assert.equal(await h.makeService().autoFixChineseContent(7, 1), 0);
    assert.equal(h.calls.length, 1);
});

test('selection and output validation both reject summaries shorter than 30 characters', async () => {
    const h = harness([item('short', { title: '人工智慧消息', summary_zh: null })], { title_zh: '人工智慧消息', summary_zh: '中'.repeat(25) });
    assert.equal(await h.service.autoFixChineseContent(7, 1), 0);
});

for (const title_zh of ['OK', '12345', '     ', null, 42]) {
    test(`Chinese title rejects nonlocalized model result ${JSON.stringify(title_zh)}`, async () => {
        const h = harness([item('invalid')], { title_zh, summary_zh: summary });
        assert.equal(await h.service.autoFixChineseContent(7, 1), 0);
    });
}

test('English validation rejects Chinese output and malformed fields', async () => {
    for (const output of [{ title_en: '仍然是中文', summary_en: englishSummary }, { title_en: 'Valid English title', summary_en: null }]) {
        const h = harness([item('english', { title_en: null, summary_en: null })], output);
        assert.equal(await h.service.autoFixEnglishContent(7, 1), 0);
    }
});

test('two overlapping runs claim a record atomically before calling AI', async () => {
    const h = harness([item('concurrent')], { title_zh: '人工智慧最新消息', summary_zh: summary });
    const counts = await Promise.all([h.service.autoFixChineseContent(7, 1), h.makeService().autoFixChineseContent(7, 1)]);
    assert.equal(counts.reduce((a, b) => a + b), 1);
    assert.equal(h.calls.length, 1);
});

test('claim failures make no AI calls; failed or unmatched content writes never count', async () => {
    const output = { title_zh: '人工智慧最新消息', summary_zh: summary };
    const blocked = harness([item('claim-failed')], output, { claimError: true });
    assert.equal(await blocked.service.autoFixChineseContent(7, 1), 0);
    assert.equal(blocked.calls.length, 0);
    for (const options of [{ writeError: true }, { zeroWrites: true }]) {
        const h = harness([item('write-failed')], output, options);
        assert.equal(await h.service.autoFixChineseContent(7, 1), 0);
    }
});
