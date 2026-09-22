import { expect, test } from './helpers/isolated-test';

test.describe('recently deleted', () => {
  test.use({ viewport: { height: 844, width: 390 } });

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

    // Leaving a destination is navigation, not dismissing a sheet.
    await page.goBack();
    await expect(page.getByText('Milk')).toBeVisible();
  });

  test.skip('a user restores a deleted list and its tasks come back', async ({ page }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Groceries' }).click();

    await page.getByPlaceholder('What needs doing?').fill('Milk');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Milk')).toBeVisible();

    // Deleting a list takes a second tap rather than a dialog: the delete is
    // soft and recoverable from this very screen.
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
