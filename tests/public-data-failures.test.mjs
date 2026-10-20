import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Render actual server entry points against a database boundary fixture. Tests
// distinguish a failed request from a successful empty result without a real DB.
function fixture(file, { configured = true, error = null, errorTable = null, rejected = false, news = [], trends = null } = {}) {
    const calls = [];
    const supabase = { from(table) {
        const call = { table, projection: null, single: false, maybeSingle: false }; calls.push(call);
        const query = new Proxy({}, { get(_target, property) {
            if (property === 'then') return (resolve, reject) => {
                if (rejected) return Promise.reject(new Error('fixture network outage')).then(resolve, reject);
                const data = table === 'weekly_trends' ? trends : news;
                const resultError = errorTable && errorTable !== table ? null : error;
                return Promise.resolve({ data, error: resultError, count: news.length }).then(resolve, reject);
            };
            return (...args) => {
                if (property === 'select') call.projection = args[0];
                if (property === 'single' || property === 'maybeSingle') call[property] = true;
                return query;
            };
        } });
        return query;
    } };
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const compiledModule = { exports: {} };
    const dependencies = {
        '@/lib/supabase': { supabase, isSupabaseConfigured: () => configured },
        '@supabase/supabase-js': { createClient: () => supabase },
        '@/lib/site': { SITE_URL: 'https://fixture.example' },
        '@/lib/news-url': { getNewsPath: id => '/news/' + id.slice(0, 8) },
        '@/lib/search-query': { ilikePattern: value => '%' + value + '%' },
        'next/navigation': { notFound() { throw new Error('NEXT_NOT_FOUND'); } },
        'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    };
    new Function('require', 'module', 'exports', 'process', 'console', outputText)(name => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        assert.ok(name.startsWith('@/components/'), 'unexpected dependency ' + name);
        return new Proxy({}, { get: (_target, component) => component });
    }, compiledModule, compiledModule.exports, { env: configured ? { NEXT_PUBLIC_SUPABASE_URL: 'fixture', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture' } : {} }, { error() {}, warn() {}, log() {} });
    return { calls, run: () => compiledModule.exports.default({ params: Promise.resolve({ slug: 'apple-vs-google' }) }) };
}
function component(view, name) {
    if (!view || typeof view !== 'object') return null;
    if (view.type === name) return view;
    const children = view.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
        const found = component(child, name); if (found) return found;
    }
    return null;
}
const quotaError = { code: 'exceed_egress_quota', message: 'fixture quota exhausted' };

test('homepage throws on configured DB failure rather than inventing fallback news', async () => {
    const h = fixture('src/app/page.tsx', { error: quotaError });
    await assert.rejects(h.run);
});

test('archive throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/archive/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('weekly throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/weekly/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('monthly throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/monthly/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('essentials throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/essentials/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('comparison index throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/compare/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('comparison detail throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/compare/[slug]/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('trends throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/trends/page.tsx', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

test('sitemap throws on configured DB failure instead of successful empty data', async () => {
    await assert.rejects(fixture('src/app/sitemap.ts', { error: quotaError }).run, error => error.message !== 'NEXT_NOT_FOUND');
});

const pages = [
    ['src/app/page.tsx', 'NewsFeed', 'initialItems'],
    ['src/app/archive/page.tsx', 'NewsFeed', 'initialItems'],
    ['src/app/weekly/page.tsx', 'WeeklyView', 'newsItems'],
    ['src/app/monthly/page.tsx', 'MonthlyView', 'newsItems'],
    ['src/app/essentials/page.tsx', 'EssentialsView', 'items'],
    ['src/app/compare/page.tsx', 'CompareList', 'comparisons'],
    ['src/app/trends/page.tsx', 'TrendsView', 'initialData'],
];
for (const [file, name, property] of pages) {
    test(file + ' keeps successful empty results and credential-free rendering distinct from DB failure', async () => {
        for (const configured of [true, false]) {
            const h = fixture(file, { configured });
            const result = component(await h.run(), name);
            assert.ok(result, name + ' still renders');
            assert.deepEqual(result.props[property], property === 'initialData' ? null : []);
            if (!configured) assert.equal(h.calls.length, 0, 'credential-free build never opens a DB query');
        }
    });
    test(file + ' propagates transport failures rather than replacing good ISR content', async () => {
        await assert.rejects(fixture(file, { rejected: true }).run, /fixture network outage/);
    });
}
for (const file of ['src/app/weekly/page.tsx', 'src/app/trends/page.tsx']) {
    test(file + ' distinguishes a missing weekly report from an actual report query error', async () => {
        const empty = fixture(file); await empty.run();
        const report = empty.calls.find(call => call.table === 'weekly_trends');
        assert.equal(report.maybeSingle, true); assert.equal(report.single, false);
        await assert.rejects(fixture(file, { error: quotaError, errorTable: 'weekly_trends' }).run);
    });
}
test('comparison detail keeps genuine no-results as 404 but propagates transport errors', async () => {
    for (const configured of [true, false]) {
        await assert.rejects(fixture('src/app/compare/[slug]/page.tsx', { configured }).run, /NEXT_NOT_FOUND/);
    }
    await assert.rejects(fixture('src/app/compare/[slug]/page.tsx', { rejected: true }).run, /fixture network outage/);
});
test('sitemap retains genuine empty/static and credential-free behavior without swallowing transport failures', async () => {
    const empty = fixture('src/app/sitemap.ts');
    assert.equal((await empty.run()).length, 3);
    const unconfigured = fixture('src/app/sitemap.ts', { configured: false });
    assert.deepEqual((await unconfigured.run()).map(entry => entry.url), ['https://fixture.example']);
    assert.equal(unconfigured.calls.length, 0);
    await assert.rejects(fixture('src/app/sitemap.ts', { rejected: true }).run, /fixture network outage/);
});
const publicNews = {
    id: 'abcdef12-1234-4234-9234-123456789abc', original_url: 'https://example.com/story',
    title: 'AI fixture headline', title_en: 'AI fixture headline', source: 'Fixture',
    published_at: '2026-10-21T00:00:00Z', summary_zh: 'AI test summary '.repeat(20), summary_en: 'Public summary',
    tags: ['AI'], click_count: 1, slug: 'fixture-story', created_at: '2026-10-21T00:00:00Z',
};
test('successful news remains readable and server lists request only public UI columns', async () => {
    for (const file of [...pages.map(([file]) => file), 'src/app/compare/[slug]/page.tsx']) {
        const h = fixture(file, { news: [publicNews] });
        const view = await h.run();
        assert.match(JSON.stringify(view), /AI fixture headline|apple|comparisons|initialData/);
        for (const call of h.calls.filter(call => call.table === 'news_items')) {
            const fields = call.projection.split(',').map(field => field.trim());
            assert.ok(!fields.includes('*'));
            assert.ok(!fields.includes('content'));
            assert.ok(!fields.includes('raw_content'));
            assert.ok(fields.includes('id'));
        }
    }
});
test('weekly reports and sitemap preserve successful content and canonical links', async () => {
    const trends = { title: 'Fixture weekly report', title_en: 'Fixture weekly report', core_message: 'Report core', trends: [], persona_advice: {} };
    for (const file of ['src/app/weekly/page.tsx', 'src/app/trends/page.tsx']) {
        assert.match(JSON.stringify(await fixture(file, { trends }).run()), /Fixture weekly report/);
    }
    const urls = await fixture('src/app/sitemap.ts', { news: [publicNews] }).run();
    assert.ok(urls.some(entry => entry.url === 'https://fixture.example/news/abcdef12'));
    assert.ok(urls.some(entry => entry.url === 'https://fixture.example/tags/AI'));
});
