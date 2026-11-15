import type { Page } from '@playwright/test';

import { expect, test } from './helpers/isolated-test';
import { createList, openList } from './helpers/selection';
import { fetchServerLists } from './helpers/task-api';

async function turnOfflineModeOffBeforeLoading(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('psykl:offline-mode', 'false'));
}

test.describe('with Offline Mode off', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test.beforeEach(async ({ page }) => {
    await turnOfflineModeOffBeforeLoading(page);
  });

  test('a user adds a list, finds it saved on the server, and still sees it after reloading', async ({ page }) => {
    await page.goto('/');
    await createList(page, 'Groceries');

    await expect
      .poll(async () => (await fetchServerLists('local')).map((list) => list.title))
      .toEqual(['Tasks', 'Groceries']);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Groceries', exact: true })).toBeVisible();
  });

  test('a user can delete a list they made, but is never offered to delete Tasks', async ({ page }) => {
    await page.goto('/');
    await createList(page, 'Errands');

    await openList(page, 'Tasks');
    await page.getByRole('button', { name: 'List options' }).click();
    await expect(page.getByRole('menuitem', { name: 'Select Items' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete List' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await openList(page, 'Errands');
    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('dialog', { name: 'Delete "Errands"?' }).getByRole('button', { name: 'Delete List' }).click();

    await expect.poll(async () => (await fetchServerLists('local')).map((list) => list.title)).toEqual(['Tasks']);
  });
});
