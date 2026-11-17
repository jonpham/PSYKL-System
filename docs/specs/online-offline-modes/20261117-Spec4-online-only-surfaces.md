---
status: TODO
issue: GH144
pr:
completed_at:
created_at: 2026-11-17
initiative: online-offline-modes
spec_number: 4
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - 1
  - 2
  - 3
  - 5
  - 7
  - 11
  - 13
  - 14
---

# Online-Only Surfaces — Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

**Date:** 2026-11-17
**Initiative:** `online-offline-modes`
**Spec:** 4/5
**Spec User Story:** _As a PSYKL user with Offline Mode off, every screen works against the server: I see no sync controls that have nothing to report, I can restore what I deleted, and the app keeps my preferences and open list even in a browser without IndexedDB._
**Reads from:** [`docs/initiatives/online-offline-modes/DESIGN.md`](../../initiatives/online-offline-modes/DESIGN.md) Decisions 1-3, 5, 7, 11, 13, 14 and Premise 3 (LOCKED).
**Visual artifact:** [`20261117-Spec4-online-only-surfaces-visual-artifact.md`](20261117-Spec4-online-only-surfaces-visual-artifact.md)

**Goal:** Finish the API path for every surface besides Lists and Tasks: hide the sync-only UI, idle the page sync triggers, give Recently Deleted an online implementation, and let device-local values fall back to `localStorage` when IndexedDB cannot be opened.

