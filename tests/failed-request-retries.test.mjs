import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Render the actual components/hooks with deterministic React effects and a
// continuously intersecting sentinel. Only browser/network I/O is replaced.
function harness(kind, { outcome = '503', language: initialLanguage = 'zh-TW', initialTag, initialItems, exposeDormantSortControl = false } = {}) {
    const slots = [], effects = [], observers = new Set(), listeners = new Map(), requests = [], timers = new Map();
    let cursor = 0, dirty = false, language = initialLanguage, view, timerId = 0, refCallbacks = [];
    let items = initialItems || [article('first')];
    const t = value => value;
    const changed = (before, after) => !before || after.some((value, index) => !Object.is(value, before[index]));
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
            return [slots[index], value => {
                const next = typeof value === 'function' ? value(slots[index]) : value;
                if (!Object.is(slots[index], next)) { slots[index] = next; dirty = true; }
            }];
        },
        useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
        useMemo(factory, deps) {
            const index = cursor++;
            if (changed(slots[index]?.deps, deps)) slots[index] = { deps, value: factory() };
            return slots[index].value;
        },
        useCallback(callback, deps) { return hooks.useMemo(() => callback, deps); },
        useEffect(effect, deps) {
            const index = cursor++;
            if (changed(slots[index]?.deps, deps)) {
                const previous = slots[index]; slots[index] = { deps };
                effects.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect(); });
            }
        },
    };
    const jsx = (type, props) => ({ type, props });
    const document = {
        addEventListener(type, handler) { (listeners.get(type) || listeners.set(type, new Set()).get(type)).add(handler); },
        removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
    };
    class IntersectionObserver {
        constructor(callback) { this.callback = callback; this.active = false; observers.add(this); }
        observe() { this.active = true; }
        disconnect() { this.active = false; }
    }
    const paths = { feed: 'src/components/news-feed.tsx', batch: 'src/hooks/use-batch-translation.ts', hot: 'src/components/hot-news.tsx' };
    let source = readFileSync(new URL('../' + paths[kind], import.meta.url), 'utf8');
    // The product's Popular sort button remains disabled. Expose its existing
    // click callback only in this isolated fixture to cover the dormant branch.
    if (kind === 'feed' && exposeDormantSortControl) {
        source = source.replace(/\{\/\* Sort by Popular temporarily disabled([\s\S]*?)\*\/\}/,
            (_match, button) => button);
    }
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const compiledModule = { exports: {} };
    const dependencies = {
        react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        '@/components/language-context': { useLanguage: () => ({ language, t }) },
        './language-context': { useLanguage: () => ({ language, t }) },
        'next/navigation': { useRouter: () => ({ push() {} }) },
        '@/lib/markdown': { preprocessMarkdown: value => value },
        '@/lib/news-url': { getNewsPath: id => '/news/' + id },
        '@/hooks/use-batch-translation': { useBatchTranslation: value => value },
    };
    let responseOutcome = outcome;
    const fetch = async (url, options) => {
        requests.push({ url, options });
        if (responseOutcome === 'offline') throw new Error('fixture offline');
        if (responseOutcome === '503') return { ok: false, json: async () => ({ error: 'fixture unavailable' }) };
        if (responseOutcome === 'empty') return { ok: true, json: async () => ({ results: [] }) };
        const payload = typeof responseOutcome === 'function' ? responseOutcome(url, options) : responseOutcome;
        return { ok: true, json: async () => payload };
    };
    if (kind === 'hot') {
        const hookSource = readFileSync(new URL('../src/hooks/use-batch-translation.ts', import.meta.url), 'utf8');
        const hookModule = { exports: {} };
        const hookCode = ts.transpileModule(hookSource, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText;
        new Function('require', 'module', 'exports', 'fetch', 'console', hookCode)(name => {
            assert.ok(Object.hasOwn(dependencies, name), 'unexpected hook dependency ' + name);
            return dependencies[name];
        }, hookModule, hookModule.exports, fetch, { error() {} });
        dependencies['@/hooks/use-batch-translation'] = hookModule.exports;
    }
    new Function('require', 'module', 'exports', 'fetch', 'console', 'document', 'window', 'localStorage', 'IntersectionObserver', 'setTimeout', 'clearTimeout', outputText)(name => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        // Presentation imports are represented as inert JSX element types.
        return new Proxy(() => null, { get: () => () => null });
    }, compiledModule, compiledModule.exports, fetch, { error() {} }, document, { scrollY: 0 },
    { getItem: () => null, setItem() {} }, IntersectionObserver,
    (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; }, id => timers.delete(id));
    const walk = (node, visit) => {
        if (Array.isArray(node)) { node.forEach(child => walk(child, visit)); return; }
        if (node && typeof node === 'object' && node.props) { visit(node); walk(node.props.children, visit); }
    };
    const api = {
        requests, view: () => view,
        text() { const values = []; const collect = value => {
            if (Array.isArray(value)) value.forEach(collect);
            else if (typeof value === 'string') values.push(value);
            else if (value?.props) collect(value.props.children);
        }; collect(view); return values.join(' '); },
        language(value) { language = value; }, items(value) { items = value; }, tag(value) { initialTag = value; },
        outcome(value) { responseOutcome = value; },
        async event(type, event) { for (const handler of listeners.get(type) || []) await handler(event); },
        runTimers(delay) { for (const [id, timer] of timers) if (timer.delay === delay) { timers.delete(id); timer.callback(); } },
        async popular() {
            let button; walk(view, node => { if (node.type === 'button' && String(node.props.children).includes('home.sortPopular')) button = node; });
            assert.ok(button, 'isolated fixture exposes the existing dormant sort action');
            button.props.onClick(); await api.settle();
        },
        async retry() {
            let button; walk(view, node => { if (node.type === 'button' && /重試|Retry/.test(String(node.props.children))) button = node; });
            assert.ok(button, 'failure offers a deliberate retry button');
            await button.props.onClick(); await api.settle();
        },
        async settle() {
            for (let i = 0; i < 20; i++) {
                dirty = false; cursor = 0;
                view = kind === 'feed' ? compiledModule.exports.NewsFeed({ initialItems: items, initialTag })
                    : kind === 'batch' ? compiledModule.exports.useBatchTranslation(items)
                    : compiledModule.exports.HotNewsSection({ items });
                refCallbacks.forEach(ref => ref(null)); refCallbacks = [];
                walk(view, node => { if (typeof node.props.ref === 'function') refCallbacks.push(node.props.ref); });
                refCallbacks.forEach(ref => ref({}));
                for (const effect of effects.splice(0)) effect();
                // An observer emits once when observation starts, as browsers do
                // when a reattached sentinel is still in the viewport.
                for (const observer of observers) if (observer.active) {
                    observer.active = false; observer.callback([{ isIntersecting: true }]);
                }
                await new Promise(resolve => setImmediate(resolve));
                if (!dirty) return;
            }
            assert.fail('component did not settle after 20 renders; requests=' + requests.length);
        },
    };
    return api;
}
function article(id) { return { id, title: '新聞 ' + id, source: 'fixture', published_at: '2026-10-21T00:00:00Z', summary_zh: '摘要', original_url: 'https://example.com/' + id, tags: ['AI', 'Apple'] }; }

