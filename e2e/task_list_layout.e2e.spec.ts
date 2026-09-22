import { expect, test } from './helpers/isolated-test';

test.describe('Task list layout', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user sees the sync and list options controls aligned with task rows', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('.psykl-app-shell__content-header');
    await expect(header).toHaveCSS('column-gap', '0px');
    const columns = await header.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
    expect(columns).toMatch(/ 40px 48px$/);
    const sync = await page.locator('.psykl-sync-status__control').boundingBox();
    const menu = await page.getByRole('button', { name: 'List options' }).boundingBox();
    expect(sync).not.toBeNull();
    expect(menu).not.toBeNull();
    expect(menu!.x).toBeGreaterThanOrEqual(sync!.x + sync!.width);
  });
});