**Architecture:** The sync control, the Sync item and the Sync destination render only with Offline Mode on. Their IndexedDB-reading hooks move into two small components, `HeaderSyncStatus` and `SyncDestination`, that `App` mounts only then (Premise 3). `registerPageSyncTriggers` reads Offline Mode when each event fires. `useRecentlyDeleted` becomes a seam over `useRecentlyDeleted.sync.ts` (today's code) and `useRecentlyDeleted.api.ts`, a TanStack Query read of `GET /deleted` with restores that wait for the server (Decision 1). Every device-local read and write goes through `preferences/deviceStore.ts`, which tries IndexedDB `sync_meta` and falls back to `localStorage` (Decision 13).

**Tech Stack:** React 19, `@tanstack/react-query` 5, `idb`, Vitest + MSW + `fake-indexeddb`, Storybook 8, Playwright.

> Glossary:
>
> - PWA = Progressive Web App. IDB = IndexedDB, the browser's local database.
> - Offline Mode on = the sync path (IDB + sync queue). Offline Mode off = the API path (server + TanStack Query's in-memory cache).
> - TanStack Query = `@tanstack/react-query`, an in-memory server-state cache for React. Query key = the name a cached read is stored under.
> - Device-local value = something about this device, never sent to the server: appearance, contrast, "show completed" per list, the open list.
> - MSW = Mock Service Worker, the HTTP stub the unit tests run against.

> Vocabulary reminder: `DevTask` is the AGENTS.md workflow term for a PR-sized unit of work. `Task` without the prefix is the PSYKL data entity.

## Global Constraints

- Client-only: `components/web_client/src/` and `e2e/`. No `service-task` or `packages/shared-types` change; the existing `GET /deleted` and `POST /{tasks,lists}/{id}/restore` are consumed as-is.
- Sync-path behaviour does not change. With Offline Mode on, every existing test passes unchanged.
- UI Components keep calling `useRecentlyDeleted()`; `UseRecentlyDeletedResult` and `DeletedItem` keep their shape, and no TanStack type appears in them (Decisions 1, 14).
- `*.api.ts` hooks must not import `sync/`, `db/idb` (type-only imports from `db/idb.types` are allowed, as in Spec 3), `useLists.positions` or `useLists.default-list` (Decision 7).
- Only the sync-only surfaces (`SyncView`, `SyncStatus`, `useSyncRecords`, `useSyncDiscrepancy`, and their new wrappers) may know sync exists (Premise 3).
- Default `X-User-Id` stays `local`.
- ≤10 production files per DevTask PR. Every new user-visible behaviour ships with an E2E test in the same PR.
- E2E test titles are user stories. No milestone tokens in file names or identifiers.
- Run `pnpm verify:prepare` once before the first typecheck if `src/api/types.ts` is missing.

## Review Focus

1. **A list restored whose tasks then fail to restore.** The list comes back, a task restore is refused, and the screen must still match the server: Recently Deleted, Lists and Tasks all refresh whatever happened. Pinned by DevTask 12 `useRecentlyDeleted.api.unit.test.tsx` → "refreshes Recently Deleted even when the server refuses a restore".
2. **Something deleted while Recently Deleted is already loaded.** `RecentlyDeleted` is always mounted, so its first read happens at start-up; a later delete must still show without a reload. Pinned by DevTask 12 → "shows a task deleted on this path without a reload".
3. **A bookmark or typed address to `/sync` with Offline Mode off.** Lands on the list rather than an empty screen. Pinned by DevTask 11 `App.offline-mode.unit.test.tsx` → "takes a visit to Sync to the list instead".
4. **The page coming back into view with writes still queued from before switching off.** Nothing is sent while off; they wait for Offline Mode on (Decision 11). Pinned by DevTask 11 `page-triggers.unit.test.ts` → "stays idle with Offline Mode off".
5. **Choosing a list in a browser without IndexedDB.** `setActiveListId` used to reject before telling anyone, so the list never opened. Pinned by DevTask 13 `useActiveList.no-indexeddb.unit.test.tsx` → "opens the chosen list and keeps it across a reload".

---

## Data Model

No schema changes. The `localStorage` fallback uses keys `psykl:{sync_meta key}`, e.g. `psykl:pref:appearance`, holding JSON.

## API

No API surface change. The API path's Recently Deleted uses:

| Call           | Endpoint                                                   |
| -------------- | ---------------------------------------------------------- |
| read           | `GET /deleted` → `{ lists, tasks }`, last 30 days          |
| restore a task | `POST /tasks/{id}/restore`                                 |
| restore a list | `POST /lists/{id}/restore`, then each task deleted with it |

## Visual Artifact

[`20261117-Spec4-online-only-surfaces-visual-artifact.md`](20261117-Spec4-online-only-surfaces-visual-artifact.md): the header and navigation without sync controls, Recently Deleted with a working Restore, and the state storyboard.

---

## DevTasks

Three DevTasks, numbered globally (Spec 1 = 1-4, Spec 2 = 5-7, Spec 3 = 8-10). DevTasks 11 and 12 share no files. DevTask 13's E2E test runs the whole app without IndexedDB, which needs DevTask 11's hidden sync UI (its hooks read IndexedDB), so 13 depends on 11. Stack them as drafts, 12 on 11 and 13 on 12, as in Spec 3, unless the operator wants 11 and 12 as siblings.

### DevTask 11: Sync controls hidden and page sync idle with Offline Mode off

**Files:** 9 production files: `components/web_client/src/App.tsx`, `src/components/AppShell/AppShell.tsx`, `src/components/AppShell/SidebarNav/SidebarNav.tsx`, `src/components/HeaderSyncStatus/HeaderSyncStatus.tsx` (new), `src/components/HeaderSyncStatus/index.ts` (new), `src/components/SyncDestination/SyncDestination.tsx` (new), `src/components/SyncDestination/index.ts` (new), `src/sync/page-triggers.ts`, `e2e/online_mode.e2e.spec.ts`.
**Branch:** `feat/online-offline-modes-s4-dt11-hide-sync-online`
**PR:** _tbd_

**Interfaces:**

- Consumes: `useUserSettings(): { offlineMode: boolean }`; `readOfflineMode(): boolean` from `preferences/offlineMode.ts`; `SyncStatus`, `useFailedSyncCount` from `components/SyncStatus`; `SyncView` from `components/SyncView`; `useSyncDiscrepancy()`, `useSyncRecords()`.
- Produces:
  - `SidebarNav` prop `showSync?: boolean` (default `true`); `AppShell` prop `showSync?: boolean` (default `true`), passed through.
  - `HeaderSyncStatus({ active: boolean; onOpen: () => void })`.
  - `SyncDestination({ open: boolean })`: always mounted with Offline Mode on, like `RecentlyDeleted`, so the records are loaded before the user opens Sync.
  - `registerPageSyncTriggers(input?: { isOfflineMode?: () => boolean; notify?; replay? })`; `isOfflineMode` defaults to `readOfflineMode`.

- [ ] **Step 1: Commit the inactive E2E scenario**

Append inside the existing `test.describe('with Offline Mode off', …)` block of `e2e/online_mode.e2e.spec.ts`:

```ts
test.skip('a user sees no Sync controls, and a link to Sync opens their list instead', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Sync (clear|needs attention)$/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
  const navigation = page.getByRole('navigation', { name: 'PSYKL navigation' });
  await expect(navigation.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(navigation.getByRole('button', { name: 'Sync', exact: true })).toHaveCount(0);

  await page.goto('/sync');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
});
```

```bash
git add e2e/online_mode.e2e.spec.ts
git commit -m "test: describe a user seeing no Sync controls with Offline Mode off"
```

- [ ] **Step 2: Write the failing navigation test**

Add to `src/components/AppShell/SidebarNav/__tests__/SidebarNav.unit.test.tsx`, after "offers every destination":

```tsx
it('leaves Sync out when sync is not offered', () => {
  // Arrange
  render(<SidebarNav {...props} showSync={false} />);

  // Assert
  expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();
  for (const name of ['Lists', 'Recently Deleted', 'Settings']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  }
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/components/AppShell/SidebarNav`
Expected: FAIL — TypeScript accepts the unknown prop at runtime, and the Sync button is still found.

- [ ] **Step 3: Implement `showSync`**

In `src/components/AppShell/SidebarNav/SidebarNav.tsx`, add `showSync?: boolean;` to `SidebarNavProps` (alphabetical, after `onSelectList`), destructure `showSync = true,`, and replace the Sync and Settings `<li>` elements with:

```tsx
{
  showSync ? (
    <li className="psykl-sidebar-nav__divider">
      <button
        aria-current={destination === 'sync' ? 'page' : undefined}
        className="psykl-sidebar-nav__item"
        data-status={syncNeedsAttention ? 'attention' : 'clear'}
        onClick={() => onSelectDestination('sync')}
        type="button"
      >
        <DestinationGlyph name="sync" /> Sync
      </button>
    </li>
  ) : null;
}
{
  /* The divider separates the app's own destinations from the data
   * ones; without Sync, Settings is the first below it. */
}
<li className={showSync ? undefined : 'psykl-sidebar-nav__divider'}>
  <button
    aria-current={destination === 'settings' ? 'page' : undefined}
    className="psykl-sidebar-nav__item"
    onClick={() => onSelectDestination('settings')}
    type="button"
  >
    <DestinationGlyph name="settings" /> Settings
  </button>
</li>;
```

In `src/components/AppShell/AppShell.tsx`, add `showSync?: boolean;` to `AppShellProps`, destructure `showSync = true`, and pass `showSync={showSync}` to `<SidebarNav>`.

Run: `pnpm --filter @psykl/web-client exec vitest run src/components/AppShell`
Expected: PASS.

```bash
git add components/web_client/src/components/AppShell
git commit -m "feat: let the navigation leave out Sync"
```

- [ ] **Step 4: Write the failing App tests**

Add to `src/__tests__/App.offline-mode.unit.test.tsx`. Import `waitFor` from `@testing-library/react`, and add `window.history.pushState({}, '', '/');` to the existing `afterEach`:

```tsx
it('offers no Sync control in the header or the navigation', async () => {
  // Arrange
  writeOfflineMode(false);

  // Act
  render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
  await screen.findByText(/nothing to do yet/i);

  // Assert
  expect(screen.queryByRole('button', { name: /^Sync (clear|needs attention)$/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();
});

it('takes a visit to Sync to the list instead', async () => {
  // Arrange
  writeOfflineMode(false);
  window.history.pushState({}, '', '/sync');

  // Act
  render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );

  // Assert
  await waitFor(() => expect(window.location.pathname).toBe('/'));
  expect(await screen.findByText(/nothing to do yet/i)).toBeInTheDocument();
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/__tests__/App.offline-mode.unit.test.tsx`
Expected: FAIL — "Sync clear" is found; the path stays `/sync`.

- [ ] **Step 5: Move the sync hooks into their own components and gate them**

Create `src/components/HeaderSyncStatus/HeaderSyncStatus.tsx`:

```tsx
import { useSyncDiscrepancy } from '../../hooks/useSyncDiscrepancy';
import { SyncStatus, useFailedSyncCount } from '../SyncStatus';

interface HeaderSyncStatusProps {
  active: boolean;
  onOpen: () => void;
}

/**
 * The header's sync control with its counts. A component of its own so the
 * IndexedDB reads behind the counts run only while it is shown, which is only
 * with Offline Mode on (online-offline-modes DESIGN.md Premise 3).
 */
export function HeaderSyncStatus({ active, onOpen }: HeaderSyncStatusProps) {
  const { count: queuedCount } = useSyncDiscrepancy();
  const failedCount = useFailedSyncCount();
  return <SyncStatus active={active} failedCount={failedCount} onOpen={onOpen} queuedCount={queuedCount} />;
}
```

Create `src/components/HeaderSyncStatus/index.ts`:

```ts
export { HeaderSyncStatus } from './HeaderSyncStatus';
```

Create `src/components/SyncDestination/SyncDestination.tsx`:

```tsx
import { useSyncRecords } from '../../hooks/useSyncRecords';
import { SyncView } from '../SyncView';

interface SyncDestinationProps {
  open: boolean;
}

/**
 * The Sync destination with its records. Mounted for as long as Offline Mode
 * is on, like Recently Deleted, so the records are already loaded when the
 * user opens it; never mounted with Offline Mode off (Premise 3).
 */
export function SyncDestination({ open }: SyncDestinationProps) {
  const syncRecords = useSyncRecords();
  if (!open) {
    return null;
  }
  return (
    <SyncView
      failed={syncRecords.failed}
      onDismissReplacedEdit={syncRecords.dismissReplacedEdit}
      queued={syncRecords.queued}
      replacedEdits={syncRecords.replacedEdits}
    />
  );
}
```

Create `src/components/SyncDestination/index.ts`:

```ts
export { SyncDestination } from './SyncDestination';
```

In `src/App.tsx`:

1. Replace the imports of `SyncStatus, useFailedSyncCount`, `SyncView`, `useSyncDiscrepancy` and `useSyncRecords` with:

```tsx
import { HeaderSyncStatus } from './components/HeaderSyncStatus';
import { SyncDestination } from './components/SyncDestination';
import { useUserSettings } from './hooks/useUserSettings';
```

2. Replace the three lines `const { count: queuedCount } = useSyncDiscrepancy();`, `const failedCount = useFailedSyncCount();` and `const syncRecords = useSyncRecords();` with:

```tsx
const { offlineMode } = useUserSettings();
```

3. After the "Selection mode belongs to one list" effect, add:

```tsx
// Sync is the sync path's destination. With Offline Mode off there is
// nothing waiting on this device to show, so a link to it opens the list.
useEffect(() => {
  if (!offlineMode && destination === 'sync') {
    goTo('list');
  }
}, [destination, goTo, offlineMode]);
```

4. In `headerAction`, replace the `<SyncStatus … />` element with:

```tsx
{
  offlineMode ? <HeaderSyncStatus active={destination === 'sync'} onOpen={() => goTo('sync')} /> : null;
}
```

5. Pass `showSync={offlineMode}` to `<AppShell>`.

6. Replace the `{destination === 'sync' ? (<SyncView … />) : null}` block with:

```tsx
{
  offlineMode ? <SyncDestination open={destination === 'sync'} /> : null;
}
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/__tests__ src/components/AppShell`
Expected: PASS, including the existing `App.unit.test.tsx` and `App.selection.unit.test.tsx` (sync path unchanged).

```bash
git add components/web_client/src/App.tsx components/web_client/src/components/HeaderSyncStatus components/web_client/src/components/SyncDestination components/web_client/src/__tests__/App.offline-mode.unit.test.tsx
git commit -m "feat: hide the sync control and the Sync destination with Offline Mode off"
```

- [ ] **Step 6: Write the failing page-trigger test**

Add to `src/sync/__tests__/page-triggers.unit.test.ts`. Import `afterEach` from `vitest` and `writeOfflineMode` from `'../../preferences/offlineMode'`, and add `afterEach(() => localStorage.clear());` inside the `describe`:

```ts
it('stays idle with Offline Mode off', () => {
  // A write queued before switching off waits for Offline Mode on (Decision 11).
  const replay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  writeOfflineMode(false);

  const unregister = registerPageSyncTriggers({ replay });
  window.dispatchEvent(new Event('online'));
  document.dispatchEvent(new Event('visibilitychange'));
  unregister();

  expect(replay).not.toHaveBeenCalled();
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/sync/__tests__/page-triggers.unit.test.ts`
Expected: FAIL — `replay` called 2 times.

- [ ] **Step 7: Idle the triggers**

In `src/sync/page-triggers.ts`, add `import { readOfflineMode } from '../preferences/offlineMode';`, add `isOfflineMode?: () => boolean;` to `PageSyncTriggers`, and replace the body of `registerPageSyncTriggers` with:

```ts
function registerPageSyncTriggers(input: PageSyncTriggers = {}): () => void {
  // Read when each event fires, not once: switching Offline Mode remounts the
  // React tree but not this listener, which `main.tsx` registers at start-up.
  const isOfflineMode = input.isOfflineMode ?? readOfflineMode;
  const notify = input.notify ?? notifyTasksChanged;
  const replay = input.replay ?? replayQueue;
  const onOnline = () => {
    if (isOfflineMode()) {
      void runReplay(replay, notify);
    }
  };
  const onVisibilityChange = () => {
    if (isOfflineMode() && document.visibilityState === 'visible') {
      void runReplay(replay, notify);
    }
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/sync/__tests__/page-triggers.unit.test.ts`
Expected: PASS (5 tests).

```bash
git add components/web_client/src/sync
git commit -m "feat: keep page sync idle with Offline Mode off"
```

- [ ] **Step 8: Activate the E2E scenario**

Change `test.skip(` to `test(` for "a user sees no Sync controls, and a link to Sync opens their list instead".

```bash
./scripts/e2e-up.sh && pnpm test:e2e -- online_mode navigation sync_view
```

Expected: all pass; `navigation` and `sync_view` show the sync path unchanged.

```bash
git add e2e/online_mode.e2e.spec.ts
git commit -m "test: activate seeing no Sync controls with Offline Mode off"
```

- [ ] **Step 9: Full verification**

Run: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check && pnpm -r test:unit && pnpm -r test:component`
Expected: all green. Tick DevTask 11 in this doc's checklist (body bullet of the next commit).

### DevTask 12: Recently Deleted works with Offline Mode off

**Files:** 9 production files: `components/web_client/src/hooks/query-keys.ts` (new), `src/hooks/useRecentlyDeleted.ts`, `src/hooks/useRecentlyDeleted.sync.ts` (new), `src/hooks/useRecentlyDeleted.api.ts` (new), `src/hooks/useRecentlyDeleted.items.ts` (new), `src/hooks/useLists.api.ts`, `src/hooks/useTasks.api.ts`, `src/hooks/online-path.stub.ts` (deleted), `e2e/recently_deleted.e2e.spec.ts`.
**Branch:** `feat/online-offline-modes-s4-dt12-recently-deleted-online`
**PR:** _tbd_

**Interfaces:**

- Consumes: `useServiceClients(): { lists, tasks }` with `restore(entityId, body, optimistic)`; `listDeletedRemote(): Promise<EntityApiResult<DeletedResponse>>`; `createApiPathWrapper()` (test fixture).
- Produces:
  - `hooks/query-keys.ts`: `LISTS_QUERY_KEY = ['lists']`, `RECENTLY_DELETED_QUERY_KEY = ['deleted']`, `TASKS_QUERY_KEY = ['tasks']` (all `as const`).
  - `hooks/useRecentlyDeleted.items.ts`: `toDeletedItems(tasks: Task[], lists: ListRecord[]): DeletedItem[]`, `cascadedWith(list: ListRecord, tasks: Task[]): Task[]`, type `DeletedItem`.
  - `useRecentlyDeletedSyncClient(): UseRecentlyDeletedResult` (today's behaviour), `useRecentlyDeletedApiClient(): UseRecentlyDeletedResult`.
  - `useRecentlyDeleted()` is the seam; it still exports `useRecentlyDeleted` and type `DeletedItem`, and now also type `UseRecentlyDeletedResult`.

- [ ] **Step 1: Commit the inactive E2E scenarios**

Add to `e2e/recently_deleted.e2e.spec.ts`. Extend the imports with `import { expectServerTaskVisible } from './helpers/multi-device';`, `import { createList, createTask, enterSelectionMode, openList, select } from './helpers/selection';`, and add `fetchServerLists` to the `./helpers/task-api` import. Then append:

```ts
test.describe('recently deleted with Offline Mode off', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('psykl:offline-mode', 'false'));
  });

  test.skip('a user deletes a task, finds it in Recently Deleted, and restores it', async ({ page }) => {
    await page.goto('/');
    await createTask(page, 'Milk');
    await enterSelectionMode(page);
    await select(page, 'Milk');
    await page.getByRole('button', { name: 'Delete selected tasks' }).click();
    await page.getByRole('button', { name: 'Confirm deleting 1 task' }).click();
    await expect(page.getByRole('listitem', { name: 'Milk' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await page.getByRole('button', { name: 'Restore Milk' }).click();
    await expect(page.getByText('Nothing deleted in the last 30 days.')).toBeVisible();

    await expectServerTaskVisible('local', 'Milk');
    await page.goBack();
    await expect(page.getByRole('listitem', { name: 'Milk' })).toBeVisible();
  });

  test.skip('a user restores a deleted list and its tasks come back', async ({ page }) => {
    await createList(page, 'Groceries');
    await openList(page, 'Groceries');
    await createTask(page, 'Milk');

    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('button', { name: 'Delete With Items' }).click();

    await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
    await page.getByRole('button', { name: 'Recently Deleted' }).click();
    await expect(page.getByText('list · 1 item')).toBeVisible();
    await page.getByRole('button', { name: 'Restore Groceries' }).click();

    await expect
      .poll(async () => (await fetchServerLists('local')).map((list) => list.title))
      .toEqual(['Tasks', 'Groceries']);
    await openList(page, 'Groceries');
    await expect(page.getByRole('listitem', { name: 'Milk' })).toBeVisible();
  });
});
```

```bash
git add e2e/recently_deleted.e2e.spec.ts
git commit -m "test: describe restoring from Recently Deleted with Offline Mode off"
```

- [ ] **Step 2: Extract the shared query keys and item helpers (refactor, no behaviour change)**

Create `src/hooks/query-keys.ts`:

```ts
/** TanStack Query keys for the online-only path, in one place so a write in
 * one hook can refresh another's cache (Spec 4 decision S4-2). */
const LISTS_QUERY_KEY = ['lists'] as const;
const RECENTLY_DELETED_QUERY_KEY = ['deleted'] as const;
const TASKS_QUERY_KEY = ['tasks'] as const;

export { LISTS_QUERY_KEY, RECENTLY_DELETED_QUERY_KEY, TASKS_QUERY_KEY };
```

In `useLists.api.ts` and `useTasks.api.ts`, delete the local `const LISTS_QUERY_KEY …` / `const TASKS_QUERY_KEY …` and import them from `./query-keys`.

Create `src/hooks/useRecentlyDeleted.items.ts` by moving, unchanged, from `useRecentlyDeleted.ts`: the two window constants with their comment, `interface DeletedItem`, `toDeletedItems`, `cascadedWith` (with its comment), `withinWindow` and `toItem`. Header and footer:

```ts
import type { Task } from '../api/client';
import type { ListRecord } from '../db/idb.types';

// … moved code …

export { cascadedWith, toDeletedItems };
export type { DeletedItem };
```

In `useRecentlyDeleted.ts`, import `cascadedWith`, `type DeletedItem` and `toDeletedItems` from `./useRecentlyDeleted.items`, and keep `export type { DeletedItem };`.

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks src/components/RecentlyDeleted`
Expected: PASS, unchanged counts.

```bash
git add components/web_client/src/hooks
git commit -m "refactor: share the online query keys and Recently Deleted's item rules"
```

- [ ] **Step 3: Write the failing API-path tests**

Create `src/hooks/__tests__/useRecentlyDeleted.api.unit.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Task } from '../../api/client';
import type { ListRecord } from '../../db/idb.types';
import { DEFAULT_LIST_ID } from '../../services/default-list';
import { createApiPathWrapper } from '../../test/api-path-wrapper';
import { server } from '../../test/setup';
import { useRecentlyDeletedApiClient } from '../useRecentlyDeleted.api';
import { useTasksApiClient } from '../useTasks.api';

const now = new Date().toISOString();
const groceriesId = '0199eeee-0000-7000-8000-0000000000a1';

function task(id: string, title: string, extra: Partial<Task> = {}): Task {
  return {
    completed_at: null,
    created_at: now,
    deleted_at: now,
    id,
    list_id: DEFAULT_LIST_ID,
    server_updated_at: now,
    title,
    updated_at: now,
    user_id: 'local',
    ...extra,
  };
}

const groceries: ListRecord = {
  created_at: now,
  deleted_at: now,
  id: groceriesId,
  position: 'a1',
  server_updated_at: now,
  title: 'Groceries',
  updated_at: now,
  user_id: 'local',
};

/** A server whose Recently Deleted shrinks as rows are restored. */
function serverDeleted(initial: { lists?: ListRecord[]; tasks?: Task[] }) {
  const rows = { lists: [...(initial.lists ?? [])], tasks: [...(initial.tasks ?? [])] };
  const restored: string[] = [];
  server.use(
    http.get('*/deleted', () => HttpResponse.json(rows)),
    http.get('*/tasks', () => HttpResponse.json([])),
    http.post('*/tasks/:id/restore', ({ params }) => {
      const found = rows.tasks.find((row) => row.id === params['id']);
      rows.tasks = rows.tasks.filter((row) => row.id !== params['id']);
      restored.push(String(params['id']));
      return HttpResponse.json({ ...found, deleted_at: null });
    }),
    http.post('*/lists/:id/restore', ({ params }) => {
      const found = rows.lists.find((row) => row.id === params['id']);
      rows.lists = rows.lists.filter((row) => row.id !== params['id']);
      restored.push(String(params['id']));
      return HttpResponse.json({ ...found, deleted_at: null });
    }),
  );
  return { restored, rows };
}

async function renderDeleted() {
  const { result } = renderHook(() => useRecentlyDeletedApiClient(), { wrapper: createApiPathWrapper() });
  return result;
}

describe('useRecentlyDeletedApiClient', () => {
  it('shows what the server holds as recently deleted', async () => {
    // Arrange
    serverDeleted({ tasks: [task('0199eeee-0000-7000-8000-000000000001', 'Milk')] });

    // Act
    const result = await renderDeleted();

    // Assert
    await waitFor(() => expect(result.current.items.map((item) => item.title)).toEqual(['Milk']));
    expect(result.current.items[0]?.daysRemaining).toBe(30);
  });

  it('restores a task on the server, then no longer lists it', async () => {
    // Arrange
    const milk = task('0199eeee-0000-7000-8000-000000000001', 'Milk');
    const { restored } = serverDeleted({ tasks: [milk] });
    const result = await renderDeleted();
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Act
    await act(() => result.current.restore(result.current.items[0]!));

    // Assert
    expect(restored).toEqual([milk.id]);
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('restores a list together with the tasks deleted with it, and no others', async () => {
    // Arrange
    const milk = task('0199eeee-0000-7000-8000-000000000002', 'Milk', { list_id: groceriesId });
    // Deleted on its own a day earlier, so not part of the list's delete.
    const eggs = task('0199eeee-0000-7000-8000-000000000003', 'Eggs', {
      deleted_at: new Date(Date.now() - 86_400_000).toISOString(),
      list_id: groceriesId,
    });
    const { restored } = serverDeleted({ lists: [groceries], tasks: [milk, eggs] });
    const result = await renderDeleted();
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // Act
    const list = result.current.items.find((item) => item.type === 'list')!;
    await act(() => result.current.restore(list));

    // Assert
    expect(restored).toEqual([groceriesId, milk.id]);
    await waitFor(() => expect(result.current.items.map((item) => item.title)).toEqual(['Eggs']));
  });

  it('refreshes Recently Deleted even when the server refuses a restore', async () => {
    // Arrange
    const milk = task('0199eeee-0000-7000-8000-000000000001', 'Milk');
    let reads = 0;
    server.use(
      http.get('*/deleted', () => {
        reads += 1;
        return HttpResponse.json({ lists: [], tasks: [milk] });
      }),
      http.post('*/tasks/:id/restore', () => new HttpResponse(null, { status: 503 })),
    );
    const result = await renderDeleted();
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Act / Assert
    await expect(act(() => result.current.restore(result.current.items[0]!))).rejects.toMatchObject({
      message: expect.stringContaining('restore failed'),
    });
    await waitFor(() => expect(reads).toBe(2));
    expect(result.current.items.map((item) => item.title)).toEqual(['Milk']);
  });

  it('shows a task deleted on this path without a reload', async () => {
    // Arrange
    const stamps = task('0199eeee-0000-7000-8000-000000000004', 'buy stamps', { deleted_at: null });
    const deletedTasks: Task[] = [];
    server.use(
      http.get('*/tasks', () => HttpResponse.json([stamps])),
      http.get('*/deleted', () => HttpResponse.json({ lists: [], tasks: deletedTasks })),
      http.delete('*/tasks/:id', async ({ request }) => {
        const body = (await request.json()) as { deleted_at: string; updated_at: string };
        const deleted = { ...stamps, ...body };
        deletedTasks.push(deleted);
        return HttpResponse.json(deleted);
      }),
    );
    const { result } = renderHook(() => ({ deleted: useRecentlyDeletedApiClient(), tasks: useTasksApiClient() }), {
      wrapper: createApiPathWrapper(),
    });
    await waitFor(() => expect(result.current.tasks.tasks).toHaveLength(1));

    // Act
    await act(() => result.current.tasks.deleteTask(stamps.id, { deleted_at: now, updated_at: now }, stamps));

    // Assert
    await waitFor(() => expect(result.current.deleted.items.map((item) => item.title)).toEqual(['buy stamps']));
  });
});
```

Rewrite `src/hooks/__tests__/useRecentlyDeleted.offline-mode.unit.test.tsx`'s test (keep its imports and `afterEach`; add `import { http, HttpResponse } from 'msw';` and `import { server } from '../../test/setup';`):

```tsx
describe('useRecentlyDeleted with Offline Mode off', () => {
  it('restores through the server, not the sync queue', async () => {
    // Arrange
    writeOfflineMode(false);
    const id = '0196f0a4-8b5a-7000-8000-000000000099';
    const milk = {
      completed_at: null,
      created_at: '2026-11-17T10:00:00.000Z',
      deleted_at: new Date().toISOString(),
      id,
      list_id: null,
      server_updated_at: '2026-11-17T10:00:00.000Z',
      title: 'Milk',
      updated_at: '2026-11-17T10:00:00.000Z',
      user_id: 'local',
    };
    const restored: string[] = [];
    server.use(
      http.get('*/deleted', () => HttpResponse.json({ lists: [], tasks: restored.length ? [] : [milk] })),
      http.post('*/tasks/:id/restore', ({ params }) => {
        restored.push(String(params['id']));
        return HttpResponse.json({ ...milk, deleted_at: null });
      }),
    );
    const { result } = renderHook(() => useRecentlyDeleted(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Act
    await act(() => result.current.restore(result.current.items[0]!));

    // Assert
    expect(restored).toEqual([id]);
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
```

(`act` and `waitFor` join `renderHook` in the `@testing-library/react` import.)

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useRecentlyDeleted`
Expected: FAIL — `../useRecentlyDeleted.api` does not exist; the seam test rejects with "restore is not available with Offline Mode off yet".

- [ ] **Step 4: Implement the two paths and the seam**

Create `src/hooks/useRecentlyDeleted.api.ts`:

```ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { Task } from '../api/client';
import { listDeletedRemote } from '../api/deleted.api-client';
import type { ListRecord } from '../db/idb.types';
import { LISTS_QUERY_KEY, RECENTLY_DELETED_QUERY_KEY, TASKS_QUERY_KEY } from './query-keys';
import type { UseRecentlyDeletedResult } from './useRecentlyDeleted';
import { cascadedWith, type DeletedItem, toDeletedItems } from './useRecentlyDeleted.items';
import { useServiceClients } from './useServiceClients';

interface DeletedRows {
  lists: ListRecord[];
  tasks: Task[];
}

const NO_ROWS: DeletedRows = { lists: [], tasks: [] };

/**
 * Recently Deleted with Offline Mode off: what the server's `GET /deleted`
 * holds, and a restore that waits for the server (Spec 3 decision S3-2).
 * Whatever a restore's answer, Recently Deleted, Lists and Tasks are read
 * again, so the screen matches the server even when a list came back and one
 * of its tasks did not (S4-2). Deletes on this path refresh this read too.
 */
function useRecentlyDeletedApiClient(): UseRecentlyDeletedResult {
  const { lists: listServiceClient, tasks: taskServiceClient } = useServiceClients();
  const queryClient = useQueryClient();
  const { data = NO_ROWS } = useQuery({ queryFn: fetchDeleted, queryKey: RECENTLY_DELETED_QUERY_KEY });
  const items = useMemo(() => toDeletedItems(data.tasks, data.lists), [data]);

  const restore = useCallback(
    async (item: DeletedItem): Promise<void> => {
      const updated_at = new Date().toISOString();
      try {
        if (item.type === 'task') {
          const existing = data.tasks.find((row) => row.id === item.id);
          if (existing) {
            await taskServiceClient.restore(item.id, { updated_at }, { ...existing, deleted_at: null });
          }
          return;
        }
        const existing = data.lists.find((row) => row.id === item.id);
        if (!existing) {
          return;
        }
        await listServiceClient.restore(item.id, { updated_at }, { ...existing, deleted_at: null });
        // The list and its items left together, so they come back together.
        for (const row of cascadedWith(existing, data.tasks)) {
          await taskServiceClient.restore(row.id, { updated_at }, { ...row, deleted_at: null });
        }
      } finally {
        await Promise.all(
          [RECENTLY_DELETED_QUERY_KEY, LISTS_QUERY_KEY, TASKS_QUERY_KEY].map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
    },
    [data, listServiceClient, queryClient, taskServiceClient],
  );

  return { items, restore };
}

async function fetchDeleted(): Promise<DeletedRows> {
  const result = await listDeletedRemote();
  if (result.error || !result.data) {
    throw new Error(`Recently Deleted read failed: ${String(result.status)}`);
  }
  return { lists: result.data.lists, tasks: result.data.tasks };
}

export { useRecentlyDeletedApiClient };
```

Create `src/hooks/useRecentlyDeleted.sync.ts` holding today's implementation, renamed and without the Offline Mode check:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Task } from '../api/client';
import { listDeletedRemote } from '../api/deleted.api-client';
import type { ListRecord } from '../db/idb.types';
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import { notifyListSubscribers, subscribeToListChanges } from './useLists';
import type { UseRecentlyDeletedResult } from './useRecentlyDeleted';
import { cascadedWith, type DeletedItem, toDeletedItems } from './useRecentlyDeleted.items';
import { useServiceClients } from './useServiceClients';
import { subscribeToTaskChanges } from './useTasks';

/** Recently Deleted with Offline Mode on: rows this device holds, merged with
 * `GET /deleted` in memory, and restores through the sync queue. */
function useRecentlyDeletedSyncClient(): UseRecentlyDeletedResult {
  const { lists: listServiceClient, tasks: taskServiceClient } = useServiceClients();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListRecord[]>([]);
  // Guards against out-of-order concurrent reload() calls: restore()'s own
  // enqueueWithReplay fires a notify() (triggering a reload() via
  // subscribeToTaskChanges below) BEFORE restore()'s own explicit
  // `await reload()` runs, so every restore() has at least two reload() calls
  // in flight, and an earlier one reading a stale "still deleted" snapshot
  // must not overwrite a newer one's state.
  const reloadGeneration = useRef(0);

  const reload = useCallback(async () => {
    const generation = ++reloadGeneration.current;
    // list() already includes every row this device has seen, deleted or not.
    // Rows tombstoned on another device and never synced here are merged in
    // from GET /deleted in memory; nothing is written to IDB until a restore.
    const [localTasks, localLists, remoteDeleted] = await Promise.all([
      taskServiceClient.list().catch(() => [] as Task[]),
      listServiceClient.list().catch(() => [] as ListRecord[]),
      listDeletedRemote()
        .then((result) => result.data ?? null)
        .catch(() => null),
    ]);
    if (generation !== reloadGeneration.current) {
      return;
    }
    setTasks(mergeById(localTasks, remoteDeleted?.tasks ?? []));
    setLists(mergeById(localLists, remoteDeleted?.lists ?? []));
  }, [listServiceClient, taskServiceClient]);

  useEffect(() => {
    void reload();
    // Live-updates while the screen stays open: a delete or restore anywhere
    // else in the app must show without closing and reopening it.
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      // Also invalidates any reload() still in flight, so it cannot write
      // state after unmount (see Root.unit.test.tsx).
      reloadGeneration.current += 1;
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  const restore = useCallback(
    async (item: DeletedItem): Promise<void> => {
      const now = new Date().toISOString();
      if (item.type === 'task') {
        const existing = tasks.find((task) => task.id === item.id);
        if (!existing) {
          return;
        }
        const optimistic = { ...existing, deleted_at: null, updated_at: now };
        // enqueueWithReplay, not a bare service-client call: without it the
        // restore never triggers replay() and TaskList never learns of it.
        await enqueueWithReplay({
          enqueue: () => taskServiceClient.restore(item.id, { updated_at: now }, optimistic),
          replay,
        });
      } else {
        const existing = lists.find((list) => list.id === item.id);
        if (!existing) {
          return;
        }
        const optimistic = { ...existing, deleted_at: null, updated_at: now };
        await enqueueWithReplay({
          enqueue: () => listServiceClient.restore(item.id, { updated_at: now }, optimistic),
          notify: notifyListSubscribers,
          replay,
        });
        // The list and its items left together, so they come back together.
        for (const task of cascadedWith(existing, tasks)) {
          await enqueueWithReplay({
            enqueue: () => taskServiceClient.restore(task.id, { updated_at: now }, { ...task, deleted_at: null }),
            replay,
          });
        }
      }
      await reload();
    },
    [tasks, lists, reload, listServiceClient, taskServiceClient],
  );

  return { items: toDeletedItems(tasks, lists), restore };
}

function mergeById<T extends { id: string }>(local: T[], remoteOnly: T[]): T[] {
  const byId = new Map(local.map((row) => [row.id, row]));
  for (const row of remoteOnly) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()];
}

export { useRecentlyDeletedSyncClient };
```

Replace `src/hooks/useRecentlyDeleted.ts` with the seam:

```ts
import { useRecentlyDeletedApiClient } from './useRecentlyDeleted.api';
import type { DeletedItem } from './useRecentlyDeleted.items';
import { useRecentlyDeletedSyncClient } from './useRecentlyDeleted.sync';
import { useUserSettings } from './useUserSettings';

interface UseRecentlyDeletedResult {
  items: DeletedItem[];
  restore(item: DeletedItem): Promise<void>;
}

/**
 * The data-path seam for Recently Deleted (online-offline-modes DESIGN.md
 * Decision 1); see `useLists` for why branching between two hooks is safe.
 */
function useRecentlyDeleted(): UseRecentlyDeletedResult {
  const { offlineMode } = useUserSettings();
  return offlineMode ? useRecentlyDeletedSyncClient() : useRecentlyDeletedApiClient();
}

export { useRecentlyDeleted };
export type { DeletedItem, UseRecentlyDeletedResult };
```

Delete `src/hooks/online-path.stub.ts` and `src/hooks/__tests__/online-path.stub.unit.test.ts`; nothing else imports them:

```bash
git rm components/web_client/src/hooks/online-path.stub.ts components/web_client/src/hooks/__tests__/online-path.stub.unit.test.ts
grep -rn "online-path.stub\|notImplementedOnline" components/web_client/src
```

Expected: no output from `grep`.

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useRecentlyDeleted`
Expected: the first four API tests and the seam test PASS; "shows a task deleted on this path without a reload" still FAILS (nothing refreshes Recently Deleted yet).

- [ ] **Step 5: Refresh Recently Deleted after a delete on the API path**

In `useTasks.api.ts`, import `RECENTLY_DELETED_QUERY_KEY` from `./query-keys`, and in `deleteTask` add after `store(…)`:

```ts
void queryClient.invalidateQueries({ queryKey: RECENTLY_DELETED_QUERY_KEY });
```

Add `queryClient` to `deleteTask`'s dependency array. In `useLists.api.ts`, do the same in `deleteList` after `store(deleted);`.

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks src/components/RecentlyDeleted`
Expected: PASS.

```bash
git add components/web_client/src/hooks
git commit -m "feat: restore from Recently Deleted with Offline Mode off"
```

- [ ] **Step 6: Activate the E2E scenarios**

Change both `test.skip(` in "recently deleted with Offline Mode off" to `test(`.

```bash
./scripts/e2e-up.sh && pnpm test:e2e -- recently_deleted online_mode list_deletion
```

Expected: all pass.

```bash
git add e2e/recently_deleted.e2e.spec.ts
git commit -m "test: activate restoring from Recently Deleted with Offline Mode off"
```

- [ ] **Step 7: Full verification**

Run: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check && pnpm -r test:unit && pnpm -r test:component`
Expected: all green.

### DevTask 13: Preferences and the open list work without IndexedDB; Spec close-out

**Files:** 6 production files: `components/web_client/src/preferences/deviceStore.ts` (new), `src/preferences/appearance.ts`, `src/preferences/contrast.ts`, `src/preferences/completedVisibility.ts`, `src/hooks/useActiveList.ts`, `e2e/online_mode.e2e.spec.ts`. Close-out docs are not counted.
**Branch:** `feat/online-offline-modes-s4-dt13-preferences-without-idb`
**PR:** _tbd_

**Interfaces:**

- Consumes: `getMeta(key)`, `putMeta({ key, value })` from `db/idb.ts`; `JsonValue` from `db/idb.types.ts`.
- Produces: `readDeviceValue(key: string): Promise<JsonValue | undefined>`, `writeDeviceValue(key: string, value: JsonValue): Promise<void>`. Neither rejects.

- [ ] **Step 1: Commit the inactive E2E scenario**

Append to `e2e/online_mode.e2e.spec.ts`:

```ts
test.describe('with Offline Mode off, in a browser without IndexedDB', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('psykl:offline-mode', 'false');
      Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
    });
  });

  test.skip('a user picks Dark and opens a list, and both are kept after reloading', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('psykl:pref:appearance'))).toBe('"dark"');

    await createList(page, 'Groceries');
    await page.getByRole('button', { name: 'Groceries', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Groceries' })).toBeVisible();
    // The app opened Tasks at start-up, so wait for Groceries specifically.
    const groceries = (await fetchServerLists('local')).find((list) => list.title === 'Groceries');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('psykl:active_list_id')))
      .toBe(JSON.stringify(groceries?.id));

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('heading', { name: 'Groceries' })).toBeVisible();
  });
});
```

```bash
git add e2e/online_mode.e2e.spec.ts
git commit -m "test: describe keeping preferences without IndexedDB"
```

- [ ] **Step 2: Write the failing store tests**

Create `src/preferences/__tests__/deviceStore.unit.test.ts`:

```ts
import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readAppearance, writeAppearance } from '../appearance';
import { readDeviceValue, writeDeviceValue } from '../deviceStore';

