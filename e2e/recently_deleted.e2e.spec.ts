import { expect, test } from '@playwright/test';

/**
 * Rewritten for the `to-do-ui` shell: Recently Deleted stops being a modal
 * reached from a bordered button and becomes a navigation destination with its
 * own path. The restore behaviour itself is unchanged from `todo-experience`
 * Spec 2 — only the way the user gets there moved.
 *
 * The describe block is activated by DevTask 3. The list-restore test below
 * stays individually skipped past this Spec: deleting a list has no home on `/`
 * between here and Spec 4 (drafting decision C), so Spec 4 activates it
 * (`docs/specs/to-do-ui/20260921-Spec1-shell-navigation-and-lists.md`).
 */
test.describe.skip('recently deleted', () => {
  test('a user sees how many days remain before a deleted task is purged, then restores it', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('What needs doing?').fill('Milk');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Milk')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Milk' }).click();
    await page.getByRole('button', { name: 'Confirm delete Milk' }).click();
    await expect(page.getByText('Milk')).toHaveCount(0);

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByRole('listitem', { name: 'Milk' })).toBeVisible();
    await expect(page.getByText('30d')).toBeVisible();

    await page.getByRole('button', { name: 'Restore Milk' }).click();
    await expect(page.getByText('Nothing deleted in the last 30 days.')).toBeVisible();

    // Leaving a destination is navigation now, not dismissing a sheet.
    await page.goBack();
    await expect(page.getByText('Milk')).toBeVisible();
  });

  // Stays skipped when DevTask 3 activates the rest of this file — see above.
  // `to-do-ui` Spec 4 ships the list options menu and un-skips this test.
  test.skip('a user restores a deleted list and its tasks come back', async ({ page }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Groceries' }).click();

    await page.getByPlaceholder('What needs doing?').fill('Milk');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Milk')).toBeVisible();

    // The list options menu is Spec 4's work; these three lines are why this
    // test cannot activate with the rest of the file in DevTask 3.
    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('menuitem', { name: 'Delete List?' }).click();

    await page.goto('/recently-deleted');
    await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore Groceries' }).click();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Groceries' }).click();
    await expect(page.getByText('Milk')).toBeVisible();
  });
});
