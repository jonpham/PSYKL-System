import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user opens the navigation and sees every place they can go', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();

    const navigation = page.getByRole('navigation', { name: 'PSYKL navigation' });
    await expect(navigation.getByRole('button', { name: 'Lists', exact: true })).toBeVisible();
    await expect(navigation.getByRole('button', { name: 'Sync' })).toBeVisible();
    await expect(navigation.getByRole('button', { name: 'Recently Deleted' })).toBeVisible();
    await expect(navigation.getByRole('button', { name: 'Settings' })).toBeVisible();

    // The user's own lists sit under the Lists destination, not beside it.
    await expect(navigation.getByRole('button', { name: 'Tasks' })).toBeVisible();
  });

  test('a user folds their lists away to see the rest of the navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    const navigation = page.getByRole('navigation', { name: 'PSYKL navigation' });
    await expect(navigation.getByRole('button', { name: 'Tasks', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Collapse Lists' }).click();
    await expect(navigation.getByRole('button', { name: 'Tasks', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Expand Lists' }).click();
    await expect(navigation.getByRole('button', { name: 'Tasks', exact: true })).toBeVisible();
  });

  test('a user dismisses the navigation with the keyboard and lands back on their list', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open PSYKL navigation' });
    await trigger.click();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('navigation', { name: 'PSYKL navigation' })).toBeHidden();
    // Focus returns to where the user left it, rather than to the page body.
    await expect(trigger).toBeFocused();
  });

  test('a user reaches Recently Deleted and Settings from the navigation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByRole('heading', { name: 'Recently Deleted' })).toBeVisible();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('a user returns to their list with the browser back button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.goBack();

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });

  test('a user opens a destination directly from a pasted link', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test.skip('a user sees at a glance whether their changes have synced', async ({ page }) => {
    await page.goto('/');

    // Chrome, not an interruption: one control in the header carries the signal.
    await expect(page.getByRole('button', { name: /^Sync (clear|needs attention)$/ })).toBeVisible();
  });

  test.skip('a user switches between their lists from the navigation', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Lists' }).click();
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Groceries' }).click();

    // Choosing a list closes the drawer and takes the user straight to it.
    await expect(page.getByRole('navigation', { name: 'PSYKL navigation' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Groceries' })).toBeVisible();
  });
});
