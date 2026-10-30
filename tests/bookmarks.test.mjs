import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Exercise the public context across commits, including effect cleanup. No
// database, browser profile, production credentials or React internals are used.
function harness({ user: initialUser = { id: 'A' }, saved = null } = {}) {
    let user = initialUser, authLoading = false, cursor = 0, dirty = false, view;
    const slots = [], pendingEffects = [], reads = [], writes = [];
    const storage = new Map(saved === null ? [] : [['sf_bookmarks', saved]]);
    const hooks = {
        createContext: () => ({ Provider: 'provider' }),
        useContext: () => null,
        useState(initial) {
            const i = cursor++;
            if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
            return [slots[i], update => {
                const value = typeof update === 'function' ? update(slots[i]) : update;
                if (!Object.is(value, slots[i])) { slots[i] = value; dirty = true; }
            }];
        },
        useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
        useMemo(fn, deps) {
            const i = cursor++, previous = slots[i];
            if (!previous || deps.some((value, j) => !Object.is(value, previous.deps[j]))) slots[i] = { value: fn(), deps };
            return slots[i].value;
        },
        useEffect(effect, deps) {
            const i = cursor++, previous = slots[i];
            if (!previous || deps.some((value, j) => !Object.is(value, previous.deps[j]))) {
                const current = { deps, cleanup: previous?.cleanup };
                slots[i] = current;
                pendingEffects.push(() => {
                    previous?.cleanup?.();
                    current.cleanup = effect();
                });
            }
        },
    };
    function deferred(kind, details) {
        let resolve;
        const promise = new Promise(done => { resolve = done; });
        const request = { kind, ...details, resolve };
        (kind === 'read' ? reads : writes).push(request);
        return promise;
    }
    const client = { from(table) {
        const filters = [];
        const query = {
            select() { return query; },
            eq(field, value) { filters.push([field, value]); return query; },
            order() { return deferred('read', { table, filters }); },
            insert(data) { return deferred('insert', { table, data }); },
            upsert(data) { return deferred('upsert', { table, data }); },
            delete() { query.then = (ok, fail) => deferred('delete', { table, filters }).then(ok, fail); return query; },
        };
        return query;
    } };
    const source = readFileSync(new URL('../src/hooks/use-bookmarks.tsx', import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const compiledModule = { exports: {} };
    const dependencies = {
        react: hooks,
        'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
        '@/components/user-provider': { useUser: () => ({ user, isLoading: authLoading }) },
        '@/utils/supabase/client': { createClient: () => client },
    };
    new Function('require', 'module', 'exports', 'localStorage', 'process', 'console', outputText)(name => {
        assert.ok(Object.hasOwn(dependencies, name), 'unexpected dependency ' + name);
        return dependencies[name];
    }, compiledModule, compiledModule.exports, {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: key => storage.delete(key),
    }, { env: { NEXT_PUBLIC_SUPABASE_URL: 'fixture', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture' } }, { error() {}, log() {} });
    function render() { cursor = 0; dirty = false; view = compiledModule.exports.BookmarksProvider({ children: null }).props.value; return view; }
    return {
        reads, writes, storage, view: () => view,
        owner(next, loading = false) { user = next; authLoading = loading; return render(); },
        async settle() {
            for (let i = 0; i < 30; i++) {
                render();
                for (const effect of pendingEffects.splice(0)) effect();
                await new Promise(resolve => setImmediate(resolve));
                if (!dirty && pendingEffects.length === 0) return view;
            }
            assert.fail('bookmark context did not settle');
        },
        unmount() { for (const slot of slots) slot?.cleanup?.(); },
    };
}
const item = id => ({ id, title: id, summary: 'summary', slug: id, published_at: '2026-10-21', source: 'fixture', original_url: 'https://example.com/' + id });
const rows = (...ids) => ids.map(id => ({ news_items: { ...item(id), summary_zh: 'summary' } }));

test('signing out hides the previous account immediately and remains empty without anonymous storage', async () => {
    const h = harness(); await h.settle();
    h.reads[0].resolve({ data: rows('A-bookmark'), error: null }); await h.settle();
    assert.equal(h.view().isBookmarked('A-bookmark'), true);
    assert.deepEqual(h.owner(null).bookmarks, [], 'owner transition must hide old data before effects run');
    await h.settle(); assert.deepEqual(h.view().bookmarks, []); assert.equal(h.view().isLoading, false);
    h.unmount();
});

test('late A reads cannot replace B bookmarks, and cloud reads select the current owner explicitly', async () => {
    const h = harness(); await h.settle();
    assert.deepEqual(h.reads[0].filters, [['user_id', 'A']]);
    assert.deepEqual(h.owner({ id: 'B' }).bookmarks, []); await h.settle();
    assert.deepEqual(h.reads[1].filters, [['user_id', 'B']]);
    h.reads[1].resolve({ data: rows('B-bookmark'), error: null }); await h.settle();
    h.reads[0].resolve({ data: rows('A-bookmark'), error: null }); await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['B-bookmark']);
    h.unmount();
});

for (const operation of ['add', 'remove']) {
    test('late failed ' + operation + ' from A cannot roll B back to A state', async () => {
        const h = harness(); await h.settle();
        h.reads[0].resolve({ data: rows('A-bookmark'), error: null }); await h.settle();
        const action = operation === 'add' ? h.view().addBookmark(item('A-new')) : h.view().removeBookmark('A-bookmark');
        await h.settle(); assert.equal(h.writes.length, 1);
        assert.deepEqual(h.owner({ id: 'B' }).bookmarks, []); await h.settle();
        h.reads[1].resolve({ data: rows('B-bookmark'), error: null }); await h.settle();
        h.writes[0].resolve({ error: new Error('fixture write failure') }); await action; await h.settle();
        assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['B-bookmark']);
        h.unmount();
    });
}

test('obsolete sync completion cannot remove anonymous bookmarks or fetch for the old owner', async () => {
    const saved = JSON.stringify([item('local-bookmark')]);
    const h = harness({ saved }); await h.settle();
    assert.equal(h.writes[0].kind, 'upsert');
    h.owner(null); await h.settle();
    h.writes[0].resolve({ error: null }); await h.settle();
    assert.equal(h.storage.get('sf_bookmarks'), saved);
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['local-bookmark']);
    assert.equal(h.reads.length, 0);
    h.unmount();
});

for (const nextOwner of [null, { id: 'B' }]) {
    test('owner render invalidates old sync before passive effect cleanup: ' + (nextOwner?.id || 'anonymous'), async () => {
        const saved = JSON.stringify([item('local-bookmark')]);
        const h = harness({ saved }); await h.settle();
        assert.equal(h.writes[0].kind, 'upsert');
        assert.deepEqual(h.owner(nextOwner).bookmarks, []);
        // Resolve after the new owner has rendered, but before settle runs the
        // previous effect cleanup. Promise callbacks can run in this window.
        h.writes[0].resolve({ error: null });
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(h.storage.get('sf_bookmarks'), saved, 'stale sync cannot consume anonymous storage');
        assert.equal(h.reads.length, 0, 'stale sync must not start another old-owner request');
        await h.settle();
        if (!nextOwner) assert.equal(h.view().isBookmarked('local-bookmark'), true);
        h.unmount();
    });
}

test('stale sync cannot remove fresh anonymous additions in the render-to-effect window', async () => {
    const h = harness({ saved: JSON.stringify([item('old-local')]) }); await h.settle();
    h.owner(null);
    const changed = JSON.stringify([item('new-local')]); h.storage.set('sf_bookmarks', changed);
    h.writes[0].resolve({ error: null }); await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.storage.get('sf_bookmarks'), changed); assert.equal(h.reads.length, 0);
    await h.settle(); assert.equal(h.view().isBookmarked('new-local'), true);
    h.unmount();
});

test('old read completion between owner render and effect cleanup never exposes old bookmarks', async () => {
    const h = harness(); await h.settle(); h.owner({ id: 'B' });
    h.reads[0].resolve({ data: rows('late-A'), error: null }); await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(h.owner({ id: 'B' }).bookmarks, []);
    await h.settle(); assert.equal(h.reads.length, 2);
    h.reads[1].resolve({ data: rows('B-bookmark'), error: null }); await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['B-bookmark']);
    h.unmount();
});

