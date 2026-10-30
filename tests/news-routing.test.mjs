import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { NextRequest, NextResponse } from 'next/server.js';

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
const tagRouting = load('src/lib/tag-routing.ts', { 'node:buffer': { Buffer } });

test('proxy keeps canonical/RSC paths and rewrites only single-segment legacy aliases', async () => {
    const calls = [];
    const { proxy, config } = load('src/proxy.ts', { 'next/server': { NextResponse }, '@/lib/tag-routing': tagRouting, '@/utils/supabase/middleware': {
        updateSession: (request, destination) => { calls.push({ request, destination }); return 'session-response'; },
    } });
    assert.ok(config.matcher.includes('/news/:path*'), 'asset-like news aliases bypass the general image exclusion');
    assert.ok(config.matcher.includes('/tags/:path*'));
    assert.ok(config.matcher.includes('/compare/:path*'));
    for (const path of ['/news/12345678?_rsc=test', '/tags/AI', '/news/test/extra']) {
        const request = new NextRequest('https://example.com' + path);
        assert.equal(await proxy(request), 'session-response');
        assert.equal(calls.at(-1).destination, undefined);
    }
    for (const id of ['12345678-1234-4234-9234-123456789abc', 'ABCDEF12', 'old-story', 'old-story.png', '%E8%88%8A%E6%96%B0%E8%81%9E']) {
        await proxy(new NextRequest('https://example.com/news/' + id + '?from=legacy'));
        assert.equal(calls.at(-1).destination.pathname, '/api/internal/news-alias/' + id);
        assert.equal(calls.at(-1).destination.search, '?from=legacy');
    }
});

test('percent topics rewrite to a safe distinct ISR prefix and preserve RSC/query', async () => {
    const calls = [];
    const { proxy } = load('src/proxy.ts', {
        'next/server': { NextResponse }, '@/lib/tag-routing': tagRouting,
        '@/utils/supabase/middleware': { updateSession: (request, destination) => calls.push({ request, destination }) },
    });
    for (const [route, literal] of [['tags', '100%'], ['tags', 'literal%20tag'], ['tags', '中文%tag.png'], ['compare', '100%-vs-AI']]) {
        const request = new NextRequest(`https://example.com/${route}/${encodeURIComponent(literal)}?_rsc=test`, { headers: { RSC: '1' } });
        await proxy(request);
        const { destination } = calls.at(-1);
        assert.equal(destination.pathname, `/internal/${route}/${Buffer.from(literal).toString('hex')}`);
        assert.equal(destination.search, '?_rsc=test');
        assert.equal(calls.at(-1).request.headers.get('rsc'), '1');
        await proxy(new NextRequest(destination));
        assert.equal(calls.at(-1).destination, undefined, 'the rewritten prefix cannot recursively rewrite');
    }
    for (const segment of ['AI', encodeURIComponent('中文'), 'tag.png']) {
        await proxy(new NextRequest(`https://example.com/tags/${segment}`));
        assert.equal(calls.at(-1).destination, undefined, 'ordinary tags keep their existing ISR route');
    }
    for (const path of ['/tags/100%', '/compare/%GG-vs-AI']) {
        const response = await proxy(new NextRequest('https://example.com' + path));
        assert.equal(response.status, 400);
        assert.match(response.headers.get('cache-control'), /no-store/);
    }
});

test('anonymous alias rewrite skips auth and preserves RSC request headers', async () => {
    const { updateSession } = load('src/utils/supabase/middleware.ts', {
        '@supabase/ssr': { createServerClient: () => assert.fail('anonymous request must not refresh auth') },
        'next/server': { NextResponse },
    });
    const request = new NextRequest('https://example.com/news/old-story', { headers: { RSC: '1' } });
    const response = await updateSession(request, new URL('https://example.com/api/internal/news-alias/old-story'));
    assert.equal(response.headers.get('x-middleware-rewrite'), 'https://example.com/api/internal/news-alias/old-story');
    assert.equal(response.headers.get('x-middleware-request-rsc'), '1');
    assert.equal(response.cookies.getAll().length, 0);
});

test('auth refresh preserves both alias rewrite and refreshed cookies on the response and request', async () => {
    let authCalls = 0;
    const { updateSession } = load('src/utils/supabase/middleware.ts', {
        '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: { async getUser() {
            authCalls++;
            options.cookies.setAll([{ name: 'sb-fixture-auth-token', value: 'refreshed', options: { path: '/', httpOnly: true } }]);
        } } }) },
        'next/server': { NextResponse },
    });
    const request = new NextRequest('https://example.com/news/old-story', {
        headers: { cookie: 'sb-fixture-auth-token=old', RSC: '1' },
    });
    const response = await updateSession(request, new URL('https://example.com/api/internal/news-alias/old-story'));
    assert.equal(authCalls, 1);
    assert.equal(response.headers.get('x-middleware-rewrite'), 'https://example.com/api/internal/news-alias/old-story');
    assert.equal(response.cookies.get('sb-fixture-auth-token').value, 'refreshed');
    assert.match(response.headers.get('x-middleware-request-cookie'), /sb-fixture-auth-token=refreshed/);
    assert.equal(response.headers.get('x-middleware-request-rsc'), '1');
});

test('uppercase UUID and short ID aliases return one lowercase 308 without database reads', async () => {
    const urls = load('src/lib/news-url.ts', {});
    const route = load('src/app/api/internal/news-alias/[id]/route.ts', {
        'next/cache': { unstable_cache: () => assert.fail('UUID and short ID need no lookup') },
        '@/lib/supabase': { isSupabaseConfigured: () => true, supabase: { from: () => assert.fail('no DB lookup') } },
        '@/lib/news-url': urls,
        '@/lib/news-alias-tag': { ALL_NEWS_ALIASES_TAG: 'all', newsAliasTag: () => 'alias' },
    });
    for (const id of ['ABCDEF12', 'ABCDEF12-1234-4234-9234-123456789ABC']) {
        const response = await route.GET(new Request('https://example.com/news/' + id), { params: Promise.resolve({ id }) });
        assert.equal(response.status, 308);
        assert.equal(response.headers.get('location'), '/news/abcdef12');
        assert.match(response.headers.get('cache-control'), /no-store/);
    }
});
