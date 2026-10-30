import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import RSS from 'rss';

function load(file, dependencies) {
    const { outputText } = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    const compiledModule = { exports: {} };
    const jsx = (type, props) => ({ type, props });
    new Function('require', 'module', 'exports', outputText)(name => {
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        if (name.startsWith('@/components/')) return new Proxy({}, { get: (_, key) => key });
        assert.fail('Unexpected dependency ' + name);
    }, compiledModule, compiledModule.exports);
    return compiledModule.exports;
}
const searchQuery = load('src/lib/search-query.ts', {});
const tagRouting = load('src/lib/tag-routing.ts', { 'node:buffer': { Buffer } });
test('comparison metadata accepts an already-decoded literal percent topic', async () => {
    const page = load('src/app/compare/[slug]/page.tsx', {
        '@/lib/supabase': {},
        '@/lib/search-query': searchQuery,
        'next/navigation': { notFound() { throw new Error('not found'); } },
    });
    const metadata = await page.generateMetadata({ params: Promise.resolve({ slug: '100%-vs-AI' }) });
    assert.ok(metadata.title.startsWith('100% vs AI'));
});
function database({ error = null, data = [] } = {}) {
    const observed = {};
    const builder = new Proxy({}, { get: (_target, method) => {
        if (method === 'then') return resolve => Promise.resolve({ data, error }).then(resolve);
        return (...args) => { observed[method] = args; return builder; };
    } });
    return { supabase: { from: () => builder }, observed };
}
function searchHarness(options) {
    const db = database(options);
    const page = load('src/app/search/page.tsx', { '@/lib/supabase': db, '@/lib/search-query': searchQuery });
    return { db, run: q => page.default({ searchParams: Promise.resolve({ q }) }) };
}
function findProps(node, key) {
    if (!node || typeof node !== 'object') return null;
    if (node.props && Object.hasOwn(node.props, key)) return node.props;
    for (const child of [node.props?.children].flat()) {
        const found = findProps(child, key); if (found) return found;
    }
    return null;
}

test('repeated search parameters use the first query instead of crashing', async () => {
    const h = searchHarness();
    const view = await h.run(['AI', 'Apple']);
    assert.equal(findProps(view, 'query').query, 'AI');
});
for (const [term, pattern] of [['100%', '%100\\%%'], ['a_b', '%a\\_b%'], ['C:\\docs', '%C:\\\\docs%']]) {
    test('search keeps display text and escapes SQL wildcards only once: ' + term, async () => {
        const h = searchHarness(); const view = await h.run(term);
        assert.equal(findProps(view, 'query').query, term);
        assert.equal(h.db.observed.or[0], `title.ilike.${pattern},summary_zh.ilike.${pattern},summary_en.ilike.${pattern}`);
    });
}
test('search database failure is an error, not a zero-result page', async () => {
    const h = searchHarness({ error: { message: 'fixture database unavailable' } });
    await assert.rejects(h.run('AI'), /Unable to search/);
});
test('a successful empty search remains a valid empty result', async () => {
    const h = searchHarness(); const view = await h.run('no-match');
    assert.deepEqual(findProps(view, 'items').items, []);
});