for (const outcome of ['503', 'offline']) {
    test('intersecting feed stops after ' + outcome + ' and requires deliberate retry', async () => {
        const h = harness('feed', { outcome }); await h.settle();
        assert.equal(h.requests.length, 1);
        assert.match(h.text(), /無法載入|Unable to load/);
        assert.doesNotMatch(h.text(), /home.noMore|feed.noResults|feed.empty/);
        await h.settle(); assert.equal(h.requests.length, 1, 'rerender does not retry an unavailable API');
        await h.retry(); assert.equal(h.requests.length, 2, 'one click permits exactly one failed retry');
        h.outcome([article('second')]); await h.retry();
        assert.equal(h.requests.length, 3); assert.match(h.text(), /新聞 second/);
        assert.doesNotMatch(h.text(), /無法載入|Unable to load/);
    });
}
test('tag changes recover from feed error and fetch the new tag', async () => {
    const h = harness('feed', { outcome: '503', initialTag: 'AI' }); await h.settle();
    h.outcome([]); h.tag('Apple'); await h.settle();
    assert.equal(h.requests.length, 2); assert.match(h.requests[1].url, /tag=Apple/);
    assert.doesNotMatch(h.text(), /無法載入|Unable to load/);
});
test('empty tag feed failure stays an error instead of displaying no results', async () => {
    const h = harness('feed', { outcome: '503', initialItems: [], initialTag: 'AI' }); await h.settle();
    assert.equal(h.requests.length, 1); assert.doesNotMatch(h.text(), /feed.noResults|feed.empty|home.noMore/);
    h.outcome([article('recovered')]); await h.retry(); assert.match(h.text(), /新聞 recovered/);
});
test('pull refresh non-2xx changes checking to an error', async () => {
    const h = harness('feed', { outcome: [] }); await h.settle();
    h.outcome('503'); await h.event('touchstart', { touches: [{ clientY: 0 }] }); await h.settle();
    await h.event('touchmove', { touches: [{ clientY: 150 }] }); await h.settle();
    await h.event('touchend', {}); await h.settle();
    assert.match(h.text(), /feed.toast.error/); assert.doesNotMatch(h.text(), /feed.toast.checking/);
    h.runTimers(500); await h.settle();
});
test('feed remains readable when an article has no English translation', async () => {
    const h = harness('feed', { language: 'en', outcome: [] }); await h.settle();
    assert.match(h.text(), /新聞 first/);
    assert.match(h.text(), /摘要/);
});
for (const kind of ['batch', 'hot']) {
    for (const outcome of ['503', 'offline', 'empty']) {
        test(kind + ' attempts each missing translation only once per mount after ' + outcome, async () => {
            const h = harness(kind, { outcome, language: 'en' }); await h.settle(); assert.equal(h.requests.length, 1);
            if (kind === 'hot') assert.match(h.text(), /新聞 first/, 'unavailable English keeps the original article readable');
            h.items([article('first')]); await h.settle();
            h.language('zh-TW'); await h.settle(); h.language('en'); await h.settle();
            assert.equal(h.requests.length, 1, 'language and fresh array do not restart a failed/empty request');
            h.items([article('first'), article('new')]); await h.settle(); assert.equal(h.requests.length, 2);
            assert.deepEqual(JSON.parse(h.requests[1].options.body).ids, ['new']);
        });
    }
    test(kind + ' merges successful translation without another provider request', async () => {
        const h = harness(kind, { language: 'en', outcome: { results: [{ id: 'first', title_en: 'Translated title', summary_en: 'Translated summary' }] } });
        await h.settle(); assert.equal(h.requests.length, 1); assert.match(JSON.stringify(h.view()), /Translated title/);
        h.items([article('first')]); await h.settle(); assert.equal(h.requests.length, 1);
    });
}

