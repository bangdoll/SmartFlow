import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Build and exercise the real production app against an isolated HTTP fixture.
// Never uses a production database or API key. Run with npm run test:cache.
const root = fileURLToPath(new URL('..', import.meta.url));
const news = [
  { id: '12345678-1234-1234-1234-123456789abc', title: '人工智慧最新消息', title_en: 'Latest AI news', source: 'Test source', published_at: '2026-09-29T00:00:00.000Z', created_at: '2026-09-29T00:00:00.000Z', summary_zh: '這是一段人工智慧測試新聞摘要。', summary_en: 'This is a test news summary.', original_url: 'https://example.com/news', audio_url: null, audio_url_en: null, tags: ['AI', 'Retry'], slug: 'test-ai-news', click_count: 0 },
  { id: '87654321-1234-1234-1234-123456789abc', title: '較早的人工智慧消息', title_en: 'Earlier AI news', source: 'Test source', published_at: '2026-09-28T00:00:00.000Z', created_at: '2026-09-28T00:00:00.000Z', summary_zh: '這是較早的測試新聞摘要。', summary_en: 'This is an earlier news summary.', original_url: 'https://example.com/earlier', audio_url: null, audio_url_en: null, tags: ['AI', 'Retry'], slug: 'earlier-ai-news', click_count: 0 },
];
let requests = [];
let failReads = false;
const mock = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  requests.push(url.pathname + url.search);
  if (failReads) {
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ code: 'TEST_OUTAGE', message: 'Temporary database outage' }));
    return;
  }
  let items = url.pathname.endsWith('/news_items') ? [...news] : [];
  for (const [field, expression] of url.searchParams) {
    const dot = expression.indexOf('.');
    const operator = expression.slice(0, dot), value = expression.slice(dot + 1);
    if (['eq', 'gte', 'lte', 'lt', 'gt'].includes(operator)) {
      items = items.filter(item => operator === 'eq' ? item[field] === value : operator === 'gte' ? item[field] >= value : operator === 'lte' ? item[field] <= value : operator === 'lt' ? item[field] < value : item[field] > value);
    }
    if (operator === 'cs') items = items.filter(item => item[field]?.includes(value.replace(/[{}"\\]/g, '')));
  }
  if (url.searchParams.has('order')) {
    const [field, direction] = url.searchParams.get('order').split('.');
    items.sort((a, b) => String(a[field]).localeCompare(String(b[field])) * (direction === 'desc' ? -1 : 1));
  }
  const offset = Number(url.searchParams.get('offset') || 0);
  const limit = Number(url.searchParams.get('limit') || items.length);
  items = items.slice(offset, offset + limit);
  res.setHeader('content-type', 'application/json');
  if (req.headers.accept?.includes('application/vnd.pgrst.object+json')) {
    if (items.length !== 1) { res.statusCode = 406; res.end(JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${items.length} rows` })); return; }
    res.end(JSON.stringify(items[0]));
  } else res.end(JSON.stringify(items));
});
await new Promise(resolve => mock.listen(0, '127.0.0.1', resolve));
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-only', SUPABASE_SERVICE_ROLE_KEY: 'test-only' };
let app;
function run(args, stdio = 'inherit') { return spawn(process.execPath, args, { cwd: root, env, stdio }); }
try {
  // Next's data cache survives builds. Start this isolated fixture with cold
  // entries so repeated local test runs verify misses as well as cache hits.
  await rm(`${root}/.next/cache/fetch-cache`, { recursive: true, force: true });
  const build = run(['node_modules/next/dist/bin/next', 'build']);
  assert.equal((await once(build, 'exit'))[0], 0, 'production build succeeds');
  const manifest = JSON.parse(await readFile(`${root}/.next/prerender-manifest.json`, 'utf8'));
  assert.ok(!manifest.dynamicRoutes['/news/[id]'], 'aliases retain dynamic redirect behavior');
  assert.ok(!manifest.dynamicRoutes['/tags/[tag]'], 'tag data is cached independently of route rendering');
  app = run(['node_modules/next/dist/bin/next', 'start', '-p', '3128', '-H', '127.0.0.1']);
  const base = 'http://127.0.0.1:3128';
  for (let attempts = 0; ; attempts++) {
    try { await fetch(base); break; } catch (error) { if (attempts > 100) throw error; await new Promise(r => setTimeout(r, 100)); }
  }
  requests = [];
  for (const path of ['/news/12345678', '/tags/AI']) {
    const counts = [];
    for (let i = 0; i < 3; i++) {
      const before = requests.length;
      const response = await fetch(base + path);
      const html = await response.text();
      assert.equal(response.status, 200, path);
      assert.ok(html.includes('人工智慧最新消息'), path + ' keeps article text');
      counts.push({ reads: requests.length - before, cache: response.headers.get('x-nextjs-cache'), policy: response.headers.get('cache-control') });
    }
    console.log('CACHE CHECK', path, JSON.stringify(counts));
    {
      assert.ok(counts[0].reads > 0, 'first request loads data');
      assert.equal(counts[1].reads, 0, 'repeat request must not read Supabase');
      assert.equal(counts[2].reads, 0, 'third request must not read Supabase');
      const maxAge = path.startsWith('/news/') ? 86400 : 21600;
      assert.ok(counts[1].policy.includes(`s-maxage=${maxAge}`), 'existing edge TTL is preserved');
    }
  }
  const beforeRedirect = requests.length;
  const redirect = await fetch(`${base}/news/${news[0].id}`, { redirect: 'manual' });
  await redirect.text();
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/news/12345678');
  assert.equal(requests.length, beforeRedirect, 'legacy UUID redirects before all database reads');
  const beforeSlug = requests.length;
  const slug = await fetch(`${base}/news/${news[0].slug}`, { redirect: 'manual' });
  await slug.text();
  assert.equal(slug.status, 308);
  assert.equal(slug.headers.get('location'), '/news/12345678');
  const repeatSlug = await fetch(`${base}/news/${news[0].slug}`, { redirect: 'manual' });
  await repeatSlug.text();
  assert.equal(requests.length - beforeSlug, 1, 'slug redirect lookup is cached');
  const missing = await fetch(`${base}/news/00000000`);
  await missing.text();
  assert.equal(missing.status, 404);
  const api = await fetch(`${base}/api/news?tag=AI&limit=1&offset=0`);
  assert.equal(api.status, 200);
  assert.equal((await api.json()).length, 1);
  console.log('API CACHE POLICY', api.headers.get('cache-control'), api.headers.get('vercel-cdn-cache-control'));
  assert.ok(api.headers.get('vercel-cdn-cache-control').includes('s-maxage=900'));
  // Failed cold reads must not poison the cache with a 404 or empty feed.
  for (const path of ['/news/87654321', '/tags/Retry']) {
    failReads = true;
    const failed = await fetch(base + path);
    await failed.text();
    assert.equal(failed.status, 500, 'transient database error is not cached as success');
    failReads = false;
    const recovered = await fetch(base + path);
    const html = await recovered.text();
    assert.equal(recovered.status, 200, 'next request retries after database recovery');
    assert.ok(html.includes('人工智慧'), 'recovery returns real content');
  }
  console.log('SUCCESS: public data-cache verification');
} finally {
  app?.kill('SIGTERM');
  if (app && app.exitCode === null) await once(app, 'exit');
  await new Promise(resolve => { mock.close(resolve); mock.closeAllConnections(); });
}
