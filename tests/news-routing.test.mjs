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

test('proxy keeps canonical/RSC paths and rewrites only single-segment legacy aliases', async () => {
    const calls = [];
    const { proxy, config } = load('src/proxy.ts', { '@/utils/supabase/middleware': {
        updateSession: (request, destination) => { calls.push({ request, destination }); return 'session-response'; },
    } });
    assert.ok(config.matcher.includes('/news/:path*'), 'asset-like news aliases bypass the general image exclusion');
    for (const path of ['/news/12345678?_rsc=test', '/news/ABCDEF12', '/tags/AI', '/news/test/extra']) {
        const request = new NextRequest('https://example.com' + path);
        assert.equal(await proxy(request), 'session-response');
        assert.equal(calls.at(-1).destination, undefined);
    }
    for (const id of ['12345678-1234-4234-9234-123456789abc', 'old-story', 'old-story.png', '%E8%88%8A%E6%96%B0%E8%81%9E']) {
        await proxy(new NextRequest('https://example.com/news/' + id + '?from=legacy'));
        assert.equal(calls.at(-1).destination.pathname, '/api/internal/news-alias/' + id);
        assert.equal(calls.at(-1).destination.search, '?from=legacy');
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