function deferredResponse() {
    let resolve, reject;
    const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
    return { promise, resolve, reject };
}
test('a new tag starts its own request while the old tag waits, and ignores its late failure', async () => {
    const old = deferredResponse();
    const h = harness('feed', { initialItems: [], initialTag: 'AI', outcome: () => old.promise });
    await h.settle(); assert.equal(h.requests.length, 1);
    h.outcome([]); h.tag('Apple'); await h.settle();
    old.reject(new Error('old AI request failed')); await h.settle();
    assert.equal(h.requests.length, 2, 'new filter is not blocked by the old loading flag');
    assert.match(h.requests[1].url, /tag=Apple/);
    assert.doesNotMatch(h.text(), /無法載入|Unable to load/);
});

for (const oldOutcome of ['success', 'failure']) {
    test('old tag ' + oldOutcome + ' and finally cannot finish the current tag loading state', async () => {
        const old = deferredResponse(), current = deferredResponse();
        const h = harness('feed', { initialItems: [], initialTag: 'AI', outcome: () => old.promise });
        await h.settle();
        h.outcome(() => current.promise); h.tag('Apple'); await h.settle();
        assert.equal(h.requests.length, 2, 'each tag owns its loading flag');
        if (oldOutcome === 'success') old.resolve([article('obsolete-AI')]);
        else old.reject(new Error('obsolete request failed'));
        await h.settle();
        assert.match(h.text(), /home.loading/, 'old finally cannot clear current loading');
        assert.doesNotMatch(h.text(), /obsolete-AI|無法載入|Unable to load/);
        assert.equal(h.requests.length, 2, 'old finally cannot unlock an extra observer request');
        current.resolve([article('current-Apple')]); await h.settle();
        assert.match(h.text(), /current-Apple/); assert.doesNotMatch(h.text(), /obsolete-AI|home.loading/);
        assert.equal(h.requests.length, 2);
    });
}

