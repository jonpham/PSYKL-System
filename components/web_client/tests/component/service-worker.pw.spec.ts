import { expect, type Page, test } from '@playwright/test';

const taskApiPattern = 'http://localhost:3000/tasks**';

test.describe('PWA Service Worker', () => {
  test.beforeEach(async ({ context }) => {
    await context.route(taskApiPattern, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders(),
        json: [],
        status: 200,
      });
    });
  });

  test('registers an owned Service Worker built from src/sw.ts', async ({ page }) => {
    await page.goto('/');

    const registration = await waitForServiceWorker(page);

    expect(registration).toEqual(
      expect.objectContaining({
        activeScriptUrl: expect.stringMatching(/\/sw\.js$/),
        controllerScriptUrl: expect.stringMatching(/\/sw\.js$/),
      }),
    );
    expect(await serviceWorkerSource(page)).toContain('PSYKL owned service worker');
  });

  test('serves app shell navigation while offline after first load', async ({ context, page }) => {
    await page.goto('/');
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await page.goto('/offline-shell-check');

    await expect(page.getByRole('heading', { name: 'PSYKL' })).toBeVisible();
  });

  test('serves stale GET /tasks data and refreshes the cache in the background', async ({ context, page }) => {
    let taskTitle = 'cached task v1';
    await context.unroute(taskApiPattern);
    await context.route(taskApiPattern, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        headers: corsHeaders(),
        json: [task(taskTitle)],
        status: 200,
      });
    });
    await page.goto('/');
    await waitForServiceWorker(page);

    await expect.poll(() => fetchTaskTitles(page)).toEqual(['cached task v1']);

    taskTitle = 'cached task v2';

    await expect(fetchTaskTitles(page)).resolves.toEqual(['cached task v1']);
    await expect.poll(() => fetchTaskTitles(page)).toEqual(['cached task v2']);
  });
});

async function waitForServiceWorker(page: Page): Promise<{
  activeScriptUrl: string | null;
  controllerScriptUrl: string | null;
}> {
  const registration = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    return await Promise.race([
      navigator.serviceWorker.ready.then(async (readyRegistration) => {
        if (!navigator.serviceWorker.controller) {
          await new Promise<void>((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
            setTimeout(resolve, 1_000);
          });
        }

        return {
          activeScriptUrl: readyRegistration.active?.scriptURL ?? null,
          controllerScriptUrl: navigator.serviceWorker.controller?.scriptURL ?? null,
        };
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 2_000);
      }),
    ]);
  });

  expect(registration).not.toBeNull();
  return registration as {
    activeScriptUrl: string | null;
    controllerScriptUrl: string | null;
  };
}

async function serviceWorkerSource(page: Page): Promise<string> {
  const response = await page.request.get('/sw.js');
  expect(response.ok()).toBe(true);
  return await response.text();
}

async function fetchTaskTitles(page: Page): Promise<string[]> {
  return await page.evaluate(async () => {
    const response = await fetch('http://localhost:3000/tasks');
    const tasks = (await response.json()) as { title: string }[];
    return tasks.map((taskRow) => taskRow.title);
  });
}

function task(title: string) {
  const now = new Date().toISOString();
  return {
    id: '0198f5c9-52f2-7000-8000-000000000001',
    user_id: 'local',
    title,
    created_at: now,
    completed_at: null,
    updated_at: now,
    server_updated_at: now,
    deleted_at: null,
  };
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, Idempotency-Key',
    'Access-Control-Allow-Origin': '*',
  };
}
