import { expect, test } from '@playwright/test';

test.describe('M1: PSYKL Task CRUD via PWA', () => {
  test.beforeEach(async ({ page }) => {
    const userId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await page.route('http://localhost:3000/**', async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          'X-User-Id': userId,
        },
      });
    });
  });

  test('user creates a task and sees it in the list', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'PSYKL' })).toBeVisible();
    await expect(page.getByText(/no tasks yet/i)).toBeVisible();

    const title = `e2e task ${Date.now()}`;
    await page.getByRole('textbox', { name: /title/i }).fill(title);
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(/no tasks yet/i)).not.toBeVisible();
  });

  test('multiple tasks render in order', async ({ page }) => {
    await page.goto('/');

    const titles = [`first ${Date.now()}`, `second ${Date.now()}`, `third ${Date.now()}`];
    for (const title of titles) {
      await page.getByRole('textbox', { name: /title/i }).fill(title);
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText(title)).toBeVisible();
    }

    for (const title of titles) {
      await expect(page.getByText(title)).toBeVisible();
    }

    await expect(page.getByRole('listitem').locator('span')).toHaveText([...titles].reverse());
  });
});