function tagHarness() {
    const db = database();
    const page = load('src/app/tags/[tag]/page.tsx', {
        '@/lib/supabase': { ...db, isSupabaseConfigured: () => true },
        '@/lib/site': { SITE_URL: 'https://example.com' },
        '@/lib/json-ld': { serializeJsonLd: JSON.stringify },
        'next/cache': { unstable_cache: fn => fn },
    });
    return { db, page };
}
for (const tag of ['100%', 'literal%20tag']) {
    test('tag params are used as decoded literals: ' + tag, async () => {
        const h = tagHarness(); const props = { params: Promise.resolve({ tag }) };
        const metadata = await h.page.generateMetadata(props);
        assert.equal(metadata.title, `${tag} News & Trends - Smart Flow`);
        assert.equal(metadata.alternates.canonical, '/tags/' + encodeURIComponent(tag));
        await h.page.default(props);
        assert.deepEqual(h.db.observed.contains, ['tags', [tag]]);
    });
}
test('opaque tag ISR adapter decodes hex once and reuses the literal public query/metadata', async () => {
    for (const tag of ['100%', 'literal%20tag', '中文%tag.png']) {
        const h = tagHarness();
        const adapter = load('src/app/internal/tags/[key]/page.tsx', {
            '@/app/tags/[tag]/page': h.page, '@/lib/tag-routing': tagRouting,
            'next/navigation': { notFound() { throw new Error('not found'); } },
        });
        const rewritten = tagRouting.getTagRewritePath(encodeURIComponent(tag));
        const props = { params: Promise.resolve({ key: rewritten.split('/').at(-1) }) };
        assert.equal(adapter.revalidate, 3600); assert.deepEqual(adapter.generateStaticParams(), []);
        const metadata = await adapter.generateMetadata(props);
        assert.equal(metadata.alternates.canonical, '/tags/' + encodeURIComponent(tag));
        await adapter.default(props);
        assert.deepEqual(h.db.observed.contains, ['tags', [tag]]);
    }
});
test('opaque routes reject non-percent, malformed hex and invalid UTF-8 keys', async () => {
    const adapter = load('src/app/internal/tags/[key]/page.tsx', {
        '@/app/tags/[tag]/page': { __esModule: true, default() { assert.fail('invalid key must not query'); } }, '@/lib/tag-routing': tagRouting,
        'next/navigation': { notFound() { throw new Error('not found'); } },
    });
    for (const key of ['', '2', 'FF25', 'ff25', 'c025', '4149']) {
        assert.equal(tagRouting.decodePercentRouteKey(key), null);
        await assert.rejects(adapter.default({ params: Promise.resolve({ key }) }), /not found/);
    }
});
test('opaque comparison ISR adapter passes the original slug and public canonical', async () => {
    const slug = '100%-vs-AI'; let observed;
    const adapter = load('src/app/internal/compare/[key]/page.tsx', {
        '@/app/compare/[slug]/page': { __esModule: true, default: async ({ params }) => { observed = await params; return 'view'; }, generateMetadata: async () => ({ title: 'comparison' }) },
        '@/lib/tag-routing': tagRouting, 'next/navigation': { notFound() { throw new Error('not found'); } },
    });
    const path = tagRouting.getComparisonRewritePath(encodeURIComponent(slug));
    const props = { params: Promise.resolve({ key: path.split('/').at(-1) }) };
    assert.equal(adapter.revalidate, 3600); assert.deepEqual(adapter.generateStaticParams(), []);
    assert.equal(await adapter.default(props), 'view'); assert.deepEqual(observed, { slug });
    assert.equal((await adapter.generateMetadata(props)).alternates.canonical, '/compare/' + encodeURIComponent(slug));
});
function feed(options) {
    return load('src/app/feed.xml/route.ts', {
        '@/lib/supabase': database(options), rss: RSS,
        '@/lib/site': { SITE_URL: 'https://example.com' },
        '@/lib/cache-control': { publicCacheHeaders: () => ({ 'Cache-Control': 'public, s-maxage=3600' }) },
    });
}
test('RSS database outage returns uncacheable 503 instead of an empty successful feed', async () => {
    const response = await feed({ error: { message: 'fixture outage' } }).GET();
    assert.equal(response.status, 503);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.ok(!response.headers.get('cache-control').includes('s-maxage'));
});
test('genuine empty RSS remains a successful feed', async () => {
    const response = await feed({ data: [] }).GET();
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<rss/);
});

test('English search remains readable when translation is unavailable', () => {
    const component = load('src/components/search-results-list.tsx', {
        './language-context': { useLanguage: () => ({ language: 'en', t: key => key }) },
        '@/hooks/use-batch-translation': { useBatchTranslation: items => items },
        '@/lib/markdown': { preprocessMarkdown: value => value },
        '@/lib/news-url': { getNewsPath: () => '/news/beefcafe' },
        'next/link': () => null, 'lucide-react': { Calendar: () => null },
    });
    const view = component.SearchResultsList({ items: [{ id: 'beefcafe', title: '仍可閱讀的原文', summary_zh: '原文摘要', source: 'fixture', published_at: '2026-10-21T00:00:00Z', original_url: 'https://example.com' }], query: 'AI' });
    assert.ok(JSON.stringify(view).includes('仍可閱讀的原文'));
    assert.ok(!JSON.stringify(view).includes('Translating...'));
});
