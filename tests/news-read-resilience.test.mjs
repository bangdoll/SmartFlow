import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

const article = { id: '12345678-1234-4234-9234-123456789abc', title: 'Fixture news', published_at: '2026-10-29T00:00:00Z', tags: [] };
function fixture(responses, timeoutMs) {
    const requests = [];
    const supabase = createClient('https://fixture.invalid', 'fixture-only', {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: async (url, options) => {
            requests.push({ url: String(url), signal: options.signal });
            const next = responses.shift();
            if (typeof next === 'function') return next(options);
            if (next instanceof Error) throw next;
            return new Response(JSON.stringify(next.body), { status: next.status, headers: { 'content-type': 'application/json' } });
        } },
    });
    function load(file) {
        const code = ts.transpileModule(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        }).outputText;
        const mod = { exports: {} };
        const deps = {
            '@/lib/supabase': { supabase, isSupabaseConfigured: () => true },
            react: { cache: fn => fn },
            'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
            'next/navigation': { notFound: () => { throw new Error('NEXT_NOT_FOUND'); } },
            '@/lib/site': { SITE_URL: 'https://fixture.invalid' },
            '@/lib/news-url': { getNewsPath: id => '/news/' + id.slice(0, 8) },
            '@/lib/json-ld': { serializeJsonLd: JSON.stringify },
            '@/components/news-content': { NewsContent: 'NewsContent' },
        };
        new Function('require', 'module', 'exports', 'AbortSignal', code)(name => {
            if (name === '@/lib/news-read-error') return load('src/lib/news-read-error.ts');
            assert.ok(Object.hasOwn(deps, name), 'unexpected dependency ' + name);
            return deps[name];
        }, mod, mod.exports, timeoutMs ? { timeout(ms) {
            assert.equal(ms, 8_000, 'production timeout is eight seconds');
            return AbortSignal.timeout(timeoutMs);
        } } : AbortSignal);
        return mod.exports;
    }
    const page = load('src/app/news/[id]/page.tsx');
    return { requests, page, params: { params: Promise.resolve({ id: '12345678' }) } };
}

test('canonical and adjacent news reads carry a bounded abort signal', async () => {
    const h = fixture([{ status: 200, body: [article] }, { status: 200, body: [] }, { status: 200, body: [] }]);
    await h.page.default(h.params);
    assert.equal(h.requests.length, 3);
    assert.ok(h.requests.every(r => r.signal instanceof AbortSignal), 'all reads must have a timeout');
});

test('database failure remains an error with safe code/status instead of hidden cause or cached 404', async () => {
    const h = fixture([{ status: 402, body: { code: 'exceed_egress_quota', message: 'Bearer private-fixture-secret', details: 'private database details' } }]);
    await assert.rejects(h.page.generateMetadata(h.params), e => {
        assert.match(e.message, /exceed_egress_quota/);
        assert.match(e.message, /402/);
        assert.doesNotMatch(e.message, /private|Bearer|NEXT_NOT_FOUND/);
        return true;
    });
    assert.equal(h.requests.length, 1, 'no automatic quota retry');
});

test('network failure distinguishes transport failure without disclosing upstream messages', async () => {
    const h = fixture([new TypeError('fetch failed: Bearer private-fixture-secret')]);
    await assert.rejects(h.page.generateMetadata(h.params), e => {
        assert.match(e.message, /transport/);
        assert.doesNotMatch(e.message, /Bearer|private-fixture-secret/);
        return true;
    });
});

test('genuine empty news remains not-found, while duplicate prefixes remain an error', async () => {
    const absent = fixture([{ status: 200, body: [] }]);
    await assert.rejects(absent.page.default(absent.params), /NEXT_NOT_FOUND/);
    const collision = fixture([{ status: 200, body: [article, { ...article, id: '12345678-ffff-ffff-ffff-ffffffffffff' }] }]);
    await assert.rejects(collision.page.generateMetadata(collision.params), /PGRST116/);
});

test('stalled reads abort once and propagate failure instead of caching missing data', async () => {
    const h = fixture([options => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
    })], 10);
    // AbortSignal.timeout uses an unref timer; keep this isolated fixture alive.
    const keepAlive = setTimeout(() => {}, 300);
    try {
        await assert.rejects(h.page.generateMetadata(h.params), /transport/);
        assert.equal(h.requests.length, 1);
        assert.equal(h.requests[0].signal.aborted, true);
    } finally { clearTimeout(keepAlive); }
});
