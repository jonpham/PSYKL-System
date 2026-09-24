import type { Page } from '@playwright/test';

import { expect, test } from './helpers/isolated-test';

/**
 * One task on its own: what it is called, when it happened, and getting rid of
 * it without entering selection mode for a batch of one.
 */
test.describe('Task details', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user opens one task and reads when it was created and last changed', async ({ page }) => {
    await page.goto('/');
    const title = `renew the passport ${Date.now()}`;
    await createTask(page, title);

    await openDetails(page, title);

    const drawer = page.getByRole('dialog', { name: 'Task' });
    await expect(drawer.getByRole('group', { name: 'Created' })).not.toHaveText(/—/);
    await expect(drawer.getByRole('group', { name: 'Last updated' })).not.toHaveText(/—/);
    // Not finished, so there is no moment to show — an em dash, never a blank.
    await expect(drawer.getByRole('group', { name: 'Completed' })).toHaveText(/—/);
  });

  test('a user sees when a task was completed', async ({ page }) => {
    await page.goto('/');
    const title = `water the plants ${Date.now()}`;
    await createTask(page, title);
    await page.getByRole('checkbox', { name: `Mark ${title} complete` }).click();
    await expect(page.getByRole('checkbox', { name: `Mark ${title} incomplete` })).toBeChecked();

    await openDetails(page, title);

    await expect(page.getByRole('group', { name: 'Completed' })).not.toHaveText(/—/);
  });

  test('a user renames a task from its details and the new name survives a reload', async ({ page }) => {
    await page.goto('/');
    const original = `draft name ${Date.now()}`;
    const renamed = `settled name ${Date.now()}`;
    await createTask(page, original);

    await openDetails(page, original);
    // Nothing has changed yet, so there is nothing to save.
    await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    await page.getByRole('textbox', { name: 'Title' }).fill(renamed);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(renamed)).toBeVisible();
    await page.reload();
    await expect(page.getByText(renamed)).toBeVisible();
    await expect(page.getByText(original)).toHaveCount(0);
  });

  test('a user closes the details without changing the task', async ({ page }) => {
    await page.goto('/');
    const title = `leave me alone ${Date.now()}`;
    await createTask(page, title);

    await openDetails(page, title);
    await page.getByRole('textbox', { name: 'Title' }).fill('something else entirely');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog', { name: 'Task' })).toHaveCount(0);
    await expect(page.getByText(title)).toBeVisible();
  });

  test('a user deletes one task from its details, and it takes two presses', async ({ page }) => {
    await page.goto('/');
    const title = `cancel the subscription ${Date.now()}`;
    await createTask(page, title);

    await openDetails(page, title);
    // The first press only arms it: nothing is destroyed yet.
    await page.getByRole('button', { name: 'Delete task' }).click();
    await expect(page.getByRole('dialog', { name: 'Task' })).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();

    await page.getByRole('button', { name: `Confirm deleting ${title}` }).click();

    await expect(page.getByRole('dialog', { name: 'Task' })).toHaveCount(0);
    await expect(page.getByText(title)).toHaveCount(0);

    // Deleted, not destroyed: it is recoverable like any other deletion.
    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByRole('listitem', { name: title })).toBeVisible();
  });

  test('a user editing a title changes their mind about deleting', async ({ page }) => {
    await page.goto('/');
    const title = `keep me ${Date.now()}`;
    await createTask(page, title);

    await openDetails(page, title);
    await page.getByRole('button', { name: 'Delete task' }).click();
    await expect(page.getByRole('button', { name: `Confirm deleting ${title}` })).toBeVisible();

    // Editing changes what a delete would destroy, so the confirmation retires.
    await page.getByRole('textbox', { name: 'Title' }).fill(`${title} after all`);

    await expect(page.getByRole('button', { name: 'Delete task' })).toBeVisible();
  });

  test('a task with a long title keeps its shape when a user taps it to edit', async ({ page }) => {
    await page.goto('/');
    const title = `${'call the vet about the booster shot on Friday '.repeat(2)}${Date.now()}`;
    await createTask(page, title);

    const row = page.getByRole('listitem', { name: title });
    const resting = await row.boundingBox();
    expect(resting?.height ?? 0).toBeGreaterThan(44);

    await page.getByRole('button', { name: `Edit ${title}` }).click();

    // The field wraps the way the rendered title did, so the row does not jump.
    const editing = await row.boundingBox();
    expect(Math.abs((editing?.height ?? 0) - (resting?.height ?? 0))).toBeLessThanOrEqual(2);
  });

  test('a user cannot reach the list behind an open details drawer', async ({ page }) => {
    await page.goto('/');
    const title = `behind the drawer ${Date.now()}`;
    await createTask(page, title);

    await openDetails(page, title);

    // The capture button is covered by the drawer rather than floating over it.
    const capture = page.locator('.psykl-task-list__capture');
    const box = await capture.boundingBox();
    expect(box).not.toBeNull();
    const covering = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x as number, y as number)?.className ?? '',
      [(box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2],
    );
    expect(String(covering)).not.toContain('psykl-task-list__capture');
  });
});

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByRole('textbox', { name: 'New task title' }).fill(title);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByText(title)).toBeVisible();
}

/** Tapping the title focuses it for editing and reveals the details button. */
async function openDetails(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: `Edit ${title}` }).click();
  await page.getByRole('button', { name: `Details for ${title}` }).click();
  await expect(page.getByRole('dialog', { name: 'Task' })).toBeVisible();
}
