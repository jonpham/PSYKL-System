import { expect, test } from '@playwright/test';

import { listLocalSyncQueue, listLocalTasks } from './helpers/idb-storage';
import {
  createTask,
  deleteTask,
  editTask,
  expectServerTaskHidden,
  expectServerTaskVisible,
  expectTaskHidden,
  expectTaskVisible,
  openDevice,
  openTwoDevices,
  reloadAndExpectTaskVisible,
  setOffline,
  type TaskRow,
  triggerQueuedReplay,
} from './helpers/multi-device';

test.describe('Task list offline sync', () => {
  test('two devices share one backend account but keep isolated browser storage', async ({ browser }) => {
    const { first, second, userId } = await openTwoDevices(browser);
    const title = `shared backend ${Date.now()}`;

    await createTask(first, title);
    await expectTaskVisible(first, title);
    await expectServerTaskVisible(userId, title);

    await expect(listLocalTasks(second)).resolves.toEqual([]);
    await reloadAndExpectTaskVisible(second, title);
    await expect(listLocalTasks(second)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ title })]));
  });

  test('offline-created Task syncs when the device returns online', async ({ browser }) => {
    const device = await openDevice(browser);
    const title = `offline create ${Date.now()}`;

    await setOffline(device, true);
    await createTask(device, title);
    await expectTaskVisible(device, title);
    await expect(listLocalSyncQueue(device)).resolves.toHaveLength(1);

    await setOffline(device, false);
    await triggerQueuedReplay(device);

    await expectServerTaskVisible(device.userId, title);
    await reloadAndExpectTaskVisible(device, title);
    await expect(listLocalSyncQueue(device)).resolves.toHaveLength(0);
  });

  test('newer client edit wins when two devices edit the same Task', async ({ browser }) => {
    const { first, second, userId } = await openTwoDevices(browser);
    const originalTitle = `conflict seed ${Date.now()}`;
    const olderTitle = `older edit ${Date.now()}`;
    const newerTitle = `newer edit ${Date.now()}`;

    await createTask(first, originalTitle);
    await expectServerTaskVisible(userId, originalTitle);
    await reloadAndExpectTaskVisible(second, originalTitle);

    await setOffline(first, true);
    await editTask(first, originalTitle, olderTitle);
    await expectTaskVisible(first, olderTitle);
    await editTask(second, originalTitle, newerTitle);
    await expectServerTaskVisible(userId, newerTitle);
    await setOffline(first, false);
    await triggerQueuedReplay(first);

    await reloadAndExpectTaskVisible(first, newerTitle);
    await reloadAndExpectTaskVisible(second, newerTitle);
    await expectTaskHidden(first, olderTitle);
  });

  test('delete on one device propagates and hides the Task on another device', async ({ browser }) => {
    const { first, second, userId } = await openTwoDevices(browser);
    const title = `delete sync ${Date.now()}`;

    await createTask(first, title);
    await expectServerTaskVisible(userId, title);
    await reloadAndExpectTaskVisible(second, title);

    await deleteTask(first, title);
    await expectServerTaskHidden(userId, title);
    await second.page.reload();

    await expectTaskHidden(second, title);
  });

  test('network drop during PATCH retries with one idempotent server write', async ({ browser }) => {
    const device = await openDevice(browser);
    const originalTitle = `retry seed ${Date.now()}`;
    const updatedTitle = `retry result ${Date.now()}`;
    let patchAttempts = 0;
    const idempotencyKeys: string[] = [];
    const serverResponses: TaskRow[] = [];

    await createTask(device, originalTitle);
    const originalTask = await expectServerTaskVisible(device.userId, originalTitle);
    await device.page.route('http://localhost:3000/tasks/**', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }
      patchAttempts += 1;
      idempotencyKeys.push(route.request().headers()['idempotency-key'] ?? '');
      if (patchAttempts === 1) {
        const response = await route.fetch({ headers: { ...route.request().headers(), 'X-User-Id': device.userId } });
        serverResponses.push((await response.json()) as TaskRow);
        await route.abort();
        return;
      }
      const response = await route.fetch({ headers: { ...route.request().headers(), 'X-User-Id': device.userId } });
      serverResponses.push((await response.json()) as TaskRow);
      await route.fulfill({ response });
    });

    await editTask(device, originalTitle, updatedTitle);
    await expectTaskVisible(device, updatedTitle);
    await triggerQueuedReplay(device);

    await expect.poll(async () => patchAttempts, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    await reloadAndExpectTaskVisible(device, updatedTitle);

    expect(Array.from(new Set(idempotencyKeys))).toHaveLength(1);
    expect(serverResponses).toHaveLength(2);
    expect(serverResponses[1]).toEqual(serverResponses[0]);

    const conflictingReplay = await fetch(`http://localhost:3000/tasks/${originalTask.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKeys[0] ?? '',
        'X-User-Id': device.userId,
      },
      body: JSON.stringify({
        title: `conflicting retry ${Date.now()}`,
        updated_at: new Date().toISOString(),
      }),
    });
    expect(conflictingReplay.status).toBe(409);
  });

  test('a queued change shows a pending-sync dot until it syncs', async ({ browser }) => {
    const device = await openDevice(browser);
    const title = `queued ${Date.now()}`;

    // Offline keeps the create queued past the 2s pending threshold, so the row
    // surfaces the pending-sync dot; the dot never appears for fast online syncs.
    await setOffline(device, true);
    await createTask(device, title);

    const row = device.page.getByRole('listitem').filter({ hasText: title });
    await expect(row.locator('[aria-label="Pending sync"]')).toBeVisible();
  });
});
