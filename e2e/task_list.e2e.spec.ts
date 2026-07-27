import { expect, type Page, test } from '@playwright/test';

// This suite is the plain-language record of what a user can do with the Task
// list in the PWA. Each `test(...)` title reads as a user story; collapsed to
// their titles, these tests describe the client's supported behaviors.

test.describe('Task list', () => {
  test.beforeEach(async ({ page }) => {
    const userId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await page.route('http://localhost:3000/**', async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          'X-User-Id': userId,
        },
      });
    });
  });

  test('a user creates a task and sees it in the list', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'PSYKL' })).toBeVisible();
    await expect(page.getByText(/no tasks yet/i)).toBeVisible();

    const title = `buy milk ${Date.now()}`;
    await createTask(page, title);

    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(/no tasks yet/i)).not.toBeVisible();
  });

  test('a user sees their tasks listed newest first', async ({ page }) => {
    await page.goto('/');

    const titles = [`first ${Date.now()}`, `second ${Date.now()}`, `third ${Date.now()}`];
    for (const title of titles) {
      await createTask(page, title);
      await expect(page.getByText(title)).toBeVisible();
    }

    await expect(taskTitleButtons(page)).toHaveText([...titles].reverse());
  });

  test('a user edits a task title inline and it persists', async ({ page }) => {
    await page.goto('/');
    const original = `draft ${Date.now()}`;
    const edited = `final ${Date.now()}`;
    await createTask(page, original);
    await expect(page.getByText(original)).toBeVisible();

    await editTaskTitle(page, original, edited);

    await expect(page.getByText(edited)).toBeVisible();
    await expect(page.getByText(original)).not.toBeVisible();
    await page.reload();
    await expect(page.getByText(edited)).toBeVisible();
  });

  test('a user marks a task complete and it stays complete after reload', async ({ page }) => {
    await page.goto('/');
    const title = `finish report ${Date.now()}`;
    await createTask(page, title);

    await page.getByRole('checkbox', { name: markCompleteName(title) }).check();

    await expect(page.getByRole('checkbox', { name: markIncompleteName(title) })).toBeChecked();
    await page.reload();
    await expect(page.getByRole('checkbox', { name: markIncompleteName(title) })).toBeChecked();
  });

  test('a user deletes a task with a two-click confirmation', async ({ page }) => {
    await page.goto('/');
    const title = `obsolete ${Date.now()}`;
    await createTask(page, title);
    await expect(page.getByText(title)).toBeVisible();

    await deleteTask(page, title);

    await expect(page.getByText(title)).not.toBeVisible();
    await page.reload();
    await expect(page.getByText(title)).not.toBeVisible();
  });

  // Skipped until Spec 6's offline harness can hold a mutation unsynced past the
  // 2-second pending threshold. Documents the intended behavior: a "pending
  // sync" dot appears on a row whose change has not yet reached the server, so
  // the user knows their work is queued (e.g. while offline). Online syncs
  // complete within the threshold and never surface the dot.
  test.skip('a user sees a pending-sync dot while a change stays unsynced', async ({ page }) => {
    await page.goto('/');
    const title = `queued ${Date.now()}`;
    await createTask(page, title);

    // Requires offline / stalled-network control (Spec 6) to keep the create op
    // queued for longer than the 2s threshold.
    const row = page.getByRole('listitem').filter({ hasText: title });
    await expect(row.locator('[aria-label="Pending sync"]')).toBeVisible();
  });
});

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('textbox', { name: /^title$/i }).fill(title);
  await page.getByRole('button', { name: /create/i }).click();
}

async function editTaskTitle(page: Page, currentTitle: string, nextTitle: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^edit ${escapeRegExp(currentTitle)}$`, 'i') }).click();
  const input = page.getByRole('textbox', { name: /edit title/i });
  await input.fill(nextTitle);
  await input.press('Enter');
}

async function deleteTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`^delete ${escapeRegExp(title)}$`, 'i') }).click();
  await page.getByRole('button', { name: new RegExp(`^confirm delete ${escapeRegExp(title)}$`, 'i') }).click();
}

function taskTitleButtons(page: Page) {
  return page.getByRole('listitem').getByRole('button', { name: /^edit /i });
}

function markCompleteName(title: string): RegExp {
  return new RegExp(`^mark ${escapeRegExp(title)} complete$`, 'i');
}

function markIncompleteName(title: string): RegExp {
  return new RegExp(`^mark ${escapeRegExp(title)} incomplete$`, 'i');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
