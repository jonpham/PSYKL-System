import type { Page } from '@playwright/test';

import { expect, test } from './helpers/isolated-test';

/**
 * Acting on one task with a thumb: swipe it left for its actions, all the way
 * across to delete it, and tap the empty space below the list to start a new
 * one. The swipe is driven with the mouse, which sends the same pointer events
 * a finger does.
 */
test.describe('Task swipe actions', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test('a user swipes a task left and finds Details and Delete behind it', async ({ page }) => {
    await page.goto('/');
    const title = `swipe for actions ${Date.now()}`;
    await createTask(page, title);

    await swipeLeft(page, title, 140);

    await expect(page.getByRole('button', { name: `Details for ${title}` })).toBeVisible();
    await expect(page.getByRole('button', { name: `Delete ${title}` })).toBeVisible();
    // Framed while it is being acted on, so its edges stay legible.
    await expect(row(page, title)).toHaveAttribute('data-focused', 'true');
  });

  test('a user swipes a task all the way across to delete it, and can restore it', async ({ page }) => {
    await page.goto('/');
    const title = `swipe me away ${Date.now()}`;
    await createTask(page, title);

    await swipeLeft(page, title, 300);

    await expect(page.getByText(title)).toHaveCount(0);
    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByText(title)).toBeVisible();
  });

  test('a user deletes a task from its swipe actions in one press', async ({ page }) => {
    await page.goto('/');
    const title = `one press delete ${Date.now()}`;
    await createTask(page, title);

    await swipeLeft(page, title, 140);
    await page.getByRole('button', { name: `Delete ${title}` }).click();

    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("a user opens a task's details from its swipe actions", async ({ page }) => {
    await page.goto('/');
    const title = `details by swipe ${Date.now()}`;
    await createTask(page, title);

    await swipeLeft(page, title, 140);
    await page.getByRole('button', { name: `Details for ${title}` }).click();

    await expect(page.getByRole('dialog', { name: 'Task' })).toBeVisible();
  });

  test('a user who stops a swipe short leaves the task as it was', async ({ page }) => {
    await page.goto('/');
    const title = `half hearted ${Date.now()}`;
    await createTask(page, title);

    await swipeLeft(page, title, 40);

    await expect(page.getByRole('button', { name: `Delete ${title}` })).toHaveCount(0);
    await expect(row(page, title)).toHaveAttribute('data-focused', 'false');
    await expect(page.getByRole('button', { name: `Edit ${title}` })).toBeVisible();
  });

  test('a user closes an open task by tapping it, without starting an edit', async ({ page }) => {
    await page.goto('/');
    const title = `tap to close ${Date.now()}`;
    await createTask(page, title);
    await swipeLeft(page, title, 140);

    await page.getByRole('button', { name: `Close actions for ${title}` }).click();

    await expect(page.getByRole('button', { name: `Delete ${title}` })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Edit title' })).toHaveCount(0);
  });

  test('a user keeps only one task open at a time', async ({ page }) => {
    await page.goto('/');
    const first = `first open ${Date.now()}`;
    const second = `second open ${Date.now()}`;
    await createTask(page, first);
    await createTask(page, second);

    await swipeLeft(page, first, 140);
    await swipeLeft(page, second, 140);

    await expect(page.getByRole('button', { name: `Delete ${first}` })).toHaveCount(0);
    await expect(page.getByRole('button', { name: `Delete ${second}` })).toBeVisible();
  });

  test('a user taps the empty space below the list to start a new task', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/nothing to do yet/i)).toBeVisible();

    await page.locator('.psykl-task-list__empty-space').click();

    await expect(page.getByRole('textbox', { name: 'New task title' })).toBeFocused();
  });
});

function row(page: Page, title: string) {
  return page.getByRole('listitem', { name: title });
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByRole('textbox', { name: 'New task title' }).fill(title);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByText(title)).toBeVisible();
}

/**
 * Drags a row left by `distance` pixels at a thumb's pace — 10px every 40ms —
 * so the release is judged on distance, not read as a flick.
 */
async function swipeLeft(page: Page, title: string, distance: number): Promise<void> {
  const box = await row(page, title).boundingBox();
  if (!box) throw new Error(`no row for ${title}`);
  const y = box.y + box.height / 2;
  const startX = box.x + box.width - 8;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  for (let travelled = 10; travelled <= distance; travelled += 10) {
    await page.mouse.move(startX - travelled, y);
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
}
