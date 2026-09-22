import { test as base } from '@playwright/test';

const apiBaseUrl = process.env['E2E_API_URL'] ?? 'http://localhost:3000';

/**
 * Every test starts against a service that holds nothing.
 *
 * Playwright already hands each test a fresh browser context, so local state is
 * isolated for free; the service is the one thing every test shares. Without
 * this, a list created by one test hydrates into the next one's navigation and
 * the next one's assertions about ordering.
 *
 * Per-user isolation would be the better answer — and is what the Task specs
 * already do by injecting a unique `X-User-Id` — but the List specs cannot use
 * it while the default-list id collides across accounts (GitHub issue #117).
 * Resetting the service is the stop-gap that unblocks the suite without a
 * schema change.
 */
const test = base.extend<{ cleanServer: void }>({
  cleanServer: [
    // Playwright requires the destructuring pattern here even when the fixture
    // depends on nothing, so the empty pattern is deliberate.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await resetServerState();
      await use();
    },
    { auto: true },
  ],
});

async function resetServerState(): Promise<void> {
  const response = await fetch(new URL('/test/reset', apiBaseUrl), {
    headers: { 'X-User-Id': 'e2e-reset' },
    method: 'POST',
  });

  if (response.status === 404) {
    throw new Error(
      'POST /test/reset answered 404. The service under test was started without PSYKL_TEST_RESET=enabled — ' +
        'bring the stack up with `pnpm verify:e2e:up`, which applies docker-compose.e2e.yml.',
    );
  }
  if (!response.ok) {
    throw new Error(`POST /test/reset failed with ${response.status}`);
  }
}

export { expect } from '@playwright/test';
export { resetServerState, test };
