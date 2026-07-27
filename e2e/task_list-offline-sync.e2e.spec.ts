import { type Browser, expect, type Page, test } from '@playwright/test';

// Skipped until Spec 6's offline / multi-device harness lands (see the S6
// execution spec). Activated there; kept here so the intended offline sync
// behaviors are documented as soon as they are user-visible.
test.describe.skip('Task list offline sync', () => {
  test('offline-created Task syncs when the device returns online', async ({ browser }) => {
    const device = await openDevice(browser);
    const title = `offline create ${Date.now()}`;

    await device.context.setOffline(true);
    await createTask(device.page, title);
    await expectTaskVisible(device.page, title);

    await device.context.setOffline(false);
    await device.page.reload();

    await expectTaskVisible(device.page, title);
  });

  test('newer client edit wins when two devices edit the same Task', async ({ browser }) => {
    const userId = uniqueUserId();
    const first = await openDevice(browser, userId);
    const second = await openDevice(browser, userId);
    const originalTitle = `conflict seed ${Date.now()}`;
    const olderTitle = `older edit ${Date.now()}`;
    const newerTitle = `newer edit ${Date.now()}`;

    await createTask(first.page, originalTitle);
    await second.page.reload();
    await expectTaskVisible(second.page, originalTitle);

    await first.context.setOffline(true);
    await editTask(first.page, originalTitle, olderTitle);
    await editTask(second.page, originalTitle, newerTitle);
    await first.context.setOffline(false);
    await first.page.reload();
    await second.page.reload();

    await expectTaskVisible(first.page, newerTitle);
    await expectTaskVisible(second.page, newerTitle);
    await expect(first.page.getByText(olderTitle)).not.toBeVisible();
  });

  test('delete on one device propagates and hides the Task on another device', async ({ browser }) => {
    const userId = uniqueUserId();
    const first = await openDevice(browser, userId);
    const second = await openDevice(browser, userId);
    const title = `delete sync ${Date.now()}`;

    await createTask(first.page, title);
    await second.page.reload();
    await expectTaskVisible(second.page, title);

    await deleteTask(first.page, title);
    await second.page.reload();

    await expect(second.page.getByText(title)).not.toBeVisible();
  });

  test('network drop during PATCH retries with one idempotent server write', async ({ browser }) => {
    const device = await openDevice(browser);
    const originalTitle = `retry seed ${Date.now()}`;
    const updatedTitle = `retry result ${Date.now()}`;
    let patchAttempts = 0;

    await createTask(device.page, originalTitle);
    await device.page.route('http://localhost:3000/tasks/**', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }
      patchAttempts += 1;
      if (patchAttempts === 1) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await editTask(device.page, originalTitle, updatedTitle);
    await expectTaskVisible(device.page, updatedTitle);
    await device.page.reload();

    await expectTaskVisible(device.page, updatedTitle);
    expect(patchAttempts).toBeGreaterThanOrEqual(2);
  });

  test('a queued change shows a pending-sync dot until it syncs', async ({ browser }) => {
    const device = await openDevice(browser);
    const title = `queued ${Date.now()}`;

    // Offline keeps the create queued past the 2s pending threshold, so the row
    // surfaces the pending-sync dot; the dot never appears for fast online syncs.
    await device.context.setOffline(true);
    await createTask(device.page, title);

    const row = device.page.getByRole('listitem').filter({ hasText: title });
    await expect(row.locator('[aria-label="Pending sync"]')).toBeVisible();
  });
});

async function openDevice(browser: Browser, userId = uniqueUserId()) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('http://localhost:3000/**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'X-User-Id': userId,
      },
    });
  });
  await page.goto('/');
  return { context, page };
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('textbox', { name: /title/i }).fill(title);
  await page.getByRole('button', { name: /create/i }).click();
}

async function editTask(page: Page, currentTitle: string, nextTitle: string): Promise<void> {
  await page.getByText(currentTitle).click();
  await page.getByRole('textbox', { name: /title/i }).fill(nextTitle);
  await page.getByRole('textbox', { name: /title/i }).press('Enter');
}

async function deleteTask(page: Page, title: string): Promise<void> {
  await page
    .getByRole('listitem')
    .filter({ hasText: title })
    .getByRole('button', { name: /delete/i })
    .click();
  await page.getByRole('button', { name: /confirm delete/i }).click();
}

async function expectTaskVisible(page: Page, title: string): Promise<void> {
  await expect(page.getByText(title)).toBeVisible();
}

function uniqueUserId(): string {
  return `e2e-m2-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
