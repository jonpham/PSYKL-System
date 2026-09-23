import { listLocalMeta } from './helpers/idb-storage';
import { expect, test } from './helpers/isolated-test';

const MARK = '.psykl-brand-mark';

test.describe('app identity', () => {
  test.describe('on a phone', () => {
    test.use({ viewport: { height: 844, width: 390 } });

    test('a user sees the PSYKL mark in the header above their list', async ({ page }) => {
      await page.goto('/');

      const trigger = page.getByRole('button', { name: 'Open PSYKL navigation' });
      await expect(trigger).toBeVisible();
      await expect(trigger.locator(MARK)).toBeVisible();
      await expect(trigger).toContainText('PSYKL');
    });

    test('a user opens and closes the navigation from the PSYKL mark', async ({ page }) => {
      await page.goto('/');
      const trigger = page.getByRole('button', { name: 'Open PSYKL navigation' });

      await trigger.click();
      const close = page.getByRole('button', { name: 'Close PSYKL navigation' });
      await expect(close.locator(MARK)).toBeVisible();

      await close.click();

      await expect(page.getByRole('navigation', { name: 'PSYKL navigation' })).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test('a user finds a PSYKL icon waiting for their browser tab', async ({ page }) => {
      await page.goto('/');

      // The SVG icon is the one that follows the tab strip's light or dark
      // appearance; the .ico is what a browser refusing it falls back to.
      await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg');
      for (const path of ['/favicon.svg', '/favicon.ico']) {
        expect((await page.request.get(path)).status(), `${path} should be served`).toBe(200);
      }
    });
  });

  test.describe('on a desktop window', () => {
    test.use({ viewport: { height: 900, width: 1280 } });

    test('a user is not offered a way to close a sidebar that never closes', async ({ page }) => {
      await page.goto('/');

      // The sidebar is permanent at this width, so its header is a brand
      // heading rather than a dismiss control — and nothing reaches it by Tab.
      await expect(page.getByRole('navigation', { name: 'PSYKL navigation' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'PSYKL' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close PSYKL navigation' })).toBeHidden();
      await expect(page.getByRole('button', { name: 'Open PSYKL navigation' })).toBeHidden();
    });
  });

  /**
   * iOS bakes the home-screen icon at Add to Home Screen time from the
   * `apple-touch-icon` link in the live document, and resolves no dark variant
   * of its own. Choosing which tile that link offers is therefore the whole of
   * the app's say in its installed icon.
   *
   * Behavior owned by: components/web_client/src/preferences/apply.ts
   */
  test.describe('home-screen icon', () => {
    test.use({ viewport: { height: 844, width: 390 } });

    const installedIcon = 'link[rel="apple-touch-icon"]';

    test('a user who has set the app to Dark is offered the dark home-screen icon', async ({ page }) => {
      await page.goto('/settings');

      await page.getByRole('radio', { name: 'Dark' }).click();

      await expect(page.locator(installedIcon)).toHaveAttribute('href', '/apple-touch-icon-dark.png');
    });

    test('a user who has set the app to Light keeps the light icon on a dark device', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/settings');

      await page.getByRole('radio', { name: 'Light' }).click();

      await expect(page.locator(installedIcon)).toHaveAttribute('href', '/apple-touch-icon.png');
    });

    test('a user on the System appearance is offered the icon matching their device', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto('/');

      await expect(page.locator(installedIcon)).toHaveAttribute('href', '/apple-touch-icon-dark.png');

      await page.emulateMedia({ colorScheme: 'light' });

      await expect(page.locator(installedIcon)).toHaveAttribute('href', '/apple-touch-icon.png');
    });

    test('a user reopening the app keeps the icon their saved appearance chose', async ({ page }) => {
      await page.goto('/settings');
      await page.getByRole('radio', { name: 'Dark' }).click();
      await expect(page.locator(installedIcon)).toHaveAttribute('href', '/apple-touch-icon-dark.png');
      // The choice is applied to the document before it is persisted, so wait
      // for the write rather than racing the reload against it.
      await expect
        .poll(async () => (await listLocalMeta({ page })).find((entry) => entry.key === 'pref:appearance')?.value)
        .toBe('dark');

      // A cold load must settle the icon without the user visiting Settings:
      // Add to Home Screen can happen at any moment.
      await page.goto('/');

      await expect(page.locator(installedIcon)).toHaveAttribute('href', '/apple-touch-icon-dark.png');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });
  });
});