for (const operation of ['add', 'remove']) {
    test('old ' + operation + ' rejection before new-owner effect cannot restore old bookmarks', async () => {
        const h = harness(); await h.settle(); h.reads[0].resolve({ data: rows('A-bookmark'), error: null }); await h.settle();
        const pending = operation === 'add' ? h.view().addBookmark(item('A-new')) : h.view().removeBookmark('A-bookmark');
        await h.settle(); h.owner({ id: 'B' });
        const saved = JSON.stringify([item('new-anonymous')]); h.storage.set('sf_bookmarks', saved);
        h.writes[0].resolve({ error: new Error('stale write failure') }); await pending;
        assert.deepEqual(h.owner({ id: 'B' }).bookmarks, []); assert.equal(h.storage.get('sf_bookmarks'), saved);
        h.storage.delete('sf_bookmarks'); await h.settle();
        h.reads[1].resolve({ data: rows('B-bookmark'), error: null }); await h.settle();
        assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['B-bookmark']); h.unmount();
    });
}

for (const saved of ['{invalid JSON', '{"not":"an array"}', '[null, 3, {"id":"incomplete"}]']) {
    test('malformed local bookmarks settle as empty without unhandled rejection: ' + saved, async () => {
        const h = harness({ user: null, saved }); await h.settle();
        assert.deepEqual(h.view().bookmarks, []); assert.equal(h.view().isLoading, false);
        h.unmount();
    });
}

