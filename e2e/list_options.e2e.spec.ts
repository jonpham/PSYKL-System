import { expect, test } from '@playwright/test';

import { listLocalMeta } from './helpers/idb-storage';

test.describe('list options', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user hides completed tasks and the setting survives a reload', async ({ page }) => {
    await page.goto('/');

    const title = `sweep the porch ${Date.now()}`;
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'New task title' }).fill(title);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');

    await page.getByRole('checkbox', { name: `Mark ${title} complete` }).click();
    await expect(page.getByRole('checkbox', { name: `Mark ${title} incomplete` })).toBeChecked();

    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Hide Completed' }).click();
    await expect(page.getByRole('listitem', { name: title })).toHaveCount(0);

    // The row leaves on the in-memory change; the reload below only survives if
    // the write has reached IndexedDB, so wait for it rather than racing it.
    await expect
      .poll(async () => (await listLocalMeta({ page })).filter((entry) => entry.key.startsWith('pref:show-completed:')))
      .not.toHaveLength(0);

    // How a user likes to look at a list is remembered on this device. The menu
    // reading "Show Completed" is what proves the stored preference was applied
    // — an empty list on its own would also be true of a list still loading.
    await page.reload();
    // Let the list finish loading before reading the menu: an empty list is also
    // true of a list still hydrating, and the menu does not re-read the stored
    // preference while it is already open.
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();
    await expect(page.getByRole('listitem', { name: title })).toHaveCount(0);

    await page.getByRole('button', { name: 'List options' }).click();
    const showCompleted = page.getByRole('menuitem', { name: 'Show Completed (1)' });
    await expect(showCompleted).toBeVisible();

    await showCompleted.click();
    await expect(page.getByRole('listitem', { name: title })).toBeVisible();
  });

  test('a user deletes a list from its options menu', async ({ page }) => {
    await page.goto('/lists');

    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Errands');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Errands', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Errands', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Errands' })).toBeVisible();

    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('menuitem', { name: 'Delete List?' }).click();

    await page.goto('/lists');
    await expect(page.getByRole('button', { name: 'Errands', exact: true })).toHaveCount(0);
  });
});
