import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { NextRequest, NextResponse } from 'next/server.js';
import { z } from 'zod';

function load(file, dependencies) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const compiledModule = { exports: {} };
    new Function('require', 'module', 'exports', outputText)(name => {
        assert.ok(Object.hasOwn(dependencies, name), 'unexpected dependency ' + name);
        return dependencies[name];
    }, compiledModule, compiledModule.exports);
    return compiledModule.exports;
}
const urls = load('src/lib/news-url.ts', {});
const id = '12345678-1234-4234-9234-123456789abc';
function harness(neighbours = [], fail = false) {
    const paths = [], queries = [], tags = [];
    const supabase = { from(table) {
        assert.equal(table, 'news_items');
        const query = { table }; queries.push(query);
        const builder = {
            select(value) { query.select = value; return this; },
            lt(field, value) { query.lt = [field, value]; return this; },
            gt(field, value) { query.gt = [field, value]; return this; },
            order(field, value) { query.order = [field, value]; return this; },
            limit(value) { query.limit = value; return this; },
            abortSignal(signal) { assert.ok(signal instanceof AbortSignal); return this; },
            async maybeSingle() { return fail ? { data: null, error: { message: 'fixture failure' } } : { data: neighbours[queries.indexOf(query)] || null, error: null }; },
        };
        return builder;
    } };
    const cache = load('src/lib/news-cache.ts', {
        'next/cache': { revalidatePath: (...args) => paths.push(args), revalidateTag: (...args) => tags.push(args) },
        '@/lib/news-alias-tag': { ALL_NEWS_ALIASES_TAG: 'news-aliases', newsAliasTag: slug => 'alias:' + slug },
        '@/lib/news-url': urls, '@/lib/supabase': { supabaseAdmin: supabase },
    });
    return { cache, paths, queries, tags };
}
test('an update invalidates canonical HTML/RSC without clearing other articles', () => {
    const h = harness(); h.cache.invalidateNewsItem(id);
    assert.deepEqual(h.paths, [['/news/12345678']]);
    assert.equal(h.queries.length, 0);
    assert.deepEqual(h.tags, []);
});
test('alias paths are encoded and invalidated with their canonical path', () => {
    const h = harness(); h.cache.invalidateNewsItem(id, 'old article/slug');
    assert.deepEqual(h.paths, [['/news/12345678'], ['/news/old%20article%2Fslug']]);
    assert.deepEqual(h.tags, [['alias:old article/slug', { expire: 0 }]]);
});
test('inserting invalidates only the new article and immediate older/newer neighbours', async () => {
    const h = harness([{ id: '22222222-1234-1234-1234-123456789abc' }, { id: '33333333-1234-1234-1234-123456789abc' }]);
    await h.cache.invalidateInsertedNews({ id, slug: 'new-story', published_at: '2026-10-18T00:00:00Z' });
    assert.deepEqual(h.paths, [['/news/12345678'], ['/news/new-story'], ['/news/22222222'], ['/news/33333333']]);
    assert.ok(h.queries.every(q => q.select === 'id' && q.limit === 1));
    assert.deepEqual(h.queries[0].order, ['published_at', { ascending: false }]);
    assert.deepEqual(h.queries[1].order, ['published_at', { ascending: true }]);
});
test('a missing date does not trigger an unbounded neighbour query', async () => {
    const h = harness(); await h.cache.invalidateInsertedNews({ id });
    assert.equal(h.queries.length, 0);
});
test('a neighbour lookup failure retains direct invalidation and TTL fallback', async () => {
    const h = harness([], true);
    await h.cache.invalidateInsertedNews({ id, published_at: '2026-10-18T00:00:00Z' });
    assert.deepEqual(h.paths, [['/news/12345678']]);
});
test('only the delete-all operation invalidates every news route', () => {
    const h = harness(); h.cache.invalidateAllNews();
    assert.deepEqual(h.paths, [['/news/[id]', 'page']]);
    assert.deepEqual(h.tags, [['news-aliases', { expire: 0 }]]);
});

function maintenanceRoute(authorized) {
    const calls = [];
    const route = load('src/app/api/cron/revalidate-news/route.ts', {
        'next/server': { NextResponse }, zod: { z },
        '@/lib/api-auth': { hasMaintenanceAuth: () => authorized },
        '@/lib/news-cache': { invalidateNewsItem: (...args) => calls.push(args) },
    });
    return { calls, async post(body) {
        return route.POST(new NextRequest('http://localhost/api/cron/revalidate-news', {
            method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
        }));
    } };
}
test('maintenance invalidation rejects unauthorized requests before parsing', async () => {
    const h = maintenanceRoute(false);
    assert.equal((await h.post('not json')).status, 401); assert.deepEqual(h.calls, []);
});
test('maintenance accepts bounded exact articles and returns an uncacheable response', async () => {
    const h = maintenanceRoute(true);
    const response = await h.post({ items: [{ id, slug: 'old-story' }] });
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { revalidated: 1 });
    assert.deepEqual(h.calls, [[id, 'old-story']]); assert.match(response.headers.get('cache-control'), /no-store/);
});
test('maintenance rejects malformed, oversized and wildcard purge inputs', async () => {
    for (const body of ['not json', { items: [] }, { items: [{ id: '/news/[id]' }] }, { items: Array(51).fill({ id }) }, { items: [{ id, all: true }] }, { items: [{ id }], all: true }]) {
        const h = maintenanceRoute(true); assert.equal((await h.post(body)).status, 400); assert.deepEqual(h.calls, []);
    }
});