afterEach(async () => {
  vi.unstubAllGlobals();
  localStorage.clear();
  await deleteDB('psykl');
});

describe('device store', () => {
  it('keeps a value in IndexedDB when it can be opened', async () => {
    await writeDeviceValue('pref:appearance', 'dark');

    expect(await readDeviceValue('pref:appearance')).toBe('dark');
    expect(localStorage.length).toBe(0);
  });

  it('falls back to localStorage when IndexedDB cannot be opened', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await writeDeviceValue('pref:show-completed:list-1', false);

    expect(await readDeviceValue('pref:show-completed:list-1')).toBe(false);
    expect(localStorage.getItem('psykl:pref:show-completed:list-1')).toBe('false');
  });

  it('reads nothing when neither store holds the value', async () => {
    vi.stubGlobal('indexedDB', undefined);

    expect(await readDeviceValue('pref:contrast')).toBeUndefined();
  });

  it('reads nothing from a fallback value that is not JSON', async () => {
    vi.stubGlobal('indexedDB', undefined);
    localStorage.setItem('psykl:pref:contrast', '{not json');

    expect(await readDeviceValue('pref:contrast')).toBeUndefined();
  });

  it('keeps an appearance across a reload without IndexedDB', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await writeAppearance('dark');

    expect(await readAppearance()).toBe('dark');
  });
});
```

Create `src/hooks/__tests__/useActiveList.no-indexeddb.unit.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getActiveListId, resetActiveListForTest, setActiveListId, useActiveListId } from '../useActiveList';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  resetActiveListForTest();
});

