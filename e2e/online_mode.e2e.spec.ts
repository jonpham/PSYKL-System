import type { Page } from '@playwright/test';

import { expect, test } from './helpers/isolated-test';
import { expectServerTaskVisible } from './helpers/multi-device';
import { createList, createTask, openList } from './helpers/selection';
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

  test('a user adds a task, finds it saved on the server, and still sees it after reloading', async ({ page }) => {
    const title = `call the dentist ${Date.now()}`;
    await page.goto('/');
    await createTask(page, title);

    await expectServerTaskVisible('local', title);
    await page.reload();
    await expect(page.getByRole('listitem', { name: title })).toBeVisible();
  });

  test('a task added to another list stays in that list', async ({ page }) => {
    const title = `oat milk ${Date.now()}`;
    await page.goto('/');
    await createList(page, 'Groceries');
    await openList(page, 'Groceries');
    await createTask(page, title);

    const groceries = (await fetchServerLists('local')).find((list) => list.title === 'Groceries');
    const task = await expectServerTaskVisible('local', title);
    expect(task.list_id).toBe(groceries?.id);
    await openList(page, 'Tasks');
    await expect(page.getByRole('listitem', { name: title })).toHaveCount(0);
  });

  test('a user sees no Sync controls, and a link to Sync opens their list instead', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sync (clear|needs attention)$/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    const navigation = page.getByRole('navigation', { name: 'PSYKL navigation' });
    await expect(navigation.getByRole('button', { name: 'Settings' })).toBeVisible();
    await expect(navigation.getByRole('button', { name: 'Sync', exact: true })).toHaveCount(0);

    await page.goto('/sync');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });
});

test.describe('with Offline Mode off, in a browser without IndexedDB', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('psykl:offline-mode', 'false');
      Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
    });
  });

  test.skip('a user picks Dark and opens a list, and both are kept after reloading', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('psykl:pref:appearance'))).toBe('"dark"');

    await createList(page, 'Groceries');
    await page.getByRole('button', { name: 'Groceries', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Groceries' })).toBeVisible();
    // The app opened Tasks at start-up, so wait for Groceries specifically.
    const groceries = (await fetchServerLists('local')).find((list) => list.title === 'Groceries');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('psykl:active_list_id')))
      .toBe(JSON.stringify(groceries?.id));

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: 'Groceries' })).toBeVisible();
  });
});