test('corrupt anonymous storage does not prevent signed-in cloud bookmarks from loading', async () => {
    const h = harness({ saved: '{broken' }); await h.settle();
    assert.equal(h.writes.length, 0); assert.equal(h.reads.length, 1);
    h.reads[0].resolve({ data: rows('A-bookmark'), error: null }); await h.settle();
    assert.equal(h.view().isBookmarked('A-bookmark'), true); assert.equal(h.view().isLoading, false);
    h.unmount();
});

test('anonymous users can load, add and remove saved bookmarks', async () => {
    const h = harness({ user: null, saved: JSON.stringify([item('saved')]) }); await h.settle();
    assert.equal(h.view().isBookmarked('saved'), true);
    await h.view().addBookmark(item('new')); await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['new', 'saved']);
    assert.deepEqual(JSON.parse(h.storage.get('sf_bookmarks')).map(bookmark => bookmark.id), ['new', 'saved']);
    await h.view().removeBookmark('saved'); await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['new']);
    assert.equal(h.writes.length, 0);
    h.unmount();
});

test('normal login synchronizes local bookmarks then reads and mutates only that cloud account', async () => {
    const h = harness({ saved: JSON.stringify([item('local')]) }); await h.settle();
    assert.deepEqual(h.writes[0].data, [{ user_id: 'A', news_id: 'local', slug: 'local' }]);
    h.writes[0].resolve({ error: null }); await h.settle();
    assert.equal(h.storage.has('sf_bookmarks'), false);
    h.reads[0].resolve({ data: rows('local'), error: null }); await h.settle();
    const adding = h.view().addBookmark(item('new')); await h.settle();
    assert.deepEqual(h.writes[1].data, { user_id: 'A', news_id: 'new', slug: 'new' });
    h.writes[1].resolve({ error: null }); await adding; await h.settle();
    const removing = h.view().removeBookmark('local'); await h.settle();
    assert.deepEqual(h.writes[2].filters, [['user_id', 'A'], ['news_id', 'local']]);
    h.writes[2].resolve({ error: null }); await removing; await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['new']);
    h.unmount();
});

test('A -> B -> A still ignores the first A request', async () => {
    const h = harness(); await h.settle(); h.owner({ id: 'B' }); await h.settle();
    h.owner({ id: 'A' }); await h.settle();
    h.reads[2].resolve({ data: rows('new-A'), error: null }); await h.settle();
    h.reads[0].resolve({ data: rows('old-A'), error: null }); h.reads[1].resolve({ data: rows('B'), error: null }); await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['new-A']);
    h.unmount();
});

test('sync does not delete anonymous changes made while waiting', async () => {
    const h = harness({ saved: JSON.stringify([item('local')]) }); await h.settle();
    const changed = JSON.stringify([item('new-local')]); h.storage.set('sf_bookmarks', changed);
    h.writes[0].resolve({ error: null }); await h.settle();
    assert.equal(h.storage.get('sf_bookmarks'), changed);
    h.reads[0].resolve({ data: rows('local'), error: null }); await h.settle();
    h.unmount();
});

test('auth revalidation hides old owner data until the current account is confirmed', async () => {
    const h = harness(); await h.settle();
    h.reads[0].resolve({ data: rows('A-bookmark'), error: null }); await h.settle();
    assert.deepEqual(h.owner({ id: 'A' }, true).bookmarks, []); await h.settle();
    assert.equal(h.view().isLoading, true);
    h.owner({ id: 'B' }); await h.settle();
    h.reads[1].resolve({ data: rows('B-bookmark'), error: null }); await h.settle();
    assert.deepEqual(h.view().bookmarks.map(bookmark => bookmark.id), ['B-bookmark']);
    h.unmount();
});
