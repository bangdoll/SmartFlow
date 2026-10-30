import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, rm, cp, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Build and exercise the real production app against an isolated HTTP fixture.
// Never uses a production database or API key. Run with npm run test:cache.
const repository = fileURLToPath(new URL('..', import.meta.url));
// No .env files or production credentials are copied into the test app.
const root = await mkdtemp(join(tmpdir(), 'smartflow-cache-'));
for (const entry of ['src', 'public', 'next.config.ts', 'tsconfig.json', 'package.json']) {
  await cp(join(repository, entry), join(root, entry), { recursive: true });
}
await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
const pagePath = join(root, 'src/app/news/[id]/page.tsx');
let page = await readFile(pagePath, 'utf8');
assert.match(page, /export const revalidate = 600;/, 'reviewed production ISR interval remains ten minutes');
// Shorten only the isolated fixture copy, and count actual page renders rather
// than inferring them from database reads. Production source is never edited.
page = page.replace('export const revalidate = 600;', 'export const revalidate = 5;')
  .replace('export default async function NewsDetailPage({ params }: Props) {',
    `export default async function NewsDetailPage({ params }: Props) {
    console.log('NEWS_CACHE_TEST_RENDER');`);
await writeFile(pagePath, page);
const news = [
  { id: '12345678-1234-4234-9234-123456789abc', title: '人工智慧最新消息', title_en: 'Latest AI news', source: 'Test source', published_at: '2026-09-29T00:00:00.000Z', created_at: '2026-09-29T00:00:00.000Z', summary_zh: '這是一段人工智慧測試新聞摘要。', summary_en: 'This is a test news summary.', original_url: 'https://example.com/news', audio_url: null, audio_url_en: null, tags: ['AI', 'Retry'], slug: 'test-ai-news', click_count: 0 },
  { id: '87654321-1234-4234-9234-123456789abc', title: '較早的人工智慧消息', title_en: 'Earlier AI news', source: 'Test source', published_at: '2026-09-28T00:00:00.000Z', created_at: '2026-09-28T00:00:00.000Z', summary_zh: '這是較早的測試新聞摘要。', summary_en: 'This is an earlier news summary.', original_url: 'https://example.com/earlier', audio_url: null, audio_url_en: null, tags: ['AI', 'Retry'], slug: 'earlier-ai-news', click_count: 0 },
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
const env = { PATH: process.env.PATH, NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-only', SUPABASE_SERVICE_ROLE_KEY: 'test-only',
  ADMIN_SECRET: 'cache-test-admin-only', CRON_SECRET: 'cache-test-cron-only',
};
let app;
function run(args, stdio = 'inherit') { return spawn(process.execPath, args, { cwd: root, env, stdio }); }
try {
  // Next's data cache survives builds. Start this isolated fixture with cold
  // entries so repeated local test runs verify misses as well as cache hits.
  await rm(`${root}/.next/cache/fetch-cache`, { recursive: true, force: true });
  const build = run(['node_modules/next/dist/bin/next', 'build', '--webpack']);
  assert.equal((await once(build, 'exit'))[0], 0, 'production build succeeds');
  const manifest = JSON.parse(await readFile(`${root}/.next/prerender-manifest.json`, 'utf8'));
  assert.ok(manifest.dynamicRoutes['/news/[id]'], 'news pages use on-demand ISR while preserving redirects');
  assert.ok(manifest.dynamicRoutes['/tags/[tag]'], 'tag pages use on-demand static generation');
  app = run(['node_modules/next/dist/bin/next', 'start', '-p', '3128', '-H', '127.0.0.1'], ['ignore', 'pipe', 'pipe']);
  let appLog = '';
  app.stdout.on('data', chunk => { appLog += chunk; });
  app.stderr.on('data', chunk => { appLog += chunk; });
  const renders = () => appLog.split('NEWS_CACHE_TEST_RENDER').length - 1;
  async function drainLogs() { await new Promise(resolve => setTimeout(resolve, 50)); }
  async function invalidate(items, token = 'cache-test-admin-only') {
    const response = await fetch(`${base}/api/cron/revalidate-news`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    await response.text(); return response;
  }
  async function waitForArticle(path, expected) {
    for (let i = 0; i < 50; i++) {
      const response = await fetch(base + path);
      const html = await response.text();
      if (response.status === 200 && html.includes(expected)) return response;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.fail('article did not refresh: ' + path + ' expected ' + expected + '\n' + appLog);
  }
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
      assert.equal(counts[1].cache, 'HIT', 'repeat requests hit the full page cache');
      assert.equal(counts[2].cache, 'HIT', 'third request avoids rendering');
      const maxAge = path.startsWith('/news/') ? 5 : 3600;
      assert.ok(counts[1].policy.includes(`s-maxage=${maxAge}`), 'edge TTL matches the public page cache policy');
    }
  }
  // A warm news page must avoid the actual page render, including bot and RSC visits.
  await drainLogs();
  const beforeRenders = renders(), beforeCrawlerBurst = requests.length;
  for (const path of ['/news/12345678', '/tags/AI']) {
    await Promise.all(Array.from({ length: 10 }, async (_, i) => {
      const response = await fetch(base + path, { headers: { 'user-agent': `CacheRegressionBot/${i}` } });
      assert.equal(response.status, 200); assert.equal(response.headers.get('x-nextjs-cache'), 'HIT');
      assert.ok((await response.text()).includes('人工智慧最新消息'));
    }));
    const rsc = await fetch(base + path, { headers: { RSC: '1', 'next-router-prefetch': '1' } });
    assert.equal(rsc.status, 200); assert.equal(rsc.headers.get('x-nextjs-cache'), 'HIT');
    assert.ok(rsc.headers.get('content-type').includes('text/x-component'));
    assert.ok((await rsc.text()).includes('人工智慧最新消息'));
  }
  await drainLogs();
  assert.equal(renders(), beforeRenders, 'warm crawler/RSC requests do not execute NewsDetailPage');
  assert.equal(requests.length, beforeCrawlerBurst, 'cached pages do not read the database');
  console.log('NEWS AND TAG ISR: warm HTML, 20 bot requests and RSC skip page render/DB');
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
  const absentAlias = await fetch(`${base}/news/late-story`, { redirect: 'manual' });
  await absentAlias.text(); assert.equal(absentAlias.status, 404);
  const encodedAlias = '舊新聞';
  news[1].slug = encodedAlias;
  const encodedRedirect = await fetch(`${base}/news/${encodeURIComponent(encodedAlias)}`, { redirect: 'manual' });
  await encodedRedirect.text(); assert.equal(encodedRedirect.status, 308);
  assert.equal(encodedRedirect.headers.get('location'), '/news/87654321');
  news[1].slug = 'old-story.png';
  const assetLikeAlias = await fetch(`${base}/news/old-story.png`, { redirect: 'manual' });
  await assetLikeAlias.text(); assert.equal(assetLikeAlias.status, 308);
  assert.equal(assetLikeAlias.headers.get('location'), '/news/87654321');
  for (const alias of [news[0].id, news[0].slug]) {
    const rscAlias = await fetch(`${base}/news/${alias}`, { redirect: 'manual', headers: { RSC: '1', 'next-router-prefetch': '1' } });
    await rscAlias.text(); assert.equal(rscAlias.status, 308);
    assert.equal(rscAlias.headers.get('location'), '/news/12345678');
    const headAlias = await fetch(`${base}/news/${alias}`, { method: 'HEAD', redirect: 'manual' });
    assert.equal(headAlias.status, 308); assert.equal(headAlias.headers.get('location'), '/news/12345678');
    assert.equal(await headAlias.text(), '');
  }
  const missing = await fetch(`${base}/news/00000000`);
  await missing.text();
  assert.equal(missing.status, 404);
  const api = await fetch(`${base}/api/news?tag=AI&limit=1&offset=0`);
  assert.equal(api.status, 200);
  assert.equal((await api.json()).length, 1);
  console.log('API CACHE POLICY', api.headers.get('cache-control'), api.headers.get('vercel-cdn-cache-control'));
  assert.ok(api.headers.get('vercel-cdn-cache-control').includes('s-maxage=900'));
  // Use the real authenticated maintenance route to exercise production invalidation.
  const oldTitle = news[0].title;
  news[0].title = '快取失效後更新的新聞標題';
  news[0].summary_en = 'Updated English summary after successful write';
  news[0].audio_url = 'https://example.com/updated-audio.mp3';
  const unauthorized = await invalidate([{ id: news[0].id }], 'wrong-token');
  assert.equal(unauthorized.status, 401);
  const refreshed = await invalidate([{ id: news[0].id }]);
  assert.equal(refreshed.status, 200);
  await waitForArticle('/news/12345678', news[0].title);
  const changed = await fetch(`${base}/news/12345678`);
  const changedHtml = await changed.text();
  assert.ok(changedHtml.includes(news[0].summary_en));
  assert.ok(changedHtml.includes(news[0].audio_url));
  assert.ok(changedHtml.includes(`<title>${news[0].title}`), 'metadata refreshes with article');
  assert.ok(!changedHtml.includes(`<title>${oldTitle}`));
  assert.equal(changed.headers.get('set-cookie'), null, 'public ISR never stores session cookies');

  // Legal uppercase UUID input must invalidate the existing lowercase public URL.
  const caseItem = { ...news[0], id: 'beefcafe-1234-4234-9234-123456789abc', slug: 'case-sensitive-check', title: 'UUID case baseline', published_at: '2026-07-01T00:00:00.000Z' };
  news.push(caseItem);
  const casePath = '/news/beefcafe';
  await (await fetch(base + casePath)).text();
  const caseWarm = await fetch(base + casePath); await caseWarm.text();
  assert.equal(caseWarm.headers.get('x-nextjs-cache'), 'HIT');
  caseItem.title = 'Uppercase UUID refresh succeeds';
  assert.equal((await invalidate([{ id: caseItem.id.toUpperCase() }])).status, 200);
  const caseUpdated = await fetch(base + casePath);
  const caseHtml = await caseUpdated.text();
  assert.equal(caseUpdated.status, 200);
  assert.ok(caseHtml.includes(`<title>${caseItem.title}`), 'uppercase UUID must refresh lowercase canonical metadata immediately');
  const caseRsc = await fetch(base + casePath, { headers: { RSC: '1', 'next-router-prefetch': '1' } });
  assert.ok((await caseRsc.text()).includes(caseItem.title), 'updated RSC uses the same canonical content');
  console.log('UPPERCASE UUID: canonical HTML, metadata and RSC refreshed');
  for (const alias of [caseItem.id.toUpperCase(), 'BEEFCAFE', 'BeEfCaFe']) {
    const beforeAliasReads = requests.length;
    for (const options of [{}, { method: 'HEAD' }, { headers: { RSC: '1', 'next-router-prefetch': '1' } }]) {
      const response = await fetch(`${base}/news/${alias}`, { ...options, redirect: 'manual' });
      await response.text();
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), casePath);
    }
    assert.equal(requests.length, beforeAliasReads, 'uppercase aliases canonicalize before database reads');
  }
  for (const tag of ['100%', 'literal%20tag', '中文%Tag.png']) {
    news[0].tags.push(tag);
    const response = await fetch(`${base}/tags/${encodeURIComponent(tag)}`);
    const html = await response.text();
    assert.equal(response.status, 200, 'valid literal percent tags must not throw\n' + appLog);
    assert.ok(html.includes(news[0].title), 'tag lookup uses the decoded literal exactly once');
    const beforeWarmReads = requests.length;
    const warm = await fetch(`${base}/tags/${encodeURIComponent(tag)}`);
    await warm.text();
    assert.equal(warm.headers.get('x-nextjs-cache'), 'HIT', 'percent tags retain full-page ISR');
    const warmRsc = await fetch(`${base}/tags/${encodeURIComponent(tag)}`, { headers: { RSC: '1', 'next-router-prefetch': '1' } });
    await warmRsc.text();
    assert.equal(warmRsc.status, 200);
    assert.equal(warmRsc.headers.get('x-nextjs-cache'), 'HIT');
    assert.equal(requests.length, beforeWarmReads, 'warm percent tag HTML/RSC skip DB reads');
  }
  const percentComparison = await fetch(`${base}/compare/100%25-vs-AI`);
  const percentComparisonHtml = await percentComparison.text();
  assert.equal(percentComparison.status, 200, 'percent comparison avoids framework double-decode');
  assert.ok(percentComparisonHtml.includes('100% vs AI'));
  const repeatedQuery = await fetch(`${base}/search?q=AI&q=Apple`);
  assert.equal(repeatedQuery.status, 200); await repeatedQuery.text();
  failReads = true;
  const feedOutage = await fetch(`${base}/feed.xml`);
  assert.equal(feedOutage.status, 503);
  assert.match(feedOutage.headers.get('cache-control'), /no-store/);
  await feedOutage.text();
  failReads = false;
  const feedRecovery = await fetch(`${base}/feed.xml`);
  assert.equal(feedRecovery.status, 200); assert.ok((await feedRecovery.text()).includes('<item>'));
  console.log('PUBLIC ROUTING: uppercase 308, literal-percent tags, repeated search and RSS outage/recovery passed');


  // A cached missing ID must recover immediately after its row is inserted.
  const newItem = { ...news[0], id: '00000000-1234-4234-9234-123456789abc', slug: 'late-story', title: '建置後新增的新聞', published_at: '2026-10-01T00:00:00.000Z' };
  news.push(newItem);
  assert.equal((await invalidate([{ id: newItem.id, slug: newItem.slug }], 'cache-test-cron-only')).status, 200);
  await waitForArticle('/news/00000000', newItem.title);
  const newSlug = await fetch(`${base}/news/late-story?from=legacy`, { redirect: 'manual' });
  await newSlug.text(); assert.equal(newSlug.status, 308); assert.equal(newSlug.headers.get('location'), '/news/00000000');

  // Renaming a slug invalidates the old lookup as well as the new lookup.
  news[0].slug = 'renamed-story';
  assert.equal((await invalidate([{ id: news[0].id, slug: 'test-ai-news' }, { id: news[0].id, slug: news[0].slug }])).status, 200);
  const removedAlias = await fetch(`${base}/news/test-ai-news`, { redirect: 'manual' });
  await removedAlias.text(); assert.equal(removedAlias.status, 404);
  const renamedAlias = await fetch(`${base}/news/renamed-story`, { redirect: 'manual' });
  await renamedAlias.text(); assert.equal(renamedAlias.status, 308);
  assert.equal(renamedAlias.headers.get('location'), '/news/12345678');

  // Complete the preceding explicit purge before testing time-based expiry.
  // An explicitly purged page is cold until a successful render repopulates it.
  await waitForArticle('/news/12345678', news[0].title);
  const warmBeforeExpiry = await fetch(`${base}/news/12345678`);
  await warmBeforeExpiry.text();
  assert.equal(warmBeforeExpiry.headers.get('x-nextjs-cache'), 'HIT');

  // Warm ISR must retain the last good page on background regeneration errors.
  await new Promise(resolve => setTimeout(resolve, 6000));
  failReads = true;
  const stale = await fetch(`${base}/news/12345678`);
  const staleHtml = await stale.text();
  assert.equal(stale.status, 200); assert.ok(staleHtml.includes(news[0].title));
  await new Promise(resolve => setTimeout(resolve, 500));
  const stillGood = await fetch(`${base}/news/12345678`);
  assert.equal(stillGood.status, 200); assert.ok((await stillGood.text()).includes(news[0].title));
  failReads = false; news[0].title = '背景重建恢復成功';
  await waitForArticle('/news/12345678', news[0].title);
  console.log('NEWS INVALIDATION: content/metadata/audio, new articles/negative cache and warm-error recovery passed');

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
  console.log('SUCCESS: public ISR, legacy redirects and invalidation verified');
} finally {
  app?.kill('SIGTERM');
  if (app && app.exitCode === null) await once(app, 'exit');
  await new Promise(resolve => { mock.close(resolve); mock.closeAllConnections(); });
  await rm(root, { recursive: true, force: true });
}
