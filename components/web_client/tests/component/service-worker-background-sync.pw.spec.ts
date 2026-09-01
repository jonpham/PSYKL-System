import { expect, type Page, test } from '@playwright/test';

import { readSyncQueueLength, readTaskTitles, seedReplayLock, seedSyncQueue } from './service-worker-idb-test-utils';
import { corsHeaders, dispatchSync, task, waitForServiceWorker } from './service-worker-test-utils';

const taskApiPattern = 'http://localhost:3000/tasks**';
const listApiPattern = 'http://localhost:3000/lists**';

/**
 * `App` (DevTask 6, `todo-experience` Spec 1) creates a default "Tasks" list
 * on first mount and enqueues its own `entity_type: 'list'` create op — the
 * queue these tests seed into is no longer guaranteed empty at that point.
 * Wait for the bootstrap write to settle (two consecutive equal reads) so
 * the tests can assert relative to a known baseline instead of a hardcoded
 * absolute count.
 */
async function waitForQueueToSettle(page: Page): Promise<number> {
  let previous = -1;
  await expect
    .poll(async () => {
      const current = await readSyncQueueLength(page);
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  return previous;
}

function list() {
  const now = new Date().toISOString();
  return {
    id: '0198f5c9-52f2-7000-8000-0000000000c0',
    user_id: 'local',
    title: 'Tasks',
    position: 'a0',
    created_at: now,
    updated_at: now,
    server_updated_at: now,
    deleted_at: null,
  };
}

test.describe('PWA Service Worker Background Sync', () => {
  test('drains one queued operation when a psykl-sync event fires', async ({ context, page }) => {
    let createRequests = 0;
    await context.route(taskApiPattern, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ contentType: 'application/json', headers: corsHeaders(), json: [], status: 200 });
        return;
      }

      createRequests += 1;
      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders(),
        json: task('background sync task'),
        status: 201,
      });
    });
    // The default-list bootstrap enqueues a `list` create op that also has
    // to drain for the queue to reach zero.
    await context.route(listApiPattern, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fulfill({ contentType: 'application/json', headers: corsHeaders(), json: [], status: 200 });
        return;
      }
      await route.fulfill({ contentType: 'application/json', headers: corsHeaders(), json: list(), status: 201 });
    });
    await page.goto('/');
    const worker = await waitForServiceWorker(context, page);
    await waitForQueueToSettle(page);
    await seedSyncQueue(page, { id: 'op-background-sync', taskTitle: 'background sync task' });

    await dispatchSync(worker, 'psykl-sync');

    await expect.poll(() => readSyncQueueLength(page)).toBe(0);
    await expect(readTaskTitles(page)).resolves.toEqual(['background sync task']);
    expect(createRequests).toBe(1);
  });

  test('yields when a page replay lock is already fresh', async ({ context, page }) => {
    let createRequests = 0;
    await context.route(taskApiPattern, async (route) => {
      createRequests += route.request().method() === 'POST' ? 1 : 0;
      await route.fulfill({ contentType: 'application/json', headers: corsHeaders(), json: [], status: 200 });
    });
    await context.route(listApiPattern, async (route) => {
      createRequests += route.request().method() === 'POST' ? 1 : 0;
      await route.fulfill({ contentType: 'application/json', headers: corsHeaders(), json: [], status: 200 });
    });
    await page.goto('/');
    const worker = await waitForServiceWorker(context, page);
    const baseline = await waitForQueueToSettle(page);
    await seedSyncQueue(page, { id: 'op-locked', taskTitle: 'locked task' });
    await seedReplayLock(page);

    await dispatchSync(worker, 'psykl-sync');

    // A fresh lock means the sync event yields entirely — nothing drains, so
    // the queue holds exactly the pre-seed baseline plus this test's own op.
    await expect(readSyncQueueLength(page)).resolves.toBe(baseline + 1);
    expect(createRequests).toBe(0);
  });
});
