import type { Page } from '@playwright/test';

import { listLocalSyncQueue } from './helpers/idb-storage';
import { expect, test } from './helpers/isolated-test';
import { deleteServerTask, expectListDeletedOnServer } from './helpers/task-api';

test.describe('recently deleted', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user sees how many days remain before a deleted task is purged, then restores it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'New task title' }).fill('Milk');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByText('Milk')).toBeVisible();

    await expectSyncQueueEmpty(page);
    await deleteServerTask('local', 'Milk');
    await page.reload();
    await expect(page.getByText('Milk')).toHaveCount(0);

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByRole('listitem', { name: 'Milk' })).toBeVisible();
    await expect(page.getByText('30d')).toBeVisible();

    await page.getByRole('button', { name: 'Restore Milk' }).click();
    await expect(page.getByText('Nothing deleted in the last 30 days.')).toBeVisible();

    // Leaving a destination is navigation, not dismissing a sheet.
    await page.goBack();
    await expect(page.getByText('Milk')).toBeVisible();
  });

  test('a user restores a deleted list and its tasks come back', async ({ page }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Groceries', exact: true }).click();

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'New task title' }).fill('Milk');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByText('Milk')).toBeVisible();

    // Taking the items along is what makes the list one undoable unit here.
    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('button', { name: 'Delete With Items' }).click();

    // Recently Deleted is served by the back end, so the delete has to have
    // reached it before a full page load can show the list there.
    await expectListDeletedOnServer('local', 'Groceries');

    await page.goto('/recently-deleted');
    await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
    // The row says what it was and what pressing Restore brings back with it.
    await expect(page.getByText('list · 1 item')).toBeVisible();
    await page.getByRole('button', { name: 'Restore Groceries' }).click();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Groceries', exact: true }).click();
    await expect(page.getByText('Milk')).toBeVisible();
  });
});

async function expectSyncQueueEmpty(page: Page): Promise<void> {
  await expect.poll(async () => listLocalSyncQueue({ page }), { timeout: 10_000 }).toEqual([]);
}
