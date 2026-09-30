import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Compile the real service with only external I/O replaced. No production keys or
// database are used; the deterministic clock exercises full 25-second budgets.
function loadTS(file, dependencies = {}, globals = {}) {
    const source = readFileSync(path.join(dirname, '..', file), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    const compiledModule = { exports: {} };
    const localRequire = name => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw new Error(`Unexpected dependency: ${name}`);
    };
    new Function('require', 'module', 'exports', ...Object.keys(globals), outputText)(
        localRequire, compiledModule, compiledModule.exports, ...Object.values(globals),
    );
    return compiledModule.exports;
}

const language = loadTS('src/lib/text-language.ts');
const chineseSummary = '這是一段完整的繁體中文摘要，說明人工智慧最新發展以及對日常生活帶來的實際影響。';
const resultZH = { title_zh: '人工智慧最新消息', summary_zh: chineseSummary };
const resultEN = { title_en: 'Latest artificial intelligence news', summary_en: 'An English summary explaining the news and practical impact on everyday life.' };
const silentConsole = { log() {}, error() {} };

function makeHarness({ count = 5, translationMs = 3_000, readMs = 100, writeMs = 100, translationResult, failingWrites = false, malformed = false } = {}) {
    let now = 0;
    const signals = [];
    const calls = [];
    const databaseCalls = [];
    const updates = [];
    const items = Array.from({ length: count }, (_, id) => ({
        id, title: `Latest English news ${id}`, summary_zh: null,
        title_en: null, summary_en: null, original_url: 'https://example.com/news',
    }));
    function advance(ms) {
        now += ms;
        for (const signal of signals) signal.aborted ||= now >= signal.deadline;
    }
    function elapsed(ms, signal, timeout = Infinity) {
        const available = Math.min(timeout, signal ? signal.deadline - now : Infinity);
        if (ms >= available) {
            advance(Math.max(0, available));
            throw new Error('Request timed out');
        }
        advance(ms);
    }
    class FakeDate extends Date {
        constructor(...args) { super(...(args.length ? args : [now])); }
        static now() { return now; }
    }
    class FakeOpenAI {
        chat = { completions: { create: async (body, options) => {
            const lang = body.max_tokens === 800 ? 'chinese' : 'english';
            calls.push({ lang, options, started: now, prompt: body.messages[0].content });
            elapsed(typeof translationMs === 'function' ? translationMs(lang, calls.length) : translationMs,
                options?.signal, options?.timeout);
            const result = translationResult ? translationResult(lang) : (lang === 'chinese' ? resultZH : resultEN);
            return { choices: [{ message: { content: malformed ? 'invalid json' : JSON.stringify(result) } }] };
        } } };
    }
    const supabase = { from: () => {
        let lang, data, id, signal;
        const builder = {
            select(columns) { lang = columns.includes('title_en') ? 'english' : 'chinese'; return this; },
            gte() { return this; }, order() { return this; },
            update(value) { data = value; return this; },
            eq(_key, value) { id = value; return this; },
            abortSignal(value) { signal = value; return this; },
            then(resolve, reject) {
                return Promise.resolve().then(() => {
                    const kind = data ? 'write' : 'read';
                    databaseCalls.push({ kind, lang, signal, started: now });
                    try {
                        elapsed(data ? writeMs : readMs, signal);
                    } catch (error) { return { data: null, error }; }
                    if (data) {
                        if (failingWrites) return { error: new Error('Database rejected update') };
                        Object.assign(items.find(item => item.id === id), data);
                        updates.push({ id, data, finished: now });
                        return { error: null };
                    }
                    return { data: structuredClone(items), error: null };
                }).then(resolve, reject);
            },
        };
        return builder;
    } };
    const service = loadTS('src/lib/auto-fix-service.ts', {
        openai: FakeOpenAI,
        '@/lib/supabase': { supabaseAdmin: supabase },
        '@/lib/text-language': language,
    }, {
        Date: FakeDate,
        AbortSignal: {
            timeout(ms) { const signal = { deadline: now + ms, aborted: false }; signals.push(signal); return signal; },
            any(inputs) { return inputs.reduce((first, next) => first.deadline < next.deadline ? first : next); },
        },
        setTimeout(callback, ms) { advance(ms); callback(); },
        process: { env: { OPENAI_API_KEY: 'test-only' } },
        console: silentConsole,
    });
    return { service, calls, databaseCalls, updates, items, now: () => now };
}

