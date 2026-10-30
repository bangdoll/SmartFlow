import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { NextRequest, NextResponse } from 'next/server.js';
import { z } from 'zod';

function harness({ writeError = null, existing = false, empty = false } = {}) {
    const id = '12345678-1234-4234-9234-123456789abc';
    const events = [];
    const source = readFileSync(new URL('../src/app/api/translate/route.ts', import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    const dependencies = {
        'next/server': { NextResponse }, zod: { z },
        '@/lib/rate-limit': { rateLimit: () => null },
        '@/lib/news-cache': { invalidateNewsItem: value => events.push(['invalidate', value]) },
        '@/lib/supabase': { supabaseAdmin: { from() {
            let update;
            return {
                select() { return this; }, update(value) { update = value; return this; },
                eq(_field, value) {
                    assert.equal(value, id);
                    if (!update) return this;
                    events.push(['write', update]); return Promise.resolve({ error: writeError });
                },
                async single() { return { error: null, data: {
                    id, title: '中文標題', summary_zh: '中文摘要',
                    title_en: existing ? 'Saved title' : null, summary_en: existing ? 'Saved summary' : null,
                } }; },
            };
        } } },
        openai: class { chat = { completions: { create: async () => {
            events.push(['translate']);
            return { choices: [{ message: { content: empty ? '' : 'Fixture translation' } }] };
        } } }; },
    };
    const compiledModule = { exports: {} };
    new Function('require', 'module', 'exports', 'process', 'console', outputText)(name => {
        assert.ok(Object.hasOwn(dependencies, name), 'unexpected dependency ' + name);
        return dependencies[name];
    }, compiledModule, compiledModule.exports, { env: { OPENAI_API_KEY: 'test-only-never-sent' } }, { error() {} });
    return { id, events, post: () => compiledModule.exports.POST(new NextRequest('http://localhost/api/translate', {
        method: 'POST', body: JSON.stringify({ newsId: id }), headers: { 'content-type': 'application/json' },
    })) };
}
test('translation invalidates only after a successful database write', async () => {
    const h = harness(); const response = await h.post();
    assert.equal(response.status, 200);
    assert.deepEqual(h.events.map(event => event[0]), ['translate', 'translate', 'write', 'invalidate']);
    assert.deepEqual(h.events.at(-1), ['invalidate', h.id]);
});
test('failed translation writes return retryable error without invalidating the public page', async () => {
    const h = harness({ writeError: { message: 'fixture DB failure' } });
    assert.equal((await h.post()).status, 503);
    assert.ok(h.events.some(event => event[0] === 'write'));
    assert.ok(!h.events.some(event => event[0] === 'invalidate'));
});
test('existing translations do not call a paid provider, write or invalidate', async () => {
    const h = harness({ existing: true }); const response = await h.post();
    assert.equal(response.status, 200); assert.equal((await response.json()).title_en, 'Saved title');
    assert.deepEqual(h.events, []);
});
test('empty provider output does not write or invalidate', async () => {
    const h = harness({ empty: true }); assert.equal((await h.post()).status, 200);
    assert.deepEqual(h.events.map(event => event[0]), ['translate', 'translate']);
});
