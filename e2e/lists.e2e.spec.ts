import { expect, test } from '@playwright/test';

test.describe('lists', () => {
  test('a user creates a list and it appears in the list switcher', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open list switcher' }).click();
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('List name').fill('Groceries');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
  });

  test('a user creates a task while a specific list is open and the task lands in that list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open list switcher' }).click();
    await page.getByRole('listitem', { name: 'Groceries' }).click();
    await page.getByPlaceholder('What needs doing?').fill('Milk');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Milk')).toBeVisible();

    await page.getByRole('button', { name: 'Open list switcher' }).click();
    await page.getByRole('listitem', { name: 'Tasks' }).click();
    await expect(page.getByText('Milk')).toHaveCount(0);
  });

  test("a user's existing tasks from before lists existed appear in the default list", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Tasks/ })).toBeVisible();
  });
});