describe('the open list without IndexedDB', () => {
  it('opens the chosen list and keeps it across a reload', async () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);

    // Act
    await setActiveListId('0199ffff-0000-7000-8000-000000000001');
    resetActiveListForTest();
    const { result } = renderHook(() => useActiveListId());

    // Assert
    await waitFor(() => expect(result.current).toBe('0199ffff-0000-7000-8000-000000000001'));
    expect(getActiveListId()).toBe('0199ffff-0000-7000-8000-000000000001');
  });
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/preferences/__tests__/deviceStore.unit.test.ts src/hooks/__tests__/useActiveList.no-indexeddb.unit.test.tsx`
Expected: FAIL — `../deviceStore` does not exist; `setActiveListId` rejects ("Cannot read properties of undefined (reading 'open')").

- [ ] **Step 3: Implement the store and route every device-local value through it**

Create `src/preferences/deviceStore.ts`:

```ts
import { getMeta, putMeta } from '../db/idb';
import type { JsonValue } from '../db/idb.types';

const LOCAL_PREFIX = 'psykl:';

/**
 * Device-local values (appearance, contrast, "show completed" per list, the
 * open list) live in IndexedDB's `sync_meta`, and fall back to `localStorage`
 * when IndexedDB cannot be opened: a browser without it, or with site data
 * blocked. The app then still runs with Offline Mode off (online-offline-modes
 * DESIGN.md Decision 13; Spec 4 decisions S4-5, S4-6). Each call tries
 * IndexedDB first; nothing is copied between the two.
 */
