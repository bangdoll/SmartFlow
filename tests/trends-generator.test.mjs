import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { z } from 'zod';

// Compile the real weekly module, replacing all external I/O. No keys or paid calls.
function harness({ items = [], fetchError = null, llmError = null } = {}) {
    const calls = [];
    const reads = [];
    const output = {
        title: '本週趨勢', title_en: 'Weekly trends', core_message: '核心訊號',
        core_message_en: 'Core signal', trends: [{ tag: 'AI', count: 1, title: '趨勢', desc: '背景', signal: '訊號' }],
        persona_advice: { general: '一般', employee: '員工', boss: '主管' },
        persona_advice_en: { general: 'General', employee: 'Employee', boss: 'Boss' },
    };
    const dependencies = {
        '@ai-sdk/openai': { openai: model => model },
        ai: { generateObject: async request => {
            calls.push(request);
            if (llmError) throw llmError;
            return { object: request.schema.parse(output) };
        } },
        zod: { z },
        '@/lib/supabase': { supabaseAdmin: { from(table) {
            reads.push(table);
            return {
                select(columns) { reads.push(columns); return this; },
                gte(column, since) { assert.equal(column, 'published_at'); assert.ok(Number.isFinite(Date.parse(since))); return this; },
                async limit(limit) { assert.equal(limit, 200); return { data: items, error: fetchError }; },
            };
        } } },
        './mental-models': { MENTAL_MODELS: [{ title: '模型', desc: '分析框架' }] },
    };
    const source = readFileSync(new URL('../src/lib/trends-generator.ts', import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const compiled = { exports: {} };
    new Function('require', 'module', 'exports', 'console', outputText)(name => {
        assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
        return dependencies[name];
    }, compiled, compiled.exports, { error() {} });
    return { service: compiled.exports, calls, reads, output };
}

function assertStringsWellFormed(value) {
    if (typeof value === 'string') assert.equal(value.isWellFormed(), true);
    else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
            assert.equal(key.isWellFormed(), true);
            assertStringsWellFormed(item);
        }
    }
}

for (const [name, summary, expected] of [
    ['emoji straddles index 199/200', '中'.repeat(199) + '💡後文', '中'.repeat(199)],
    ['emoji fits exactly', '中'.repeat(198) + '💡後文', '中'.repeat(198) + '💡'],
    ['BMP stays within original budget', '中'.repeat(201), '中'.repeat(200)],
    ['short summary remains intact', '簡短💡摘要', '簡短💡摘要'],
]) {
    test(name, async () => {
        const h = harness({ items: [{ title: '新聞💡', tags: ['AI'], summary_zh: summary }] });
        assert.deepEqual(await h.service.generateWeeklyTrends(), h.output);
        assert.equal(h.calls.length, 1);
        const request = h.calls[0];
        assert.equal(request.model, 'gpt-4o');
        const excerpt = request.prompt.match(/Summary: (.*?)\.\.\./s)[1];
        assert.equal(excerpt, expected);
        assert.ok(excerpt.length <= 200);
        assertStringsWellFormed({ model: request.model, prompt: request.prompt });
        assertStringsWellFormed(JSON.parse(JSON.stringify({ prompt: request.prompt })));
        assert.match(request.prompt, /Tags: AI/);
    });
}

test('empty or failed database reads do not call LLM', async () => {
    for (const options of [{ items: [] }, { items: null }, { fetchError: new Error('read failed') }]) {
        const h = harness(options);
        assert.equal(await h.service.generateWeeklyTrends(), null);
        assert.equal(h.calls.length, 0);
    }
});

test('LLM failure propagates to caller', async () => {
    const error = new Error('LLM failed');
    const h = harness({ items: [{ title: 'News', summary_zh: null, tags: null }], llmError: error });
    await assert.rejects(h.service.generateWeeklyTrends(), actual => actual === error);
    assert.equal(h.calls.length, 1);
    assertStringsWellFormed(h.calls[0].prompt);
});
