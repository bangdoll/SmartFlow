import { test, expect } from '@playwright/test';

test.describe('Navigation \u0026 Critical Flows', () => {

    test('Home page should load and display news', async ({ page }) => {
        await page.goto('/');

        // Check title
        await expect(page).toHaveTitle(/Smart Flow/);

        // Check main news feed exists
        const feed = page.locator('#news-feed');
        await expect(feed).toBeVisible();

        // Check at least one news article
        const articles = page.locator('article');
        await expect(articles.first()).toBeVisible();
    });

    test('Should navigate to news detail page on click', async ({ page }) => {
        await page.goto('/');

        // Find the first article title link
        const firstArticle = page.locator('article h2 a').first();
        // Or the "Read Analysis" button
        // Let's use the whole card click which triggers hard navigation
        // But testing robust JS click:

        const articleTitle = await firstArticle.innerText();
        console.log('Testing article:', articleTitle);

        // Click it. Note: It's an external link usually (original_url), 
        // BUT we have "Read Analysis" button that goes to internal detail.

        const readMoreBtn = page.getByText('Read Analysis').first().or(page.getByText('閱讀完整分析').first());

        // If button exists, click it
        if (await readMoreBtn.count() > 0) {
            await readMoreBtn.click();
        } else {
            // Fallback: Click the card itself (which handles hard navigation)
            // We need to avoid clicking the external link title if possible, or intercept it.
            // Actually our code: title link -> external. Card body -> internal.
            // Let's click the summary/body.
            const summary = page.locator('article p').first();
            await summary.click();
        }

        // Expect URL to contain /news/
        await expect(page).toHaveURL(/\/news\//);

        // Expect detail page content
        await expect(page.locator('article')).toBeVisible();
    });

    test('Tags should navigate to tag page', async ({ page }) => {
        await page.goto('/');

        // Find a tag
        const firstTag = page.locator('article a[href^="/tags/"]').first();
        const tagNameHtml = await firstTag.innerText();
        const tagName = tagNameHtml.trim(); // e.g. "AI"

        if (await firstTag.count() > 0) {
            await firstTag.click();

            // Expect URL to be /tags/TAG
            await expect(page).toHaveURL(/\/tags\//);

            // Check header title contains tag
            const header = page.locator('main h1');
            await expect(header).toContainText(tagName);

            // Check NewsFeed exists
            await expect(page.locator('article').first()).toBeVisible();
        } else {
            console.log('No tags found to test');
        }
    });

    test('Static pages should load', async ({ page }) => {
        await page.goto('/trends');
        await expect(page).toHaveURL('/trends');

        await page.goto('/archive');
        await expect(page).toHaveURL('/archive');
    });

});
