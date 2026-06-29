import { expect, test } from '@playwright/test';

import { readSyncQueueLength, readTaskTitles, seedReplayLock, seedSyncQueue } from './service-worker-idb-test-utils';
import { corsHeaders, dispatchSync, task, waitForServiceWorker } from './service-worker-test-utils';

const taskApiPattern = 'http://localhost:3000/tasks**';

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
    await page.goto('/');
    const worker = await waitForServiceWorker(context, page);
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
    await page.goto('/');
    const worker = await waitForServiceWorker(context, page);
    await seedSyncQueue(page, { id: 'op-locked', taskTitle: 'locked task' });
    await seedReplayLock(page);

    await dispatchSync(worker, 'psykl-sync');

    await expect(readSyncQueueLength(page)).resolves.toBe(1);
    expect(createRequests).toBe(0);
  });
});