const budget = { timeBudgetMs: 25_000, requestTimeoutMs: 8_000 };

test('small bilingual batches finish under budget and English sees repaired Chinese', async () => {
    const h = makeHarness();
    assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 2, english: 2 });
    assert.ok(h.now() < 25_000);
    assert.deepEqual(h.calls.map(call => call.lang), ['chinese', 'chinese', 'english', 'english']);
    assert.match(h.calls[2].prompt, /人工智慧最新消息/);
    assert.ok(h.calls.every(call => call.options.maxRetries === 0 && call.options.timeout <= 8_000));
    assert.ok(h.databaseCalls.every(call => call.signal));
    assert.equal(h.updates.length, 4);
});

test('slow Chinese calls cannot starve English; each request uses the remaining deadline', async () => {
    const h = makeHarness({ translationMs: lang => lang === 'chinese' ? 60_000 : 1_000 });
    assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 0, english: 2 });
    assert.equal(h.calls[0].options.timeout, 8_000);
    assert.equal(h.calls[1].options.timeout, 4_400);
    assert.equal(h.calls[2].started, 12_600);
    assert.ok(h.now() < 25_000);
});

test('both stalled translation batches stop at the total budget without writes', async () => {
    const h = makeHarness({ translationMs: 60_000 });
    assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 0, english: 0 });
    assert.equal(h.now(), 25_000);
    assert.equal(h.calls.length, 4);
    assert.equal(h.updates.length, 0);
    assert.ok(h.calls.every(call => call.options.maxRetries === 0));
});

test('database reads are abortable and bounded for both languages', async () => {
    const h = makeHarness({ readMs: 60_000 });
    assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 0, english: 0 });
    assert.equal(h.now(), 25_000);
    assert.equal(h.calls.length, 0);
    assert.equal(h.databaseCalls.length, 2);
    assert.ok(h.databaseCalls.every(call => call.signal.aborted));
});

test('stalled database writes are awaited and aborted before returning', async () => {
    const h = makeHarness({ writeMs: 60_000 });
    assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 0, english: 0 });
    assert.equal(h.now(), 25_000);
    assert.equal(h.updates.length, 0);
    assert.equal(h.databaseCalls.filter(call => call.kind === 'write').length, 2);
});

test('untimed daily callers keep their original limits, sequential order and SDK defaults', async () => {
    const h = makeHarness();
    assert.deepEqual(await h.service.autoFixNewsContent(14, 5), { chinese: 5, english: 5 });
    assert.ok(h.now() > 30_000);
    assert.ok(h.calls.every(call => call.options === undefined));
    assert.ok(h.databaseCalls.every(call => call.signal === undefined));
});

test('unfinished items remain eligible and later runs continue the backlog', async () => {
    const h = makeHarness();
    for (const expected of [2, 2, 1, 0]) {
        assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: expected, english: expected });
    }
    assert.equal(h.updates.length, 10);
});

test('invalid Chinese output keeps existing language validation and is not written', async () => {
    const h = makeHarness({ translationResult: lang => lang === 'chinese'
        ? { title_zh: 'Still English', summary_zh: 'This summary is still in English and must not be persisted.' } : resultEN });
    assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 0, english: 2 });
    assert.ok(h.updates.every(update => !('title' in update.data) && !('summary_zh' in update.data)));
});

test('malformed model output and database write failures do not count as repairs', async () => {
    for (const options of [{ malformed: true }, { failingWrites: true }]) {
        const h = makeHarness(options);
        assert.deepEqual(await h.service.autoFixNewsContent(7, 2, budget), { chinese: 0, english: 0 });
        assert.equal(h.updates.length, 0);
    }
});

