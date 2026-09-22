import type { Page } from '@playwright/test';

/**
 * Resolves once the service worker is actually controlling the page.
 *
 * Registration finishing is not the same thing as control being taken, and
 * until control is taken nothing can serve a navigation from the cache — a
 * `page.goto` issued offline before that point fails outright with
 * ERR_INTERNET_DISCONNECTED rather than rendering the app shell.
 */
async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      (globalThis as { navigator?: { serviceWorker?: { controller: unknown } } }).navigator?.serviceWorker
        ?.controller != null,
    undefined,
    { timeout: 10_000 },
  );
}

export { waitForServiceWorkerControl };
