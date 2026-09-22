import type { Page } from '@playwright/test';

import { listLocalMeta } from './helpers/idb-storage';
import { expect, test } from './helpers/isolated-test';

test.describe('settings', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user finds version information only in Settings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('current web version')).toHaveCount(0);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await expect(page.getByLabel('current web version')).toBeVisible();
    // Nothing is available to install, so the app offers a check instead.
    await expect(page.getByRole('button', { name: 'Check for updates' })).toBeVisible();
    await expect(page.getByLabel('available web version')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('a user checks for updates without leaving Settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('status')).toHaveText(/last checked:/i);

    // A newer bundle is deployed while the user sits on this screen.
    await serveWebVersion(page, 'deployed-later');
    await page.getByRole('button', { name: 'Check for updates' }).click();

    await expect(page.getByRole('button', { name: 'Update to Latest' })).toBeVisible();
    await expect(page.getByLabel('available web version')).toContainText('deploye');
    await expect(page.getByRole('status')).toHaveText(/new version is available/i);
  });

  test('a user updates to the latest version from inside the app', async ({ page }) => {
    // The origin reports a newer bundle until the app reloads onto it.
    await serveWebVersion(page, 'deployed-later', { untilReload: true });
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: 'Update to Latest' })).toBeVisible();

    await page.getByRole('button', { name: 'Update to Latest' }).click();

    // The user lands back on Settings, on the new version, with nothing left to do.
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('button', { name: 'Check for updates' })).toBeVisible();
    await expect(page.getByLabel('available web version')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText(/last checked:/i);
  });

  test('a user is told when the update check cannot reach the server', async ({ page }) => {
    await page.route('**/version.json', (route) => route.abort());
    await page.goto('/settings');

    await expect(page.getByRole('status')).toHaveText(/couldn't check for updates/i);
    await expect(page.getByRole('button', { name: 'Check for updates' })).toBeEnabled();
  });

  // Exercising the real skip-waiting handshake needs two genuinely different
  // bundles served in sequence, which the single-image compose stack cannot do;
  // the button's reload path is covered above. Activate this when the harness
  // can deploy a second build mid-test.
  test.skip('a user updates while a replacement service worker is waiting', async () => {
    // Intentionally empty — see comment above.
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

/**
 * Make the origin report `commit` as its deployed web version.
 *
 * The compose stack serves one built image, so a real second deploy cannot
 * happen mid-test; scripting `/version.json` is what stands in for it. With
 * `untilReload`, only the first read reports the newer build — the app reloads
 * onto it and every later read reports the bundle actually being served, which
 * is what a genuine update looks like from the page's side.
 */
async function serveWebVersion(page: Page, commit: string, options: { untilReload?: boolean } = {}): Promise<void> {
  let served = false;
  await page.route('**/version.json', async (route) => {
    if (served && options.untilReload) {
      await route.fallback();
      return;
    }
    served = true;
    await route.fulfill({
      body: JSON.stringify({ commit }),
      contentType: 'application/json',
      status: 200,
    });
  });
}

async function expectStored(page: Page, key: string): Promise<void> {
  await expect.poll(async () => (await listLocalMeta({ page })).map((entry) => entry.key)).toContain(key);
}
