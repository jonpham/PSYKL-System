import type { BrowserContext, Page, Worker } from '@playwright/test';

const taskId = '0198f5c9-52f2-7000-8000-000000000010';

async function waitForServiceWorker(context: BrowserContext, page: Page): Promise<Worker> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  return context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
}

async function dispatchSync(worker: Worker, tag: string): Promise<void> {
  await worker.evaluate(async (syncTag) => {
    await new Promise<void>((resolve, reject) => {
      let waitUntilCalled = false;
      const event = new Event('sync') as Event & { tag: string; waitUntil: (promise: Promise<unknown>) => void };
      Object.defineProperty(event, 'tag', { value: syncTag });
      Object.defineProperty(event, 'waitUntil', {
        value: (promise: Promise<unknown>) => {
          waitUntilCalled = true;
          promise.then(() => resolve(), reject);
        },
      });

      self.dispatchEvent(event);
      if (!waitUntilCalled) {
        reject(new Error(`Service Worker did not handle ${syncTag}`));
      }
    });
  }, tag);
}

function task(title: string) {
  const now = new Date().toISOString();
  return {
    id: taskId,
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
export { corsHeaders, dispatchSync, task, waitForServiceWorker };
