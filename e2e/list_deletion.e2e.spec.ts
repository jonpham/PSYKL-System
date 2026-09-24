import { expect, test } from './helpers/isolated-test';
import { createList, createTask, openList } from './helpers/selection';
import { expectListDeletedOnServer } from './helpers/task-api';

test.describe('list deletion', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user is asked what happens to the items before a list is deleted', async ({ page }) => {
    const title = `Errands ${Date.now()}`;
    await createList(page, title);
    await openList(page, title);
    await createTask(page, 'post the parcel');

    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();

    // The menu closes and the question is asked in full: what it holds, and
    // both outcomes, with Cancel to walk away.
    await expect(page.getByRole('menu')).toHaveCount(0);
    const dialog = page.getByRole('dialog', { name: `Delete "${title}"?` });
    await expect(dialog.getByText('It still holds 1 item.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Delete With Items' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Delete Just the List' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('listitem', { name: 'post the parcel' })).toBeVisible();
  });

  test('a user deletes a list and its items along with it', async ({ page }) => {
    const title = `Groceries ${Date.now()}`;
    await createList(page, title);
    await openList(page, title);
    await createTask(page, 'oat milk');

    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('button', { name: 'Delete With Items' }).click();
    await expectListDeletedOnServer('local', title);

    // The task leaves with its list rather than surfacing in another one.
    await page.goto('/');
    await expect(page.getByRole('listitem', { name: 'oat milk' })).toHaveCount(0);
    await page.goto('/lists');
    await expect(page.getByRole('button', { name: title, exact: true })).toHaveCount(0);
  });

  test('a user deletes a list but keeps the items in it', async ({ page }) => {
    const title = `Weekend ${Date.now()}`;
    const kept = `hang the shelf ${Date.now()}`;
    await createList(page, title);
    await openList(page, title);
    await createTask(page, kept);

    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('button', { name: 'Delete Just the List' }).click();
    await expectListDeletedOnServer('local', title);

    // The items are in the default list, which is where the app puts a task
    // whose list is gone.
    await page.goto('/');
    await openList(page, 'Tasks');
    await expect(page.getByRole('listitem', { name: kept })).toBeVisible();
    await page.goto('/lists');
    await expect(page.getByRole('button', { name: title, exact: true })).toHaveCount(0);
  });
});
