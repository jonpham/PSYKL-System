import { expect, test } from '@playwright/test';

/**
 * Rewritten for the `to-do-ui` shell: list management moves off the
 * list-switcher sheet and onto the Lists destination. Written ahead of the
 * implementation so the expected end-state UX can be reviewed before any of it
 * is built (`docs/specs/to-do-ui/20260921-Spec1-shell-navigation-and-lists.md`).
 *
 * Renaming and deleting a list are deliberately absent — the accepted prototype
 * never designed either, and both are deferred past Spec 6 (drafting decisions
 * B and C in that spec).
 *
 * Each test names the DevTask that activates it. Un-skip there, never earlier.
 */
test.describe.skip('lists', () => {
  // Activated by DevTask 4.
  test('a user creates a list and it appears in the navigation', async ({ page }) => {
    await page.goto('/lists');

    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'Groceries' })).toBeVisible();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await expect(
      page.getByRole('navigation', { name: 'PSYKL navigation' }).getByRole('button', { name: 'Groceries' }),
    ).toBeVisible();
  });

  // Activated by DevTask 4.
  test('a user abandons a half-typed list name and no list is created', async ({ page }) => {
    await page.goto('/lists');

    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceri');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'Groceri' })).toHaveCount(0);
  });

  // Activated by DevTask 4.
  test('a user re-orders their lists', async ({ page }) => {
    await page.goto('/lists');

    for (const title of ['Groceries', 'Reading']) {
      await page.getByRole('button', { name: 'New List' }).click();
      await page.getByLabel('New list name').fill(title);
      await page.keyboard.press('Enter');
    }

    // Tasks, Groceries, Reading — move the last one to the middle.
    await page.getByRole('button', { name: 'Move Reading up' }).click();

    const names = page.getByRole('listitem').getByRole('button');
    await expect(names).toHaveText(['Tasks', 'Reading', 'Groceries']);

    // The new order is the order the navigation shows, and it survives a reload.
    await page.reload();
    await expect(names).toHaveText(['Tasks', 'Reading', 'Groceries']);
  });

  // Activated by DevTask 4.
  test('a user cannot move the first list any higher or the last list any lower', async ({ page }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'Move Tasks up' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Groceries down' })).toBeDisabled();
  });

  // Activated by DevTask 4.
  test('a user creates a task while a specific list is open and the task lands in that list', async ({ page }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Groceries' }).click();

    await page.getByPlaceholder('What needs doing?').fill('Milk');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Milk')).toBeVisible();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page.getByText('Milk')).toHaveCount(0);
  });

  // Activated by DevTask 2.
  test("a user's existing tasks from before lists existed appear in the default list", async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });
});
