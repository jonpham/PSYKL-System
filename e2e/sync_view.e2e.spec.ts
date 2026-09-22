import { expect, test } from '@playwright/test';

import { openDevice, setOffline } from './helpers/multi-device';

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
});
