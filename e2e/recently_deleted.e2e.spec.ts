import { expect, test } from '@playwright/test';

test.describe('recently deleted', () => {
  test('a user sees how many days remain before a deleted task is purged, then restores it', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('What needs doing?').fill('Milk');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Milk')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Milk' }).click();
    await page.getByRole('button', { name: 'Confirm delete Milk' }).click();
    await expect(page.getByText('Milk')).toHaveCount(0);

    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByRole('listitem', { name: 'Milk' })).toBeVisible();
    await expect(page.getByText('30d')).toBeVisible();

    await page.getByRole('button', { name: 'Restore Milk' }).click();
    await expect(page.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('Milk')).toBeVisible();
  });

  test('a user restores a deleted list and its tasks come back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open list switcher' }).click();
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List name').fill('Groceries');
    await page.keyboard.press('Enter');
    await page.getByRole('listitem', { name: 'Groceries' }).click();
    await page.getByPlaceholder('What needs doing?').fill('Bread');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Bread')).toBeVisible();

    await page.getByRole('button', { name: 'Open list switcher' }).click();
    await page.getByRole('button', { name: 'Delete Groceries' }).click();
    await expect(page.getByRole('listitem', { name: 'Groceries' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore Groceries' }).click();
    // Scoped: the list switcher's own "Close" button is also visible here.
    await page.getByLabel('Recently Deleted').getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: 'Open list switcher' }).click();
    await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
    await page.getByRole('listitem', { name: 'Groceries' }).click();
    await expect(page.getByText('Bread')).toBeVisible();
  });
});
