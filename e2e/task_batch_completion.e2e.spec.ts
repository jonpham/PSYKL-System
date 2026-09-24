import { expect, test } from './helpers/isolated-test';
import { createTask, enterSelectionMode, select } from './helpers/selection';

test.describe('batch completion', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user marks several tasks complete in one action', async ({ page }) => {
    await page.goto('/');
    const stamp = Date.now();
    const [first, second] = [`rake ${stamp}`, `mow ${stamp}`];
    for (const title of [first, second]) {
      await createTask(page, title);
    }

    await enterSelectionMode(page);
    await select(page, first);
    await select(page, second);
    await page.getByRole('button', { name: 'Toggle completion of selected tasks' }).click();

    // No second gesture to get back: completing the batch leaves the mode.
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();

    await expect(page.getByRole('checkbox', { name: `Mark ${first} incomplete` })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: `Mark ${second} incomplete` })).toBeChecked();
    await page.reload();
    await expect(page.getByRole('checkbox', { name: `Mark ${first} incomplete` })).toBeChecked();
  });

  test('a user reopens several completed tasks in one action', async ({ page }) => {
    await page.goto('/');
    const stamp = Date.now();
    const [rake, mow] = [`rake ${stamp}`, `mow ${stamp}`];
    for (const title of [rake, mow]) {
      await createTask(page, title);
    }

    // Completing them one at a time is the state the toggle has to undo.
    for (const title of [rake, mow]) {
      await page.getByRole('checkbox', { name: `Mark ${title} complete` }).click();
    }
    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: /^Show Completed/ }).click();

    await enterSelectionMode(page);
    await select(page, rake);
    await select(page, mow);
    await page.getByRole('button', { name: 'Toggle completion of selected tasks' }).click();

    await expect(page.getByRole('checkbox', { name: `Mark ${rake} complete` })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: `Mark ${mow} complete` })).not.toBeChecked();
    await page.reload();
    await expect(page.getByRole('checkbox', { name: `Mark ${rake} complete` })).not.toBeChecked();
  });

  test('a user flips a mixed batch to the other side in one action', async ({ page }) => {
    await page.goto('/');
    const stamp = Date.now();
    const [done, open] = [`filed ${stamp}`, `draft ${stamp}`];
    for (const title of [done, open]) {
      await createTask(page, title);
    }
    await page.getByRole('checkbox', { name: `Mark ${done} complete` }).click();
    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: /^Show Completed/ }).click();

    await enterSelectionMode(page);
    await select(page, done);
    await select(page, open);
    await page.getByRole('button', { name: 'Toggle completion of selected tasks' }).click();

    // Each row lands on its own opposite, not on a shared outcome.
    await expect(page.getByRole('checkbox', { name: `Mark ${done} complete` })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: `Mark ${open} incomplete` })).toBeChecked();
  });
});
