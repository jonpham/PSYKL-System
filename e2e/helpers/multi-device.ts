import { type Browser, expect, type Page } from '@playwright/test';

const apiBaseUrl = process.env['E2E_API_URL'] ?? 'http://localhost:3000';

type Device = Awaited<ReturnType<typeof openDevice>>;
type TaskRow = {
  completed_at: string | null;
  created_at: string;
  deleted_at: string | null;
  id: string;
  server_updated_at: string;
  title: string;
  updated_at: string;
  user_id: string;
};

async function openDevice(browser: Browser, userId = uniqueUserId()) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route(`${apiBaseUrl}/**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'X-User-Id': userId,
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PSYKL' })).toBeVisible();
  return { context, page, userId };
}

async function openTwoDevices(browser: Browser, userId = uniqueUserId()) {
  const first = await openDevice(browser, userId);
  const second = await openDevice(browser, userId);
  return { first, second, userId };
}

async function setOffline(device: Device, offline: boolean): Promise<void> {
  await device.context.setOffline(offline);
}

async function createTask(device: Device, title: string): Promise<void> {
  await device.page.getByRole('textbox', { name: /^title$/i }).fill(title);
  await device.page.getByRole('button', { name: /create/i }).click();
}

async function editTask(device: Device, currentTitle: string, nextTitle: string): Promise<void> {
  const row = taskRow(device.page, currentTitle);
  await row.getByRole('button', { name: new RegExp(`^edit ${escapeRegExp(currentTitle)}$`, 'i') }).click();
  const input = device.page.getByRole('textbox', { name: /^edit title$/i });
  await input.fill(nextTitle);
  await input.press('Enter');
}

async function completeTask(device: Device, title: string): Promise<void> {
  await taskRow(device.page, title)
    .getByRole('checkbox', { name: new RegExp(`^mark ${escapeRegExp(title)} complete$`, 'i') })
    .click();
}

async function deleteTask(device: Device, title: string): Promise<void> {
  const row = taskRow(device.page, title);
  await row.getByRole('button', { name: new RegExp(`^delete ${escapeRegExp(title)}$`, 'i') }).click();
  await row.getByRole('button', { name: new RegExp(`^confirm delete ${escapeRegExp(title)}$`, 'i') }).click();
}

async function expectTaskVisible(device: Device, title: string): Promise<void> {
  await expect(taskRow(device.page, title)).toBeVisible();
}

async function expectTaskHidden(device: Device, title: string): Promise<void> {
  await expect(taskRow(device.page, title)).not.toBeVisible();
}

async function reloadAndExpectTaskVisible(device: Device, title: string): Promise<void> {
  await device.page.reload();
  await expectTaskVisible(device, title);
}

async function triggerQueuedReplay(device: Device): Promise<void> {
  await device.page.waitForTimeout(2_200);
  await device.page.evaluate(() => {
    (globalThis as any).dispatchEvent(new Event('online'));
  });
}

async function expectServerTaskVisible(userId: string, title: string): Promise<TaskRow> {
  let matched: TaskRow | undefined;
  await expect
    .poll(
      async () => {
        const tasks = await fetchServerTasks(userId, true);
        matched = tasks.find((task) => task.title === title && task.deleted_at === null);
        return matched ? 1 : 0;
      },
      { timeout: 10_000 },
    )
    .toBe(1);
  return matched!;
}

async function expectServerTaskHidden(userId: string, title: string): Promise<TaskRow> {
  let matched: TaskRow | undefined;
  await expect
    .poll(
      async () => {
        const tasks = await fetchServerTasks(userId, true);
        matched = tasks.find((task) => task.title === title);
        return matched?.deleted_at === null ? 1 : 0;
      },
      { timeout: 10_000 },
    )
    .toBe(0);
  return matched!;
}

async function fetchServerTasks(userId: string, includeDeleted = false): Promise<TaskRow[]> {
  const url = new URL('/tasks', apiBaseUrl);
  if (includeDeleted) {
    url.searchParams.set('include_deleted', '1');
  }
  const response = await fetch(url, { headers: { 'X-User-Id': userId } });
  expect(response.ok).toBe(true);
  return (await response.json()) as TaskRow[];
}

function taskRow(page: Page, title: string) {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('button', { name: new RegExp(`^edit ${escapeRegExp(title)}$`, 'i') }) });
}

function uniqueUserId(): string {
  return `e2e-m2-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export {
  completeTask,
  createTask,
  deleteTask,
  editTask,
  expectServerTaskHidden,
  expectServerTaskVisible,
  expectTaskHidden,
  expectTaskVisible,
  fetchServerTasks,
  openDevice,
  openTwoDevices,
  reloadAndExpectTaskVisible,
  setOffline,
  triggerQueuedReplay,
};
export type { Device, TaskRow };
