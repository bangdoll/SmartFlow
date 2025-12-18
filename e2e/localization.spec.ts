
import { test, expect } from '@playwright/test';

test.describe('Localization & Language Switching', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Should switch language to English and persist', async ({ page }) => {
        // Initial state should be traditional Chinese (default)
        // Check for specific Chinese text on homepage header (Focus Mode)
        await expect(page.locator('h2', { hasText: '今天最重要的 5 則' })).toBeVisible();

        // Find and Click Language Toggle (ZH -> EN)
        // Button text is "EN" when in ZH mode
        await page.getByRole('button', { name: 'EN', exact: true }).click();

        // Verify Header Text changes to English (Focus Mode)
        await expect(page.locator('h2', { hasText: 'Top 5 AI News Today' })).toBeVisible();
        await expect(page.getByText('最新動態')).not.toBeVisible();

        // Verify URL persistence or local storage (optional, usually page reload test)
        await page.reload();
        await expect(page.locator('h2', { hasText: 'Top 5 AI News Today' })).toBeVisible();
    });

    test('News Cards should show English content when in English mode', async ({ page }) => {
        // Switch to English
        await page.getByRole('button', { name: 'EN', exact: true }).click();

        // Verify common UI elements are translated
        await expect(page.locator('h2', { hasText: 'Top 5 AI News Today' })).toBeVisible();

        // Verify News Card UI components are translated
        // "Read Analysis" is the English translation for "閱讀完整分析"
        // This confirms the UI inside the card has updated, regardless of the dynamic title content
        await expect(page.getByRole('button', { name: 'Read Analysis' }).first()).toBeVisible();

    });
});
