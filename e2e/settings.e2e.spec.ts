import type { Page } from '@playwright/test';

import { listLocalMeta } from './helpers/idb-storage';
import { expect, test } from './helpers/isolated-test';

test.describe('settings', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user finds version information only in Settings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('web client commit')).toHaveCount(0);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Version' })).toBeVisible();
    await expect(page.getByLabel('web client commit')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('a user switches appearance and it survives a reload', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // The page repaints on the in-memory change; only a committed write
    // survives a reload, so wait for it rather than racing it.
    await expectStored(page, 'pref:appearance');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // System hands the choice back to the device, so it stamps nothing at all.
    await page.getByRole('radio', { name: 'System' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
  });

  test('a user turns on increased contrast and it survives a reload', async ({ page }) => {
    await page.goto('/settings');

    await page.getByRole('radio', { name: 'Light' }).click();
    await page.getByRole('radio', { name: 'Increased' }).click();
    await expectStored(page, 'pref:appearance');
    await expectStored(page, 'pref:contrast');

    await page.reload();

    // Contrast composes with the appearance rather than replacing it.
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'increased');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

async function expectStored(page: Page, key: string): Promise<void> {
  await expect.poll(async () => (await listLocalMeta({ page })).map((entry) => entry.key)).toContain(key);
}
