import { listLocalSyncQueue } from './helpers/idb-storage';
import { expect, test } from './helpers/isolated-test';
import {
  editTask,
  expectServerTaskVisible,
  expectTaskVisible,
  openDevice,
  openTwoDevices,
  reloadAndExpectTaskVisible,
  setOffline,
  triggerQueuedReplay,
} from './helpers/multi-device';

test.describe('sync view', () => {
  test('a user opens Sync and sees what is waiting', async ({ browser }) => {
    const device = await openDevice(browser);
    await setOffline(device, true);

    await device.page.getByRole('button', { name: 'New Task' }).click();
    await device.page.getByRole('textbox', { name: 'New task title' }).fill('post the letter');
    await device.page.keyboard.press('Enter');
    await device.page.keyboard.press('Escape');

    await device.page.getByRole('button', { name: /^Sync (clear|needs attention)$/ }).click();

    await expect(device.page.getByRole('heading', { level: 2, name: 'Sync' })).toBeVisible();
    await expect(device.page.getByRole('region', { name: 'Waiting to sync' })).toContainText('Added a task');

    await setOffline(device, false);
    await device.context.close();
  });

  test('a user whose changes have all reached the server is told so', async ({ page }) => {
    await page.goto('/sync');

    await expect(page.getByText('Everything is synced.')).toBeVisible();
  });

  test('a user is told when another device replaced their edit', async ({ browser }) => {
    const { first, second, userId } = await openTwoDevices(browser);
    const stamp = Date.now();
    const original = `dentist ${stamp}`;
    const mine = `Dentist: reschedule ${stamp}`;
    const theirs = `Call the dentist back ${stamp}`;

    await first.page.getByRole('button', { name: 'New Task' }).click();
    await first.page.getByRole('textbox', { name: 'New task title' }).fill(original);
    await first.page.keyboard.press('Enter');
    await first.page.keyboard.press('Escape');
    await expectServerTaskVisible(userId, original);
    await reloadAndExpectTaskVisible(second, original);

    // This device edits offline; the other device edits the same task and wins.
    await setOffline(first, true);
    await editTask(first, original, mine);
    await expectTaskVisible(first, mine);
    await editTask(second, original, theirs);
    await expectServerTaskVisible(userId, theirs);

    await setOffline(first, false);
    await triggerQueuedReplay(first);
    // The conflict is only detected when the losing patch actually reaches the
    // server, so wait for the queue to drain rather than racing it.
    await expect
      .poll(async () => (await listLocalSyncQueue(first)).filter((entry) => entry.entity_type === 'task'), {
        timeout: 15_000,
      })
      .toEqual([]);
    await reloadAndExpectTaskVisible(first, theirs);

    // The losing device keeps the conflict where the user can find it later,
    // with the words they typed still readable.
    await first.page.goto('/sync');
    const replaced = first.page.getByRole('region', { name: 'Replaced by another device' });
    await expect(replaced).toBeVisible();
    await replaced.getByRole('button', { name: /what happened/i }).click();
    await expect(replaced).toContainText(mine);
    await expect(replaced).toContainText(theirs);

    await replaced.getByRole('button', { name: 'Dismiss' }).click();
    await expect(first.page.getByRole('region', { name: 'Replaced by another device' })).toHaveCount(0);

    await first.context.close();
    await second.context.close();
  });
});