test('rejects invalid time budgets before any I/O', async () => {
    for (const options of [{ timeBudgetMs: 0 }, { timeBudgetMs: Infinity }, { timeBudgetMs: 25_000, requestTimeoutMs: -1 }]) {
        const h = makeHarness();
        await assert.rejects(h.service.autoFixNewsContent(7, 2, options), /positive finite/);
        assert.equal(h.databaseCalls.length, 0);
    }
});

test('real OpenAI SDK cancels stalled fetches with no hidden retries or detached work', async () => {
    let started = 0, active = 0, aborted = 0;
    class LocalOpenAI extends OpenAI {
        constructor() {
            super({ apiKey: 'test-only', fetch: (_url, { signal }) => new Promise((_resolve, reject) => {
                started++; active++;
                const abort = () => { active--; aborted++; reject(new DOMException('Aborted', 'AbortError')); };
                if (signal.aborted) abort();
                else signal.addEventListener('abort', abort, { once: true });
            }) });
        }
    }
    const h = makeHarness();
    const service = loadTS('src/lib/auto-fix-service.ts', {
        openai: { __esModule: true, default: LocalOpenAI },
        '@/lib/supabase': { supabaseAdmin: { from: () => {
            const builder = { select() { return this; }, gte() { return this; }, order() { return this; }, abortSignal() { return this; },
                then(resolve, reject) { return Promise.resolve({ data: h.items, error: null }).then(resolve, reject); } };
            return builder;
        } } },
        '@/lib/text-language': language,
    }, { process: { env: { OPENAI_API_KEY: 'test-only' } }, console: silentConsole });
    const start = performance.now();
    assert.deepEqual(await service.autoFixNewsContent(7, 2, { timeBudgetMs: 240, requestTimeoutMs: 80 }), { chinese: 0, english: 0 });
    assert.ok(performance.now() - start < 1_000);
    assert.equal(started, 4);
    assert.equal(aborted, started);
    assert.equal(active, 0);
});

test('installed OpenAI and Supabase SDKs cancel slow response bodies after headers arrive', { timeout: 5_000 }, async t => {
    const server = createServer((_request, response) => {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.write('{"incomplete":');
        // Deliberately leave the response body open until the client aborts.
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
    const url = `http://127.0.0.1:${server.address().port}`;
    const client = new OpenAI({ apiKey: 'test-only', baseURL: `${url}/v1` });
    const started = performance.now();
    await assert.rejects(client.chat.completions.create({ model: 'test', messages: [] }, {
        timeout: 50, maxRetries: 0, signal: AbortSignal.timeout(150),
    }));
    const database = createClient(url, 'test-only', { auth: { persistSession: false } });
    for (const query of [database.from('news_items').select('id'), database.from('news_items').update({ title: 'test' }).eq('id', 1)]) {
        const { error } = await query.abortSignal(AbortSignal.timeout(150));
        assert.ok(error);
    }
    assert.ok(performance.now() - started < 2_000);
});

test('cron retains authentication, returns repair counts and passes the 25s/2-per-language settings', async () => {
    let allowed = false, calls = 0, received;
    class NextResponse extends Response {
        static json(data, init) { return Response.json(data, init); }
    }
    const route = loadTS('src/app/api/cron/bilingual-fix/route.ts', {
        'next/server': { NextResponse },
        '@/lib/api-auth': { hasMaintenanceAuth: () => allowed },
        '@/lib/auto-fix-service': { autoFixNewsContent: async (...args) => { calls++; received = args; return { chinese: 2, english: 1 }; } },
    }, { console: silentConsole });
    assert.equal(route.maxDuration, 30);
    assert.equal((await route.GET(new Request('https://example.com/api/cron/bilingual-fix'))).status, 401);
    assert.equal(calls, 0);
    allowed = true;
    const response = await route.GET(new Request('https://example.com/api/cron/bilingual-fix'));
    assert.equal(response.status, 200);
    assert.deepEqual(received, [7, 2, budget]);
    const json = await response.json();
    assert.equal(json.success, true);
    assert.deepEqual(json.fixed, { chinese: 2, english: 1, total: 3 });
});
