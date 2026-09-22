import { seedSyncQueue } from './helpers/idb-storage';
import { expect, test } from './helpers/isolated-test';
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
    // The nag is no longer a banner over the list: the header control carries
    // the signal, and the Sync destination carries the detail.
    await expect(device.page.getByRole('button', { name: 'Sync needs attention' })).toBeVisible();

    await device.page.goto('/sync');
    await expect(device.page.getByRole('region', { name: 'Waiting to sync' })).toBeVisible();
  });

  test('a user offline with 100 queued changes cannot add a new task until they reconnect', async ({ browser }) => {
    const device = await openDevice(browser);
    await setOffline(device, true);

    await seedSyncQueue(device, 100);
    await triggerQueuedReplay(device);

    // Capture is refused at the control itself now, not inside a form field.
    await expect(device.page.getByRole('button', { name: 'Reconnect to keep adding.' })).toBeDisabled();
  });
});