test('obsolete success cannot unlock the current failure latch or hide its retry button', async () => {
    const old = deferredResponse();
    const h = harness('feed', { initialItems: [], initialTag: 'AI', outcome: () => old.promise });
    await h.settle(); h.outcome('503'); h.tag('Apple'); await h.settle();
    assert.equal(h.requests.length, 2); assert.match(h.text(), /無法載入|Unable to load/);
    old.resolve(Array.from({ length: 10 }, (_, i) => article('obsolete-' + i))); await h.settle();
    assert.match(h.text(), /無法載入|Unable to load/); assert.doesNotMatch(h.text(), /obsolete-/);
    assert.equal(h.requests.length, 2);
    h.outcome([article('current-retry')]); await h.retry();
    assert.equal(h.requests.length, 3); assert.match(h.requests[2].url, /tag=Apple/);
    assert.match(h.text(), /current-retry/); assert.doesNotMatch(h.text(), /無法載入|Unable to load/);
});

for (const oldOutcome of ['success', 'failure']) {
    test('sort transition isolates obsolete ' + oldOutcome + ' without enabling product sorting', async () => {
        const old = deferredResponse(), current = deferredResponse();
        const h = harness('feed', { initialItems: [], initialTag: 'AI', outcome: () => old.promise, exposeDormantSortControl: true });
        await h.settle(); h.outcome(() => current.promise); await h.popular();
        assert.equal(h.requests.length, 2, 'new order is independent of previous loading');
        if (oldOutcome === 'success') old.resolve([article('old-order')]);
        else old.reject(new Error('old order unavailable'));
        await h.settle();
        assert.match(h.text(), /home.loading/); assert.doesNotMatch(h.text(), /old-order|無法載入|Unable to load/);
        assert.equal(h.requests.length, 2);
        current.resolve([article('current-order')]); await h.settle();
        assert.match(h.text(), /current-order/); assert.doesNotMatch(h.text(), /old-order|home.loading/);
    });
}

test('A -> B -> A does not accept a response from the first A request', async () => {
    const firstA = deferredResponse(), secondA = deferredResponse();
    const h = harness('feed', { initialItems: [], initialTag: 'AI', outcome: () => firstA.promise });
    await h.settle(); h.outcome([]); h.tag('Apple'); await h.settle();
    h.outcome(() => secondA.promise); h.tag('AI'); await h.settle();
    assert.equal(h.requests.length, 3);
    firstA.resolve([article('first-A')]); await h.settle();
    assert.match(h.text(), /home.loading/); assert.doesNotMatch(h.text(), /first-A/);
    secondA.resolve([article('second-A')]); await h.settle();
    assert.match(h.text(), /second-A/); assert.doesNotMatch(h.text(), /first-A/);
});
