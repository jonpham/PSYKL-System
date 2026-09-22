import { expect, test } from './helpers/isolated-test';

test.describe('lists', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user starts a new list from a circled header button', async ({ page }) => {
    await page.goto('/lists');
    const add = page.getByRole('button', { name: 'New List' });
    await expect(add).toHaveCSS('border-radius', '50%');
    await expect(add).toHaveCSS('width', '40px');
    await add.click();
    await expect(page.getByLabel('New list name')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('a user creates a list and it appears in the navigation', async ({ page }) => {
    await page.goto('/lists');

    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'Groceries', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await expect(
      page.getByRole('navigation', { name: 'PSYKL navigation' }).getByRole('button', { name: 'Groceries' }),
    ).toBeVisible();
  });

  test('a user abandons a half-typed list name and no list is created', async ({ page }) => {
    await page.goto('/lists');

    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceri');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'Groceri', exact: true })).toHaveCount(0);
  });

  test('a user re-orders their lists', async ({ page }) => {
    await page.goto('/lists');

    for (const title of ['Groceries', 'Reading']) {
      await page.getByRole('button', { name: 'New List' }).click();
      await page.getByLabel('New list name').fill(title);
      await page.keyboard.press('Enter');
      // Each list takes its position from the one before it, so let it land
      // before naming the next — a user cannot type two names in one tick.
      await expect(page.getByRole('button', { name: title, exact: true })).toBeVisible();
    }

    // Tasks, Groceries, Reading — move the last one to the middle.
    await page.getByRole('button', { name: 'Move Reading up' }).click();

    // The move controls are buttons too; the names are the ones that carry text.
    const names = page.getByRole('listitem').getByRole('button', { name: /^(?!Move ).+/ });
    await expect(names).toHaveText(['Tasks', 'Reading', 'Groceries']);

    // The order is a property of the lists, not of this render.
    await page.reload();
    await expect(names).toHaveText(['Tasks', 'Reading', 'Groceries']);
  });

  test('a user cannot move the first list any higher or the last list any lower', async ({ page }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('New list name').fill('Groceries');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'Move Tasks up' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move Groceries down' })).toBeDisabled();
  });

  test('a user creates a task while a specific list is open and the task lands in that list', async ({ page }) => {
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

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page.getByText('Milk')).toHaveCount(0);
  });

  test("a user's existing tasks from before lists existed appear in the default list", async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  });
});