async function readDeviceValue(key: string): Promise<JsonValue | undefined> {
  try {
    return (await getMeta(key))?.value;
  } catch {
    return readLocal(key);
  }
}

async function writeDeviceValue(key: string, value: JsonValue): Promise<void> {
  try {
    await putMeta({ key, value });
  } catch {
    writeLocal(key, value);
  }
}

function readLocal(key: string): JsonValue | undefined {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${key}`);
    return raw === null ? undefined : (JSON.parse(raw) as JsonValue);
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, value: JsonValue): void {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Unpersisted: the choice still applies until the page reloads.
  }
}

export { readDeviceValue, writeDeviceValue };
```

In `src/preferences/appearance.ts`, replace the `db/idb` import with `import { readDeviceValue, writeDeviceValue } from './deviceStore';`, update the doc comment's "lives in `sync_meta`" to "lives in the device store (`deviceStore.ts`)", and replace the two functions' bodies:

```ts
async function readAppearance(): Promise<Appearance> {
  const value = await readDeviceValue(KEY);
  return APPEARANCE_CHOICES.find((choice) => choice === value) ?? 'system';
}

async function writeAppearance(choice: Appearance): Promise<void> {
  await writeDeviceValue(KEY, choice);
}
```

In `src/preferences/contrast.ts`, the same import, and:

```ts
async function readContrast(): Promise<Contrast> {
  const value = await readDeviceValue(KEY);
  return CONTRAST_CHOICES.find((choice) => choice === value) ?? 'standard';
}

async function writeContrast(choice: Contrast): Promise<void> {
  await writeDeviceValue(KEY, choice);
}
```

In `src/preferences/completedVisibility.ts`, the same import, the comment's "lives in `sync_meta`" to "lives in the device store", and:

```ts
return (await readDeviceValue(`${KEY_PREFIX}${listId}`)) !== false;
```

```ts
await writeDeviceValue(`${KEY_PREFIX}${listId}`, visible);
```

In `src/hooks/useActiveList.ts`, replace `import { getMeta, putMeta } from '../db/idb';` with `import { readDeviceValue, writeDeviceValue } from '../preferences/deviceStore';`, change the top comment's "same `sync_meta` store a future theme preference will use" to "kept in the device store with the other device preferences (`preferences/deviceStore.ts`)", and:

```ts
await writeDeviceValue(activeListMetaKey, id);
```

```ts
const value = await readDeviceValue(activeListMetaKey);
if (typeof value === 'string') {
  activeListId = value;
  notifyActiveListSubscribers();
  await onActiveListChanged?.();
}
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/preferences src/hooks src/components/SettingsView`
Expected: PASS, including the existing appearance, contrast and completed-visibility tests.

```bash
git add components/web_client/src/preferences components/web_client/src/hooks/useActiveList.ts components/web_client/src/hooks/__tests__/useActiveList.no-indexeddb.unit.test.tsx
git commit -m "feat: keep preferences and the open list without IndexedDB"
```

- [ ] **Step 4: Activate the E2E scenario**

Change `test.skip(` to `test(` for "a user picks Dark and opens a list, and both are kept after reloading".

```bash
./scripts/e2e-up.sh && pnpm test:e2e -- online_mode settings lists
```

Expected: all pass. If the no-IndexedDB test fails on a page error, find the call that still reaches IndexedDB with Offline Mode off and stop: report it rather than widening this DevTask.

```bash
git add e2e/online_mode.e2e.spec.ts
git commit -m "test: activate keeping preferences without IndexedDB"
```

- [ ] **Step 5: Close out the Spec**

- Create `docs/features/[20261117]GH144_online-only-surfaces.md` from `docs/templates/FEATURE.md`: user story, features, Visual Record (this Spec's visual artifact, updated to what was built), E2E titles, manual verification, affected components, decisions S4-1 to S4-7, known gaps.
- `docs/ARCHITECTURE.md`: add ADR-OOM-005 "Device-Local Values Fall Back to `localStorage`" before ADR-OOM-004.
- `docs/DESIGN.md` → device-local preferences: add that they fall back to `localStorage` without IndexedDB (re-opened by Decision 13).
- `CHANGELOG.md` → Unreleased: one entry linking the three DevTask PRs, the Spec PR and the feature doc.
- `docs/PROJECT_STATUS.md`: last completed spec = Spec 4; next = Spec 5 `sync-behind-services` planning.
- `docs/initiatives/online-offline-modes/MILESTONE.md`: Spec 4 done.
- `git rm` this spec doc and its visual artifact.

```bash
git add -A docs CHANGELOG.md
git commit -m "feat: close out every surface working with Offline Mode off" \
  -m "- Feature doc, ADR-OOM-005, DESIGN.md device-local preferences, CHANGELOG, PROJECT_STATUS, MILESTONE" \
  -m "- Spec 4 plan and visual artifact removed"
```

- [ ] **Step 6: Full verification**

Run: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check && pnpm -r test:unit && pnpm -r test:integration && pnpm -r test:component && ./scripts/e2e-up.sh && pnpm test:e2e`
Expected: all green.

---

## Verification (manual)

1. `git pull && pnpm install && pnpm verify:prepare`
2. `docker compose up --build`
3. With Offline Mode on: the header shows the sync control, the navigation shows Sync, `/sync` opens the Sync destination. Unchanged.
4. Turn Offline Mode off in Settings: no sync control, no Sync item; typing `localhost:5173/sync` opens the list.
5. Delete a task, open Recently Deleted: it is there. Restore it: it leaves Recently Deleted and is back in its list. Delete a list with its items and restore it: the list and its tasks come back.
6. In a private window of a browser without IndexedDB in private mode (or with DevTools → Application → Storage → "Block" site data where supported), with Offline Mode off: pick Dark, open a list, reload. Both are kept.
7. `pnpm test:e2e -- online_mode recently_deleted`

---

## Decisions made during spec drafting

- **S4-1 — Recently Deleted gets the seam shape of Lists and Tasks:** `useRecentlyDeleted.ts` (types + seam), `.sync.ts` (today's code, unchanged), `.api.ts` (new), and the pure item rules in `.items.ts`, shared by both.
- **S4-2 — The API path reads Recently Deleted only from `GET /deleted`.** A restore waits for the server, then re-reads Recently Deleted, Lists and Tasks whatever the answer. A delete on this path re-reads Recently Deleted. The query keys live in `hooks/query-keys.ts`, so no API-path hook imports another.
- **S4-3 — Sync-only UI is hidden, not disabled,** with Offline Mode off: the header control, the Sync item, and the Sync destination; `/sync` opens the list. Their IndexedDB reads move into `HeaderSyncStatus` and `SyncDestination`, which mount only with Offline Mode on (Premise 3). `SyncDestination` stays mounted with Offline Mode on, so the sync path keeps loading its records before the user opens Sync.
- **S4-4 — Page sync triggers read Offline Mode when each event fires,** from `localStorage`, with no React wiring. The service worker's background sync is unchanged: it cannot read `localStorage`, and only sync-path writes register it.
- **S4-5 — The fallback covers every device-local value the API path reads:** appearance and contrast (Decision 13), plus "show completed" per list and the open list. Decision 13 names only the first two; without the others the API path still needs IndexedDB, which Spec 3 recorded as Spec 4's to fix. Stale-write records stay IndexedDB-only, as only the sync path has them. **Extends Decision 13: operator to confirm at plan review.**
- **S4-6 — IndexedDB first, `localStorage` only when IndexedDB cannot be opened,** per call, under `psykl:{key}` as JSON. Nothing migrates between them; a value written to the fallback is read back only while IndexedDB stays unavailable.
- **S4-7 — `online-path.stub.ts` is deleted:** restore was its last caller.

## Open Questions / Risks

- **A refused rename, complete or delete still says nothing with Offline Mode off** (Spec 3 known gap). DESIGN.md does not place it in Spec 4. Recommendation: a lightweight `production` change after this Spec, reusing the capture row's existing "could not be saved" message. Operator to decide.
- **Turning Offline Mode on in a browser without IndexedDB** breaks the sync path. The switch is not disabled there. Out of scope; recorded as a known gap.
- **A background-sync event registered before switching off** may still replay queued writes from the service worker while off (S4-4).
- **E2E without IndexedDB** is the first test of the whole app with `window.indexedDB` undefined. Any remaining IndexedDB call on the API path will surface there (DevTask 13 Step 4).

## Affected by / Depends on

- Spec 3 `online-only-lists-tasks` (merged, #154): the API path, `createApiPathWrapper`, `QueryClientProvider` in `SettingsProvider`.
- Spec 1 `data-mode-seam` (merged, #149): the seam, `useUserSettings`, the Service Client shims.
