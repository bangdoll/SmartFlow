import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Exercise the actual component's state/effect cycle without a browser, network
// or paid translation. The 20-render ceiling detects the old retry loop.
function harness({ status = 200, translated = {}, reject = false } = {}) {
    const slots = [], effects = [];
    let cursor = 0, dirty = false, calls = 0, language = 'en', view;
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = initial;
            return [slots[index], value => { if (!Object.is(slots[index], value)) { slots[index] = value; dirty = true; } }];
        },
        useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
        useEffect(effect, deps) {
            const index = cursor++, previous = slots[index];
            if (!previous || deps.some((value, i) => !Object.is(value, previous[i]))) effects.push(effect);
            slots[index] = deps;
        },
    };
    const source = readFileSync(new URL('../src/components/news-content.tsx', import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const compiledModule = { exports: {} };
    const jsx = (type, props) => ({ type, props });
    const dependencies = {
        react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        '@/components/language-context': { useLanguage: () => ({ language, t: value => value }) },
        '@/lib/markdown': { preprocessMarkdown: value => value },
        '@/lib/news-url': { getNewsPath: id => '/news/' + id },
    };
    new Function('require', 'module', 'exports', 'fetch', 'console', outputText)(name => {
        if (dependencies[name]) return dependencies[name];
        // Other imports are presentation components, never executed here.
        return new Proxy(() => null, { get: () => () => null });
    }, compiledModule, compiledModule.exports, async (url, options) => {
        calls++; assert.equal(url, '/api/translate'); assert.equal(options.method, 'POST');
        if (reject) throw new Error('fixture offline');
        return { ok: status === 200, json: async () => translated };
    }, { error() {} });
    const item = { id: 'test-news', title: '中文標題', summary_zh: '中文摘要', source: 'fixture', published_at: '2026-10-18T00:00:00Z', original_url: 'https://example.com' };
    return { item, calls: () => calls, view: () => JSON.stringify(view), language(value) { language = value; },
        async settle() {
            for (let i = 0; i < 20; i++) {
                dirty = false; cursor = 0;
                view = compiledModule.exports.NewsContent({ item, prev: null, next: null });
                for (const effect of effects.splice(0)) effect();
                await new Promise(resolve => setImmediate(resolve));
                if (!dirty) return;
            }
            assert.fail('translation effect did not settle after 20 renders');
        },
    };
}
for (const options of [{ status: 503 }, { status: 429 }, { reject: true }, { translated: {} }]) {
    test('failed/empty translation settles without automatic retries: ' + JSON.stringify(options), async () => {
        const h = harness(options); await h.settle(); assert.equal(h.calls(), 1);
        h.language('zh-TW'); await h.settle(); h.language('en'); await h.settle();
        assert.equal(h.calls(), 1, 'language toggles do not restart failed requests');
    });
}
test('successful translation is reused, and revalidated server props replace stale local text', async () => {
    const h = harness({ translated: { title_en: 'First translation', summary_en: 'First summary' } });
    await h.settle(); assert.equal(h.calls(), 1); assert.match(h.view(), /First translation/);
    h.item.title_en = 'Revalidated translation'; h.item.summary_en = 'Revalidated summary';
    await h.settle(); assert.match(h.view(), /Revalidated translation/); assert.equal(h.calls(), 1);
});
