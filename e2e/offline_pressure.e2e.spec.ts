import { expect, test } from '@playwright/test';

import { seedSyncQueue } from './helpers/idb-storage';
import { openDevice, setOffline, triggerQueuedReplay } from './helpers/multi-device';

test.describe('Offline sync pressure', () => {
  test('a user offline with 25 queued changes sees a banner telling them to reconnect', async ({ browser }) => {
    const device = await openDevice(browser);
    await setOffline(device, true);

    // Seeding writes straight to IndexedDB (100 real creates through the UI
    // is too slow for CI) — the app only re-reads the queue on its existing
    // change notifications, so trigger the same 'online' listener the real
    // reconnect path uses. Still offline: each fetch fails fast and the
    // entry is rescheduled, not dropped, so the seeded count survives.
    await seedSyncQueue(device, 25);
    await triggerQueuedReplay(device);

    // Exact count isn't asserted: the device's own default-list bootstrap
    // (useLists.default-list.ts) also enqueues one 'list' create entry on
    // first load, independent of this test's seeded 25 (same caveat as
    // task_list-offline-sync.e2e.spec.ts's taskQueueEntries filter).
    await expect(device.page.getByText(/\d+ changes waiting to sync\. Reconnect to save them\./)).toBeVisible();
  });

  test('a user offline with 100 queued changes cannot add a new task until they reconnect', async ({ browser }) => {
    const device = await openDevice(browser);
    await setOffline(device, true);

    await seedSyncQueue(device, 100);
    await triggerQueuedReplay(device);

    await expect(device.page.getByLabel('title')).toBeDisabled();
    await expect(device.page.getByLabel('title')).toHaveAttribute('placeholder', 'Reconnect to keep adding.');
  });
});
