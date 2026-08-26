import { test, expect } from '@playwright/test';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

test('news pages expose one canonical short URL', async ({ page, request, baseURL }) => {
    await page.goto('/');

    const fullId = (await page.content()).match(UUID_PATTERN)?.[0];
    expect(fullId, 'homepage should contain a published news UUID').toBeTruthy();

    const shortId = fullId!.slice(0, 8);
    const legacyResponse = await request.get(`/news/${fullId}`, { maxRedirects: 0 });

    expect(legacyResponse.status()).toBe(308);
    expect(new URL(legacyResponse.headers().location, baseURL).pathname).toBe(`/news/${shortId}`);

    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBeTruthy();
    const sitemap = await sitemapResponse.text();

    expect(sitemap).toContain(`/news/${shortId}`);
    expect(sitemap).not.toContain(`/news/${fullId}`);
});
