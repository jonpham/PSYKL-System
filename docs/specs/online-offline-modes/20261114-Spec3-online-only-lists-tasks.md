---
status: TODO
issue: GH144
pr:
completed_at:
created_at: 2026-11-14
initiative: online-offline-modes
spec_number: 3
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - 1
  - 2
  - 3
  - 6
  - 7
  - 10
  - 11
  - 12
  - 14
  - 16
---

# Online-Only Lists and Tasks — Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

**Date:** 2026-11-14
**Initiative:** `online-offline-modes`
**Spec:** 3/5
**Spec User Story:** _As a PSYKL user, I can turn Offline Mode off and work straight against the server: my lists and tasks are what the server holds, every change I make is saved there before I see it, and nothing I changed on this device is left behind when I switch._
**Reads from:** [`docs/initiatives/online-offline-modes/DESIGN.md`](../../initiatives/online-offline-modes/DESIGN.md) Decisions 1-3, 6, 7, 10-12, 14, 16 (LOCKED).
**Visual artifact:** [`20261114-Spec3-online-only-lists-tasks-visual-artifact.md`](20261114-Spec3-online-only-lists-tasks-visual-artifact.md)

**Goal:** Replace the Offline Mode off stubs for Lists and Tasks with TanStack Query implementations over the direct Service Client shims, send the sync queue before switching off, and show the switch as available. Closes #144.

**Architecture:** `SettingsProvider` mounts a fresh `QueryClient` inside its keyed subtree whenever Offline Mode is off, so each off-session starts from an empty cache (Decision 3). `useListsApiClient` and `useTasksApiClient` read with `useQuery` and write through `useServiceClients()` (built with `offlineCapable: false`, Decision 6). Each write waits for the server and then writes the server's answer into the cache. Turning Offline Mode off first runs `flushSyncQueue()`, a `services/` wrapper over `replay({ ignoreBackoff: true })` capped at 5 seconds (Decision 11).

**Tech Stack:** React 19, `@tanstack/react-query` 5 (new dependency), `fractional-indexing` (already a dependency), Vitest + MSW, Storybook 8 play functions, Playwright.

> Glossary:
>
> - PWA = Progressive Web App. IDB = IndexedDB, the browser's local database.
> - Offline Mode on = the sync path (IDB + sync queue). Offline Mode off = the API path (server + TanStack Query's in-memory cache).
> - TanStack Query = `@tanstack/react-query`, an in-memory server-state cache for React. `QueryClient` = one such cache.
> - Flush = one replay of the sync queue, sending every queued write regardless of its retry wait.
> - MSW = Mock Service Worker, the HTTP stub the unit tests run against.

> Vocabulary reminder: `DevTask` is the AGENTS.md workflow term for a PR-sized unit of work. `Task` without the prefix is the PSYKL data entity.

## Global Constraints

- Client-only: `components/web_client/src/` and `e2e/`. No `service-task` or `packages/shared-types` change; Spec 2's contract (optional `position` on list create) is consumed as-is.
- UI Components keep calling `useLists()` / `useTasks()`. No TanStack type appears in `UseListsResult` or `UseTasksResult` (Decisions 1, 14).
- `useLists.api.ts` and `useTasks.api.ts` must not import `useLists.positions`, `useLists.default-list`, `sync/`, or `db/` (Decision 7). The default list is `DEFAULT_LIST_ID` from `services/default-list.ts`.
- The API path never sends `position` on list create (Decision 10).
- Sync-path behaviour does not change. With Offline Mode on, every existing test passes unchanged.
- Default `X-User-Id` stays `local`.
- ≤10 production files per DevTask PR. Every new user-visible behaviour ships with an E2E test in the same PR.
- E2E test titles are user stories. No milestone tokens in file names or identifiers.
- Before the first typecheck of DevTask 8, regenerate the gitignored API types: `pnpm verify:prepare` (the local `src/api/types.ts` predates Spec 2 and still marks `ListInput.position` required).

## Review Focus

1. **Turning Offline Mode off with the server down.** The flush retries what it can and ends within 5 seconds; the switch still flips; the app shows "Failed to load tasks". Pinned by DevTask 10 `flush-sync-queue.unit.test.ts` → "gives up waiting after 5 seconds" and `SettingsProvider.unit.test.tsx` → "switches off even when the flush fails".
2. **A second tap while changes are being sent.** The switch is disabled until the flush ends, so a double tap cannot queue two switches. Pinned by DevTask 10 `SettingsView.offline-mode.unit.test.tsx` → "disables the switch while changes are being sent".
3. **Moving a list between neighbours whose positions are not in order** (two devices wrote the same key). `generateKeyBetween` throws; `moveList` rejects and the cache is unchanged, and `ListsPage` already logs a rejected move. Pinned by DevTask 8 → "refuses a move between neighbours out of order and keeps the lists as they were".
4. **A stale cache across switches.** Off, on, then off again must fetch the server's lists again, not show the first off-session's cache. Pinned by DevTask 8 `SettingsProvider.unit.test.tsx` → "starts each Offline Mode off session from an empty cache".
5. **A capture that resolves after the user changed list.** The task lands in the list that was active when it was typed. Pinned by DevTask 9 → "captures a task into the list that was active when it was typed".

---

## Data Model

No schema changes. The API path holds no persistent state of its own.

## API

No API surface change. The API path uses the existing endpoints through the existing `*-api-client.ts` functions:

| Call                                      | Endpoint                                                  |
| ----------------------------------------- | --------------------------------------------------------- |
| `useListsApiClient` read                  | `GET /lists` (server filters deleted, orders by position) |
| `createList`                              | `POST /lists` without `position` (server appends)         |
| `renameList` / `moveList`                 | `PATCH /lists/{id}`                                       |
| `deleteList`                              | `DELETE /lists/{id}`                                      |
| `useTasksApiClient` read                  | `GET /tasks?include_deleted=1`, filtered client-side      |
| `createTask` / `patchTask` / `deleteTask` | `POST /tasks`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}`  |

## Visual Artifact

[`20261114-Spec3-online-only-lists-tasks-visual-artifact.md`](20261114-Spec3-online-only-lists-tasks-visual-artifact.md): the switch in its available color, and the "Sending changes made on this device…" state while turning Offline Mode off.

---

## DevTasks

Three DevTasks, numbered globally (Spec 1 = 1-4, Spec 2 = 5-7). Each depends on the one before it: DevTask 9 needs DevTask 8's `QueryClientProvider` and test wrapper, and DevTask 10 marks the path available only once both entities work. Each branches off the Spec integration branch `spec/online-offline-modes-s3-online-only-lists-tasks` once its predecessor has merged there, or stacks on it if the operator asks for stacked drafts.

### DevTask 8: Lists work with Offline Mode off

**Files:** 4 production files: `components/web_client/src/components/SettingsProvider/SettingsProvider.tsx`, `components/web_client/src/hooks/useLists.api.ts`, `e2e/online_mode.e2e.spec.ts` (new), `e2e/helpers/task-api.ts`. `components/web_client/package.json` and `pnpm-lock.yaml` also change (not counted).
**Branch:** `feat/online-offline-modes-s3-dt8-online-lists`
**PR:** _tbd_

**Interfaces:**

- Consumes: `useServiceClients().lists: ListServiceClient` (`create(id, body, optimistic)`, `patch`, `delete`, `list`); `isDefaultList`, `DEFAULT_LIST_ID` from `services/default-list.ts`; `generateKeyBetween` from `fractional-indexing`.
- Produces:
  - `SettingsProvider` wraps its keyed children in `<QueryClientProvider>` when `offlineMode === false`, with a new `QueryClient` per off-session.
  - `createApiPathWrapper(): ({ children }) => JSX.Element` in `src/test/api-path-wrapper.tsx` (test fixture): a fresh `QueryClient` (`retry: false`) plus `ServiceClientsContext` built with `createServiceClients(false)`.
  - `useListsApiClient(): UseListsResult`, fully implemented. Query key `['lists']`.
  - `fetchServerLists(userId: string): Promise<Array<{ id: string; title: string; position: string }>>` in `e2e/helpers/task-api.ts`.

- [ ] **Step 1: Add the dependency and regenerate API types**

```bash
pnpm --filter @psykl/web-client add @tanstack/react-query@^5.107.1
pnpm verify:prepare
grep -n "ListInput: {" -A6 components/web_client/src/api/types.ts
```

Expected: `position?: string;` in `ListInput`.

- [ ] **Step 2: Commit the inactive E2E scenario**

Create `e2e/online_mode.e2e.spec.ts`:

```ts
import type { Page } from '@playwright/test';

import { expect, test } from './helpers/isolated-test';
import { createList, openList } from './helpers/selection';
import { fetchServerLists } from './helpers/task-api';

async function turnOfflineModeOffBeforeLoading(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('psykl:offline-mode', 'false'));
}

test.describe('with Offline Mode off', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test.beforeEach(async ({ page }) => {
    await turnOfflineModeOffBeforeLoading(page);
  });

  test.skip('a user adds a list, finds it saved on the server, and still sees it after reloading', async ({ page }) => {
    await page.goto('/');
    await createList(page, 'Groceries');

    await expect
      .poll(async () => (await fetchServerLists('local')).map((list) => list.title))
      .toEqual(['Tasks', 'Groceries']);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Groceries', exact: true })).toBeVisible();
  });

  test.skip('a user can delete a list they made, but is never offered to delete Tasks', async ({ page }) => {
    await page.goto('/');
    await createList(page, 'Errands');

    await openList(page, 'Tasks');
    await page.getByRole('button', { name: 'List options' }).click();
    await expect(page.getByRole('menuitem', { name: 'Select Items' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete List' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await openList(page, 'Errands');
    await page.getByRole('button', { name: 'List options' }).click();
    await page.getByRole('menuitem', { name: 'Delete List' }).click();
    await page.getByRole('dialog', { name: 'Delete "Errands"?' }).getByRole('button', { name: 'Delete List' }).click();

    await expect.poll(async () => (await fetchServerLists('local')).map((list) => list.title)).toEqual(['Tasks']);
  });
});
```

Add to `e2e/helpers/task-api.ts`:

```ts
export async function fetchServerLists(
  userId: string,
): Promise<Array<{ id: string; title: string; position: string }>> {
  const response = await fetch(new URL('/lists', apiBaseUrl), { headers: { 'X-User-Id': userId } });
  expect(response.ok).toBe(true);
  return (await response.json()) as Array<{ id: string; title: string; position: string }>;
}
```

An empty list's delete dialog confirms with a single "Delete List" button (`DeleteListDialog.tsx`).

Run: `pnpm --filter e2e exec tsc --noEmit`
Expected: no errors.

Commit: `test: describe lists with Offline Mode off as inactive end-to-end scenarios`

- [ ] **Step 3: Write the test wrapper and the failing hook tests**

Create `components/web_client/src/test/api-path-wrapper.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { createServiceClients, ServiceClientsContext } from '../hooks/useServiceClients';

/** Renders a hook on the API path: a fresh query cache that never retries,
 * and the direct (`offlineCapable: false`) Service Client shims. */
export function createApiPathWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const clients = createServiceClients(false);
  return function ApiPathWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceClientsContext.Provider value={clients}>{children}</ServiceClientsContext.Provider>
      </QueryClientProvider>
    );
  };
}
```

Change the MSW list create handler (`src/test/msw-handlers.lists.ts`) to append like the server when no `position` is sent. Add `import { generateKeyBetween } from 'fractional-indexing';` and replace the validation and `position` lines:

```ts
if (!body.id || !body.title || !body.updated_at) {
  return new HttpResponse(null, { status: 400 });
}
const last = [...listStore].sort((a, b) => (a.position < b.position ? -1 : 1)).at(-1);
const position = body.position ?? generateKeyBetween(last?.position ?? null, null);
```

and use `position` in the stored list.

Create `components/web_client/src/hooks/__tests__/useLists.api.unit.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { ListRecord } from '../../db/idb.types';
import { DEFAULT_LIST_ID } from '../../services/default-list';
import { createApiPathWrapper } from '../../test/api-path-wrapper';
import { server } from '../../test/setup';
import { useListsApiClient } from '../useLists.api';

function list(id: string, title: string, position: string): ListRecord {
  const at = '2026-11-14T10:00:00.000Z';
  return {
    created_at: at,
    deleted_at: null,
    id,
    position,
    server_updated_at: at,
    title,
    updated_at: at,
    user_id: 'local',
  };
}

const tasksList = list(DEFAULT_LIST_ID, 'Tasks', 'a0');
const groceries = list('0199cccc-0000-7000-8000-000000000001', 'Groceries', 'a2');

function serverHolds(lists: ListRecord[]) {
  server.use(http.get('*/lists', () => HttpResponse.json(lists)));
}

async function renderLists() {
  const { result } = renderHook(() => useListsApiClient(), { wrapper: createApiPathWrapper() });
  await waitFor(() => expect(result.current.lists.length).toBeGreaterThan(0));
  return result;
}

describe('useListsApiClient', () => {
  it('shows the lists the server holds, in position order', async () => {
    // Arrange
    serverHolds([groceries, tasksList]);

    // Act
    const result = await renderLists();

    // Assert
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Groceries']);
  });

  it('adds a list without picking its position and shows the one the server gave it', async () => {
    // Arrange
    serverHolds([tasksList]);
    let sent: Record<string, unknown> = {};
    server.use(
      http.post('*/lists', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...list(String(sent['id']), String(sent['title']), 'a1') }, { status: 201 });
      }),
    );
    const result = await renderLists();

    // Act
    await act(() => result.current.createList('Reading'));

    // Assert
    expect(sent).not.toHaveProperty('position');
    expect(result.current.lists.map((item) => [item.title, item.position])).toEqual([
      ['Tasks', 'a0'],
      ['Reading', 'a1'],
    ]);
  });

  it('renames a list once the server has it', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    server.use(
      http.patch('*/lists/:id', async ({ request }) => {
        const body = (await request.json()) as { title: string; updated_at: string };
        return HttpResponse.json({ ...groceries, title: body.title, updated_at: body.updated_at });
      }),
    );
    const result = await renderLists();

    // Act
    await act(() => result.current.renameList(groceries.id, 'Food'));

    // Assert
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Food']);
  });

  it('moves a list between its neighbours', async () => {
    // Arrange
    const reading = list('0199cccc-0000-7000-8000-000000000002', 'Reading', 'a4');
    serverHolds([tasksList, groceries, reading]);
    let sentPosition = '';
    server.use(
      http.patch('*/lists/:id', async ({ request }) => {
        const body = (await request.json()) as { position: string; updated_at: string };
        sentPosition = body.position;
        return HttpResponse.json({ ...reading, position: body.position });
      }),
    );
    const result = await renderLists();

    // Act — Reading goes between Tasks (a0) and Groceries (a2)
    await act(() => result.current.moveList(reading.id, tasksList, groceries));

    // Assert
    expect(sentPosition > 'a0' && sentPosition < 'a2').toBe(true);
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Reading', 'Groceries']);
  });

  it('refuses a move between neighbours out of order and keeps the lists as they were', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    const result = await renderLists();

    // Act / Assert
    await expect(result.current.moveList(tasksList.id, groceries, groceries)).rejects.toThrow();
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Groceries']);
  });

  it('never offers to delete Tasks or the last list, and offers any other', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    const result = await renderLists();

    // Assert
    expect(result.current.canDeleteList(DEFAULT_LIST_ID)).toBe(false);
    expect(result.current.canDeleteList(groceries.id)).toBe(true);
  });

  it('deletes another list and stops showing it', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    let deleted = '';
    server.use(
      http.delete('*/lists/:id', ({ params }) => {
        deleted = String(params['id']);
        return HttpResponse.json({ ...groceries, deleted_at: '2026-11-14T11:00:00.000Z' });
      }),
    );
    const result = await renderLists();

    // Act
    await act(() => result.current.deleteList(groceries.id));

    // Assert
    expect(deleted).toBe(groceries.id);
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks']);
  });

  it('keeps the lists as they were when the server refuses a write', async () => {
    // Arrange
    serverHolds([tasksList]);
    server.use(http.post('*/lists', () => new HttpResponse(null, { status: 503 })));
    const result = await renderLists();

    // Act / Assert
    await expect(result.current.createList('Reading')).rejects.toThrow('create failed');
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks']);
  });
});
```

Delete the `renameList` case from `src/hooks/__tests__/online-path.stub.unit.test.ts` (the hook is no longer a stub, and calling it outside React is invalid).

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useLists.api.unit.test.tsx`
Expected: FAIL, every case: no lists ever load (the stub returns `[]`), or writes reject with "is not available with Offline Mode off yet".

- [ ] **Step 4: Implement `useListsApiClient`**

Replace `components/web_client/src/hooks/useLists.api.ts`:

```ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateKeyBetween } from 'fractional-indexing';
import { useCallback, useMemo } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { ListRecord } from '../db/idb.types';
import { isDefaultList } from '../services/default-list';
import type { UseListsResult } from './useLists';
import { useServiceClients } from './useServiceClients';

const LISTS_QUERY_KEY = ['lists'] as const;
const NO_LISTS: ListRecord[] = [];

/**
 * The online-only path for Lists (Offline Mode off). The server is the source
 * of truth and TanStack Query's cache is the only copy (DESIGN.md Decision 2).
 * Every write waits for the server, then puts the server's answer in the cache,
 * so the user only ever sees what the server holds (Spec 3 decision S3-2). The
 * server picks a new list's position (Decision 10); a move computes the key
 * between the two neighbours it is given (S3-3). Must not import
 * useLists.positions or useLists.default-list, which read IndexedDB (Decision 7).
 */
function useListsApiClient(): UseListsResult {
  const { lists: listServiceClient } = useServiceClients();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryFn: () => listServiceClient.list(), queryKey: LISTS_QUERY_KEY });
  const lists = useMemo(() => (data ? visibleLists(data) : NO_LISTS), [data]);

  const store = useCallback(
    (saved: ListRecord) => {
      queryClient.setQueryData<ListRecord[]>(LISTS_QUERY_KEY, (current = []) =>
        visibleLists([...current.filter((item) => item.id !== saved.id), saved]),
      );
    },
    [queryClient],
  );

  const canDeleteList = useCallback((id: string) => lists.length > 1 && !isDefaultList(id), [lists]);

  const createList = useCallback(
    async (title: string): Promise<ListRecord> => {
      const id = uuidv7();
      const now = new Date().toISOString();
      // The direct shim sends only `body`; the optimistic record is a sync-path
      // argument, so its empty position is never stored or shown.
      const optimistic: ListRecord = {
        created_at: now,
        deleted_at: null,
        id,
        position: '',
        server_updated_at: now,
        title,
        updated_at: now,
        user_id: 'local',
      };
      const saved = await listServiceClient.create(id, { id, title, updated_at: now }, optimistic);
      store(saved);
      return saved;
    },
    [listServiceClient, store],
  );

  const deleteList = useCallback(
    async (id: string, deletedAt?: string): Promise<void> => {
      const existing = lists.find((item) => item.id === id);
      if (!existing || !canDeleteList(id)) {
        return;
      }
      const deleted_at = deletedAt ?? new Date().toISOString();
      const deleted: ListRecord = { ...existing, deleted_at, updated_at: deleted_at };
      await listServiceClient.delete(id, { deleted_at }, deleted);
      store(deleted);
    },
    [canDeleteList, listServiceClient, lists, store],
  );

  const moveList = useCallback(
    async (id: string, before: ListRecord | null, after: ListRecord | null): Promise<void> => {
      const existing = lists.find((item) => item.id === id);
      if (!existing) {
        return;
      }
      // Throws when the neighbours are not in order; the caller logs it.
      const position = generateKeyBetween(before?.position ?? null, after?.position ?? null);
      const updated_at = new Date().toISOString();
      store(await listServiceClient.patch(id, { position, updated_at }, { ...existing, position, updated_at }));
    },
    [listServiceClient, lists, store],
  );

  const renameList = useCallback(
    async (id: string, title: string): Promise<void> => {
      const existing = lists.find((item) => item.id === id);
      if (!existing) {
        return;
      }
      const updated_at = new Date().toISOString();
      store(await listServiceClient.patch(id, { title, updated_at }, { ...existing, title, updated_at }));
    },
    [listServiceClient, lists, store],
  );

  return { canDeleteList, createList, deleteList, lists, moveList, renameList };
}

/** Open lists in position order; positions compare as plain strings, matching
 * the server's `COLLATE "C"`. */
function visibleLists(lists: ListRecord[]): ListRecord[] {
  return lists
    .filter((item) => item.deleted_at === null)
    .sort((left, right) => (left.position < right.position ? -1 : left.position > right.position ? 1 : 0));
}

export { useListsApiClient };
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useLists.api.unit.test.tsx`
Expected: PASS, 8/8.

Commit: `feat: show and change lists straight on the server with Offline Mode off`

- [ ] **Step 5: Write the failing provider tests**

Add to `components/web_client/src/components/SettingsProvider/__tests__/SettingsProvider.unit.test.tsx` (keep its existing imports and `afterEach`; add the ones below):

```tsx
import { http, HttpResponse } from 'msw';

import { useLists } from '../../../hooks/useLists';
import { writeOfflineMode } from '../../../preferences/offlineMode';
import { server } from '../../../test/setup';
import { DEFAULT_LIST_ID } from '../../../services/default-list';

function ListTitles() {
  const { lists } = useLists();
  return <p>{lists.map((list) => list.title).join(', ') || 'none'}</p>;
}

const tasksList = {
  created_at: '2026-11-14T10:00:00.000Z',
  deleted_at: null,
  id: DEFAULT_LIST_ID,
  position: 'a0',
  server_updated_at: '2026-11-14T10:00:00.000Z',
  title: 'Tasks',
  updated_at: '2026-11-14T10:00:00.000Z',
  user_id: 'local',
};

describe('SettingsProvider — Offline Mode off', () => {
  it('lets the lists be read from the server', async () => {
    // Arrange
    writeOfflineMode(false);
    server.use(http.get('*/lists', () => HttpResponse.json([tasksList])));

    // Act
    render(
      <SettingsProvider>
        <ListTitles />
      </SettingsProvider>,
    );

    // Assert
    expect(await screen.findByText('Tasks')).toBeInTheDocument();
  });

  it('starts each Offline Mode off session from an empty cache', async () => {
    // Arrange
    writeOfflineMode(false);
    let reads = 0;
    server.use(
      http.get('*/lists', () => {
        reads += 1;
        return HttpResponse.json([tasksList]);
      }),
    );
    let settings: UserSettings | undefined;
    function Capture() {
      settings = useUserSettings();
      return <ListTitles />;
    }
    render(
      <SettingsProvider>
        <Capture />
      </SettingsProvider>,
    );
    await screen.findByText('Tasks');

    // Act — on, then off again
    act(() => settings!.setOfflineMode(true));
    act(() => settings!.setOfflineMode(false));

    // Assert
    await waitFor(() => expect(reads).toBe(2));
  });
});
```

Switching back on mounts the sync path, which opens IndexedDB, so the file needs the same isolation as `App.offline-mode.unit.test.tsx`: add `import 'fake-indexeddb/auto';` as its first line, `import { deleteDB } from 'idb';` and `import { resetUseListsForTest } from '../../../hooks/useLists';`, and make its `afterEach` `async`, calling `resetUseListsForTest()` and `await deleteDB('psykl')`. The file already imports `act`, `render`, `screen` and `useUserSettings`; add `waitFor` to the `@testing-library/react` import and `type UserSettings` to the `useUserSettings` import, and drop the duplicate `writeOfflineMode` import shown above.

Run: `pnpm --filter @psykl/web-client exec vitest run src/components/SettingsProvider`
Expected: FAIL: "No QueryClient set, use QueryClientProvider to set one".

- [ ] **Step 6: Mount a query cache per Offline Mode off session**

In `components/web_client/src/components/SettingsProvider/SettingsProvider.tsx`, add the import and replace the keyed fragment:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
```

```tsx
// One cache per Offline Mode off session: the remount below drops it, so
// turning the mode off again always starts from what the server says.
const queryClient = useMemo(
  () => (offlineMode ? null : new QueryClient({ defaultOptions: { queries: { retry: 1 } } })),
  [offlineMode],
);
```

```tsx
<Fragment key={offlineMode ? 'offline' : 'online'}>
  {queryClient ? <QueryClientProvider client={queryClient}>{children}</QueryClientProvider> : children}
</Fragment>
```

Extend the component's doc comment with: "With Offline Mode off it also owns the TanStack Query cache the API path reads (Decision 2)."

Run: `pnpm --filter @psykl/web-client exec vitest run src/components/SettingsProvider src/hooks src/__tests__`
Expected: PASS.

Commit: `feat: give each Offline Mode off session its own query cache`

- [ ] **Step 7: Activate the E2E scenarios**

Remove both `.skip`s in `e2e/online_mode.e2e.spec.ts`.

Run (with `dangerouslyDisableSandbox`): `./scripts/e2e-up.sh && pnpm test:e2e -- online_mode`, then `docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v`.
Expected: 2 passed.

Commit: `test: activate lists with Offline Mode off end-to-end scenarios`

- [ ] **Step 8: Full verification and spec checkbox**

Run: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check && pnpm -r test:unit && pnpm -r test:integration && pnpm -r test:component`
Expected: all green. Tick DevTask 8 in this doc in the same commit as any fix, or alone as `docs:`.

### DevTask 9: Tasks work with Offline Mode off

**Files:** 3 production files: `components/web_client/src/hooks/useTasks.api.ts`, `e2e/online_mode.e2e.spec.ts`, `e2e/helpers/multi-device.ts`.
**Branch:** `feat/online-offline-modes-s3-dt9-online-tasks`
**PR:** _tbd_

**Interfaces:**

- Consumes: DevTask 8's `QueryClientProvider` in `SettingsProvider` and `createApiPathWrapper()`; `useServiceClients().tasks: TaskServiceClient`; `useActiveListId()`, `getActiveListId()`, `setActiveListId()` from `hooks/useActiveList.ts`; `DEFAULT_LIST_ID`.
- Produces: `useTasksApiClient(): UseTasksResult`, fully implemented. Query key `['tasks']`. `loading` = the first fetch is pending; `error` = `'Failed to load tasks'` when it failed.

- [ ] **Step 1: Commit the inactive E2E scenarios**

Append inside the `describe` of `e2e/online_mode.e2e.spec.ts` (add `createTask` to the `./helpers/selection` import and `import { expectServerTaskVisible } from './helpers/multi-device';`):

```ts
test.skip('a user adds a task, finds it saved on the server, and still sees it after reloading', async ({ page }) => {
  const title = `call the dentist ${Date.now()}`;
  await page.goto('/');
  await createTask(page, title);

  await expectServerTaskVisible('local', title);
  await page.reload();
  await expect(page.getByRole('listitem', { name: title })).toBeVisible();
});

test.skip('a task added to another list stays in that list', async ({ page }) => {
  const title = `oat milk ${Date.now()}`;
  await page.goto('/');
  await createList(page, 'Groceries');
  await openList(page, 'Groceries');
  await createTask(page, title);

  const groceries = (await fetchServerLists('local')).find((list) => list.title === 'Groceries');
  const task = await expectServerTaskVisible('local', title);
  expect(task.list_id).toBe(groceries?.id);
  await openList(page, 'Tasks');
  await expect(page.getByRole('listitem', { name: title })).toHaveCount(0);
});
```

Add `list_id: string | null;` to `TaskRow` in `e2e/helpers/multi-device.ts`; the server already returns it. This makes `e2e/helpers/multi-device.ts` a third counted file for this DevTask.

Run: `pnpm --filter e2e exec tsc --noEmit`
Expected: no errors.

Commit: `test: describe tasks with Offline Mode off as inactive end-to-end scenarios`

- [ ] **Step 2: Write the failing hook tests**

Create `components/web_client/src/hooks/__tests__/useTasks.api.unit.test.tsx`:

```tsx
import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import type { Task } from '../../api/client';
import { DEFAULT_LIST_ID } from '../../services/default-list';
import { createApiPathWrapper } from '../../test/api-path-wrapper';
import { server } from '../../test/setup';
import { resetActiveListForTest, setActiveListId } from '../useActiveList';
import { useTasksApiClient } from '../useTasks.api';

const groceriesId = '0199cccc-0000-7000-8000-000000000001';

function task(id: string, title: string, listId: string | null, createdAt: string, extra: Partial<Task> = {}): Task {
  return {
    completed_at: null,
    created_at: createdAt,
    deleted_at: null,
    id,
    list_id: listId,
    server_updated_at: createdAt,
    title,
    updated_at: createdAt,
    user_id: 'local',
    ...extra,
  };
}

const stamps = task('0199dddd-0000-7000-8000-000000000001', 'buy stamps', DEFAULT_LIST_ID, '2026-11-14T10:00:00.000Z');
const legacy = task('0199dddd-0000-7000-8000-000000000002', 'old task', null, '2026-11-14T09:00:00.000Z');
const milk = task('0199dddd-0000-7000-8000-000000000003', 'oat milk', groceriesId, '2026-11-14T11:00:00.000Z');
const gone = task('0199dddd-0000-7000-8000-000000000004', 'gone', DEFAULT_LIST_ID, '2026-11-14T12:00:00.000Z', {
  deleted_at: '2026-11-14T12:30:00.000Z',
});

function serverHolds(tasks: Task[]) {
  server.use(http.get('*/tasks', () => HttpResponse.json(tasks)));
}

function echoCreate(sent: { body?: Record<string, unknown> }) {
  server.use(
    http.post('*/tasks', async ({ request }) => {
      const body = (await request.json()) as { id: string; list_id: string | null; title: string; updated_at: string };
      sent.body = body;
      return HttpResponse.json(task(body.id, body.title, body.list_id, body.updated_at), { status: 201 });
    }),
  );
}

async function renderTasks() {
  const { result } = renderHook(() => useTasksApiClient(), { wrapper: createApiPathWrapper() });
  await waitFor(() => expect(result.current.loading).toBe(false));
  return result;
}

afterEach(async () => {
  resetActiveListForTest();
  await deleteDB('psykl');
});

describe('useTasksApiClient', () => {
  it('shows only the open tasks of the active list, newest first, with list-less tasks under Tasks', async () => {
    // Arrange
    serverHolds([legacy, stamps, milk, gone]);
    await setActiveListId(DEFAULT_LIST_ID);

    // Act
    const result = await renderTasks();

    // Assert
    expect(result.current.tasks.map((item) => item.title)).toEqual(['buy stamps', 'old task']);
    expect(result.current.error).toBeNull();
  });

  it('shows another list’s tasks when that list is active', async () => {
    // Arrange
    serverHolds([stamps, milk]);
    await setActiveListId(groceriesId);

    // Act
    const result = await renderTasks();

    // Assert
    expect(result.current.tasks.map((item) => item.title)).toEqual(['oat milk']);
  });

  it('captures a task into the list that was active when it was typed', async () => {
    // Arrange
    serverHolds([]);
    await setActiveListId(groceriesId);
    const sent: { body?: Record<string, unknown> } = {};
    echoCreate(sent);
    const result = await renderTasks();

    // Act
    const capture = result.current.createTask('pasta');
    await setActiveListId(DEFAULT_LIST_ID);
    await act(() => capture);

    // Assert
    expect(sent.body?.['list_id']).toBe(groceriesId);
  });

  it('captures into Tasks when no list has been chosen on this device', async () => {
    // Arrange
    serverHolds([]);
    const sent: { body?: Record<string, unknown> } = {};
    echoCreate(sent);
    const result = await renderTasks();

    // Act
    await act(() => result.current.createTask('pasta'));

    // Assert
    expect(sent.body?.['list_id']).toBe(DEFAULT_LIST_ID);
    expect(result.current.tasks.map((item) => item.title)).toEqual(['pasta']);
  });

  it('completes a task once the server has it', async () => {
    // Arrange
    serverHolds([stamps]);
    await setActiveListId(DEFAULT_LIST_ID);
    server.use(
      http.patch('*/tasks/:id', async ({ request }) => {
        const body = (await request.json()) as { completed_at: string; updated_at: string };
        return HttpResponse.json({ ...stamps, completed_at: body.completed_at, updated_at: body.updated_at });
      }),
    );
    const result = await renderTasks();
    const at = '2026-11-14T13:00:00.000Z';

    // Act
    await act(() => result.current.patchTask(stamps.id, { completed_at: at, updated_at: at }, stamps));

    // Assert
    expect(result.current.tasks[0]?.completed_at).toBe(at);
  });

  it('stops showing a deleted task', async () => {
    // Arrange
    serverHolds([stamps]);
    await setActiveListId(DEFAULT_LIST_ID);
    server.use(
      http.delete('*/tasks/:id', () => HttpResponse.json({ ...stamps, deleted_at: '2026-11-14T13:00:00.000Z' })),
    );
    const result = await renderTasks();
    const at = '2026-11-14T13:00:00.000Z';

    // Act
    await act(() =>
      result.current.deleteTask(stamps.id, { deleted_at: at, updated_at: at }, { ...stamps, deleted_at: at }),
    );

    // Assert
    expect(result.current.tasks).toEqual([]);
  });

  it('says the tasks could not be loaded when the server is unreachable', async () => {
    // Arrange
    server.use(http.get('*/tasks', () => HttpResponse.error()));

    // Act
    const result = await renderTasks();

    // Assert
    expect(result.current.error).toBe('Failed to load tasks');
    expect(result.current.tasks).toEqual([]);
  });

  it('shows nothing new when the server refuses a capture', async () => {
    // Arrange
    serverHolds([]);
    server.use(http.post('*/tasks', () => new HttpResponse(null, { status: 503 })));
    const result = await renderTasks();

    // Act / Assert
    await expect(result.current.createTask('pasta')).rejects.toThrow('create failed');
    expect(result.current.tasks).toEqual([]);
  });
});
```

Rewrite `src/hooks/__tests__/online-path.stub.unit.test.ts` to test the helper that `useRecentlyDeleted` still uses until Spec 4:

```ts
import { describe, expect, it } from 'vitest';

import { notImplementedOnline } from '../online-path.stub';

describe('notImplementedOnline', () => {
  it('refuses a write with a named error instead of dropping it silently', async () => {
    // When / Then
    await expect(notImplementedOnline('restore')).rejects.toMatchObject({
      message: 'restore is not available with Offline Mode off yet',
    });
  });
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks/__tests__/useTasks.api.unit.test.tsx`
Expected: FAIL: tasks are always `[]` and captures reject with "createTask is not available with Offline Mode off yet".

- [ ] **Step 3: Implement `useTasksApiClient`**

Replace `components/web_client/src/hooks/useTasks.api.ts`:

```ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { Task, TaskDeleteInput, TaskPatchInput } from '../api/client';
import { DEFAULT_LIST_ID } from '../services/default-list';
import { getActiveListId, useActiveListId } from './useActiveList';
import type { UseTasksResult } from './useTasks';
import { useServiceClients } from './useServiceClients';

const TASKS_QUERY_KEY = ['tasks'] as const;
const NO_TASKS: Task[] = [];

/**
 * The online-only path for Tasks (Offline Mode off). Mirrors the sync path's
 * view — open tasks of the active list, newest first, list-less tasks under
 * Tasks — but reads the server through TanStack Query, and every write waits for
 * the server before it shows (Spec 3 decision S3-2). A capture with no list
 * chosen lands in Tasks by its fixed id (S3-4); this path never bootstraps a
 * default list, because the server keeps one (Decision 15).
 */
function useTasksApiClient(): UseTasksResult {
  const { tasks: taskServiceClient } = useServiceClients();
  const queryClient = useQueryClient();
  const activeListId = useActiveListId();
  const query = useQuery({ queryFn: () => taskServiceClient.list(), queryKey: TASKS_QUERY_KEY });

  const tasks = useMemo(
    () =>
      (query.data ?? NO_TASKS)
        .filter((task) => task.deleted_at === null && isInList(task, activeListId))
        .sort((left, right) => right.created_at.localeCompare(left.created_at)),
    [activeListId, query.data],
  );

  const store = useCallback(
    (saved: Task) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) => [
        ...current.filter((task) => task.id !== saved.id),
        saved,
      ]);
    },
    [queryClient],
  );

  const createTask = useCallback(
    async (title: string): Promise<Task> => {
      const id = uuidv7();
      const now = new Date().toISOString();
      // Read once, now: the list the user was looking at when they typed.
      const list_id = getActiveListId() ?? DEFAULT_LIST_ID;
      const optimistic: Task = {
        completed_at: null,
        created_at: now,
        deleted_at: null,
        id,
        list_id,
        server_updated_at: now,
        title,
        updated_at: now,
        user_id: 'local',
      };
      const saved = await taskServiceClient.create(id, { id, list_id, title, updated_at: now }, optimistic);
      store(saved);
      return saved;
    },
    [store, taskServiceClient],
  );

  const patchTask = useCallback(
    async (id: string, body: TaskPatchInput, optimistic: Task): Promise<Task> => {
      const saved = await taskServiceClient.patch(id, body, optimistic);
      store(saved);
      return saved;
    },
    [store, taskServiceClient],
  );

  const deleteTask = useCallback(
    async (id: string, body: TaskDeleteInput, optimistic: Task): Promise<void> => {
      await taskServiceClient.delete(id, body, optimistic);
      store({ ...optimistic, deleted_at: body.deleted_at, updated_at: body.updated_at });
    },
    [store, taskServiceClient],
  );

  return {
    createTask,
    deleteTask,
    error: query.isError ? 'Failed to load tasks' : null,
    loading: query.isPending && !query.isError,
    patchTask,
    tasks,
  };
}

/** Same rule as the sync path's `isInActiveList`, with the default list known
 * by its fixed id rather than read from IndexedDB. */
function isInList(task: Task, activeListId: string | null): boolean {
  if (activeListId === null || task.list_id === activeListId) {
    return true;
  }
  return task.list_id === null && activeListId === DEFAULT_LIST_ID;
}

export { useTasksApiClient };
```

Run: `pnpm --filter @psykl/web-client exec vitest run src/hooks src/__tests__`
Expected: PASS, including 8/8 in `useTasks.api.unit.test.tsx`.

Retitle the one case in `src/__tests__/App.offline-mode.unit.test.tsx` to `'renders the shell and the server’s empty list'`; its body is unchanged and still passes against MSW's empty stores.

Commit: `feat: show and change tasks straight on the server with Offline Mode off`

- [ ] **Step 4: Activate the E2E scenarios**

Remove the two new `.skip`s.

Run (with `dangerouslyDisableSandbox`): `./scripts/e2e-up.sh && pnpm test:e2e -- online_mode`, then the compose `down -v`.
Expected: 4 passed.

Commit: `test: activate tasks with Offline Mode off end-to-end scenarios`

- [ ] **Step 5: Full verification and spec checkbox**

As DevTask 8 Step 8.

### DevTask 10: Turning Offline Mode off sends waiting changes, and the switch shows as available

**Files:** 8 production files: `components/web_client/src/services/flush-sync-queue.ts` (new), `components/web_client/src/sync/replay.ts`, `components/web_client/src/hooks/useUserSettings.ts`, `components/web_client/src/components/SettingsProvider/SettingsProvider.tsx`, `components/web_client/src/components/SettingsView/SettingsView.tsx`, `components/web_client/src/components/SettingsView/settings-view.css`, `components/web_client/src/hooks/online-path.stub.ts`, `e2e/settings.e2e.spec.ts`.
**Branch:** `feat/online-offline-modes-s3-dt10-flush-on-switch-off`
**PR:** _tbd_

**Interfaces:**

- Consumes: `replay(options: ReplayOptions): Promise<ReplayResult>` from `sync/replay.ts`; `expectServerTaskVisible` from `e2e/helpers/multi-device.ts`; `createTask` from `e2e/helpers/selection.ts`.
- Produces:
  - `ReplayOptions.ignoreBackoff?: boolean`: when true, every queued entry is due.
  - `flushSyncQueue(timeoutMs?: number): Promise<void>` in `services/flush-sync-queue.ts`, with `FLUSH_TIMEOUT_MS = 5_000`. Never rejects.
  - `UserSettings.sendingChanges: boolean`: true while turning Offline Mode off waits on the flush.
  - `ONLINE_PATH_AVAILABLE` and the `data-available` attribute are removed. `notImplementedOnline` stays for `useRecentlyDeleted`'s restore until Spec 4.

- [ ] **Step 1: Commit the inactive E2E scenario and the updated default-state test**

In `e2e/settings.e2e.spec.ts`, retitle the first test to `'a user sees Offline Mode on by default'` and replace its `data-available` assertion with:

```ts
await expect(offlineMode).not.toHaveAttribute('data-available');
```

Add (with `import { createTask } from './helpers/selection';` and `import { expectServerTaskVisible } from './helpers/multi-device';`):

```ts
test.skip('a change that could not be sent yet reaches the server when the user turns Offline Mode off', async ({
  page,
}) => {
  const title = `sent on switching off ${Date.now()}`;
  await page.goto('/');
  await page.route('**/tasks', (route) => (route.request().method() === 'POST' ? route.abort() : route.fallback()));
  await createTask(page, title);
  await page.unroute('**/tasks');

  // Navigate inside the app: a page load would wake a replay of its own.
  await page.getByRole('button', { name: 'Open PSYKL navigation' }).click();
  await page.getByRole('navigation', { name: 'PSYKL navigation' }).getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Offline Mode' }).click();

  await expect(page.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false');
  await expectServerTaskVisible('local', title);
});
```

Commit: `test: describe sending waiting changes on switching Offline Mode off as an inactive end-to-end scenario`

- [ ] **Step 2: Write the failing flush tests**

Create `components/web_client/tests/integration/flush-sync-queue.integration.test.ts`:

```ts
import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { listSyncQueue } from '../../src/db/idb';
import { flushSyncQueue } from '../../src/services/flush-sync-queue';
import { enqueue } from '../../src/sync/replay';
import { server } from '../../src/test/setup';

const taskId = '0199eeee-0000-7000-8000-000000000001';

afterEach(async () => {
  await deleteDB('psykl');
});

describe('flushSyncQueue', () => {
  it('sends a queued write that is still waiting out its retry delay', async () => {
    // Given — enqueued "in the future", so an ordinary replay would skip it
    let sentTitle = '';
    server.use(
      http.post('*/tasks', async ({ request }) => {
        const body = (await request.json()) as { id: string; title: string; updated_at: string };
        sentTitle = body.title;
        return HttpResponse.json(
          {
            completed_at: null,
            created_at: body.updated_at,
            deleted_at: null,
            id: body.id,
            list_id: null,
            server_updated_at: body.updated_at,
            title: body.title,
            updated_at: body.updated_at,
            user_id: 'local',
          },
          { status: 201 },
        );
      }),
    );
    await enqueue(
      {
        body: { id: taskId, title: 'waiting', updated_at: '2026-11-14T10:00:00.000Z' },
        entityId: taskId,
        entityType: 'task',
        op: 'create',
      },
      { now: () => new Date(Date.now() + 60_000) },
    );

    // When
    await flushSyncQueue();

    // Then
    expect(sentTitle).toBe('waiting');
    expect(await listSyncQueue()).toEqual([]);
  });

  it('keeps the write queued when the server cannot be reached', async () => {
    // Given
    server.use(http.post('*/tasks', () => HttpResponse.error()));
    await enqueue({
      body: { id: taskId, title: 'stuck', updated_at: '2026-11-14T10:00:00.000Z' },
      entityId: taskId,
      entityType: 'task',
      op: 'create',
    });

    // When
    await flushSyncQueue();

    // Then
    expect((await listSyncQueue()).map((entry) => entry.entity_id)).toEqual([taskId]);
  });
});
```

Create `components/web_client/src/services/__tests__/flush-sync-queue.unit.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockReplay } = vi.hoisted(() => ({ mockReplay: vi.fn() }));
vi.mock('../../sync/replay', () => ({ replay: mockReplay }));

import { FLUSH_TIMEOUT_MS, flushSyncQueue } from '../flush-sync-queue';

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('flushSyncQueue', () => {
  it('replays every queued write, ignoring retry delays', async () => {
    // Given
    mockReplay.mockResolvedValue({ failed: 0, replayed: 1, retried: 0 });

    // When
    await flushSyncQueue();

    // Then
    expect(mockReplay).toHaveBeenCalledWith({ ignoreBackoff: true });
  });

  it('gives up waiting after 5 seconds', async () => {
    // Given
    vi.useFakeTimers();
    mockReplay.mockReturnValue(new Promise(() => {}));
    let settled = false;

    // When
    void flushSyncQueue().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(FLUSH_TIMEOUT_MS);

    // Then
    expect(FLUSH_TIMEOUT_MS).toBe(5_000);
    expect(settled).toBe(true);
  });

  it('resolves even when the replay throws', async () => {
    // Given
    mockReplay.mockRejectedValue(new Error('IndexedDB unavailable'));

    // When / Then
    await expect(flushSyncQueue()).resolves.toBeUndefined();
  });
});
```

Run: `pnpm --filter @psykl/web-client exec vitest run flush-sync-queue`
Expected: FAIL: cannot resolve `../flush-sync-queue`.

- [ ] **Step 3: Implement the flush**

In `components/web_client/src/sync/replay.ts`, add to `ReplayOptions`:

```ts
  /** Treat every queued entry as due, whatever its retry delay — for a flush
   * that must send what it can before the app stops reading the queue. */
  ignoreBackoff?: boolean;
```

and make `dueEntries` honour it:

```ts
async function dueEntries(options: ReplayOptions): Promise<SyncQueueEntry[]> {
  const queue = await listSyncQueue(options.db);
  if (options.ignoreBackoff) {
    return queue;
  }
  const now = options.now?.() ?? new Date();
  return queue.filter((entry) => Date.parse(entry.next_attempt_at) <= now.getTime());
}
```

Create `components/web_client/src/services/flush-sync-queue.ts`:

```ts
import { replay } from '../sync/replay';

const FLUSH_TIMEOUT_MS = 5_000;

/**
 * Sends every write waiting in the sync queue before Offline Mode turns off
 * (online-offline-modes DESIGN.md Decision 11), waiting at most `timeoutMs`.
 * It never rejects: whatever is not sent stays queued and goes out the next
 * time Offline Mode is on. Lives in `services/` so Settings never imports
 * `sync/` (Premise 3). A replay still running at the timeout carries on in the
 * background and releases its lock when it ends.
 */
async function flushSyncQueue(timeoutMs = FLUSH_TIMEOUT_MS): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  const flushed = replay({ ignoreBackoff: true }).then(
    () => undefined,
    (error: unknown) => {
      console.warn('Could not send waiting changes before turning Offline Mode off', error);
    },
  );
  try {
    await Promise.race([flushed, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export { FLUSH_TIMEOUT_MS, flushSyncQueue };
```

Run: `pnpm --filter @psykl/web-client exec vitest run flush-sync-queue && pnpm --filter @psykl/web-client test:integration`
Expected: PASS, 3/3 unit and 2/2 new integration; existing replay integration tests still pass.

Commit: `feat: send every waiting change, retry delays aside, before Offline Mode turns off`

- [ ] **Step 4: Write the failing Settings tests**

In `components/web_client/src/components/SettingsView/__tests__/SettingsView.offline-mode.unit.test.tsx`:

- Delete `'marks the switch as not yet functional while the online path is stubbed'`.
- In `'turns Offline Mode off and remembers it'` and `'keeps keyboard focus on the switch after the remount'`, wait for the switch: replace each `const offlineMode = screen.getByRole(...)` / `expect(screen.getByRole(...))` after the action with `await waitFor(() => expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false'));` followed by the existing assertions.
- Add, with `vi` and `waitFor` imported and the mock at the top of the file:

```tsx
const { mockFlushSyncQueue } = vi.hoisted(() => ({ mockFlushSyncQueue: vi.fn(() => Promise.resolve()) }));
vi.mock('../../../services/flush-sync-queue', () => ({ flushSyncQueue: mockFlushSyncQueue }));
```

```tsx
it('shows the switch as available, with no not-yet-available marker', () => {
  // Arrange
  renderSettings();

  // Assert
  expect(screen.getByRole('switch', { name: 'Offline Mode' })).not.toHaveAttribute('data-available');
});

it('disables the switch while changes are being sent', async () => {
  // Arrange
  let finish: () => void = () => {};
  mockFlushSyncQueue.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
  const user = userEvent.setup();
  renderSettings();

  // Act
  await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

  // Assert — sending
  const sending = screen.getByRole('switch', { name: 'Offline Mode' });
  expect(sending).toBeDisabled();
  expect(sending).toHaveAttribute('aria-busy', 'true');
  expect(sending).toHaveAttribute('aria-checked', 'false');
  expect(screen.getByText('Sending changes made on this device…')).toBeInTheDocument();
  expect(readOfflineMode()).toBe(true);

  // Act — the flush ends
  finish();

  // Assert — switched
  await waitFor(() => expect(readOfflineMode()).toBe(false));
  expect(screen.getByRole('switch', { name: 'Offline Mode' })).toBeEnabled();
  expect(screen.getByText('Keep a copy on this device and sync when online.')).toBeInTheDocument();
});

it('turns Offline Mode on without sending anything first', async () => {
  // Arrange
  writeOfflineMode(false);
  const user = userEvent.setup();
  renderSettings();

  // Act
  await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

  // Assert
  await waitFor(() => expect(readOfflineMode()).toBe(true));
  expect(mockFlushSyncQueue).not.toHaveBeenCalled();
});
```

Import `writeOfflineMode` beside `readOfflineMode`, and add `vi.clearAllMocks()` to the `afterEach`.

In `components/web_client/src/components/SettingsProvider/__tests__/SettingsProvider.unit.test.tsx`, add the same `vi.mock` of `flush-sync-queue` and:

```tsx
it('switches off even when the flush fails', async () => {
  // Arrange — flushSyncQueue never rejects, so a failed flush resolves
  mockFlushSyncQueue.mockResolvedValueOnce(undefined);
  let settings: UserSettings | undefined;
  function Capture() {
    settings = useUserSettings();
    return null;
  }
  render(
    <SettingsProvider>
      <Capture />
    </SettingsProvider>,
  );

  // Act
  act(() => settings!.setOfflineMode(false));

  // Assert
  await waitFor(() => expect(settings!.offlineMode).toBe(false));
  expect(mockFlushSyncQueue).toHaveBeenCalledTimes(1);
});
```

Turning off now waits on the flush, so the existing switch-off tests become asynchronous. In `'persists a change and remounts its children so every hook picks the new path'`, replace `act(() => setOfflineMode(false));` with `await act(async () => setOfflineMode(false));` and the first assertion with `expect(await screen.findByText('offline-mode-off')).toBeInTheDocument();`, making the test `async`. Update DevTask 8's `'starts each Offline Mode off session from an empty cache'` to wait between the two switches: `await act(async () => settings!.setOfflineMode(true)); await act(async () => settings!.setOfflineMode(false));`.

In `SettingsView.stories.tsx`, rename `OfflineModeNotYetAvailable` to `OfflineModeAvailable`, change its doc comment to `/** Offline Mode is on by default and available (Spec 3). */`, and replace its `data-available` assertion with `await expect(offlineMode).not.toHaveAttribute('data-available');`. Add:

```tsx
/** While turning Offline Mode off waits on changes still being sent. */
export const SendingChanges: Story = {
  decorators: [
    (StoryComponent) => (
      <UserSettingsContext.Provider value={{ offlineMode: true, sendingChanges: true, setOfflineMode: () => {} }}>
        <StoryComponent />
      </UserSettingsContext.Provider>
    ),
  ],
  play: async ({ canvasElement }) => {
    // Assert
    const canvas = within(canvasElement);
    const offlineMode = canvas.getByRole('switch', { name: 'Offline Mode' });
    await expect(offlineMode).toBeDisabled();
    await expect(offlineMode).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByText('Sending changes made on this device…')).toBeVisible();
  },
};
```

with `import { UserSettingsContext } from '../../../hooks/useUserSettings';`.

Run: `pnpm --filter @psykl/web-client exec vitest run src/components/SettingsView src/components/SettingsProvider`
Expected: FAIL: `data-available` is still present; no disabled or busy state; `flushSyncQueue` never called.

- [ ] **Step 5: Implement the switch-off flush and the available switch**

`components/web_client/src/hooks/useUserSettings.ts`: add `sendingChanges: boolean;` to `UserSettings` with the doc comment `/** True while turning Offline Mode off waits for this device's unsent changes (Decision 11). */`, and `sendingChanges: false` to the context default.

`components/web_client/src/components/SettingsProvider/SettingsProvider.tsx`:

```tsx
import { flushSyncQueue } from '../../services/flush-sync-queue';
```

```tsx
const [sendingChanges, setSendingChanges] = useState(false);

const setOfflineMode = useCallback((next: boolean) => {
  void (async () => {
    // Turning off: send what this device still owes the server first, for
    // at most 5 seconds. The switch proceeds either way (Decision 11).
    if (!next) {
      setSendingChanges(true);
      await flushSyncQueue();
      setSendingChanges(false);
    }
    writeOfflineMode(next);
    setOfflineModeState(next);
  })();
}, []);

const settings = useMemo<UserSettings>(
  () => ({ offlineMode, sendingChanges, setOfflineMode }),
  [offlineMode, sendingChanges, setOfflineMode],
);
```

`components/web_client/src/components/SettingsView/SettingsView.tsx`: drop the `ONLINE_PATH_AVAILABLE` import; read `sendingChanges` from `useUserSettings()`; on the switch replace `aria-checked` and `data-available` with:

```tsx
            aria-busy={sendingChanges || undefined}
            aria-checked={sendingChanges ? false : offlineMode}
            disabled={sendingChanges}
```

and the description with:

```tsx
<p>{sendingChanges ? 'Sending changes made on this device…' : 'Keep a copy on this device and sync when online.'}</p>
```

`components/web_client/src/components/SettingsView/settings-view.css`: delete the `data-available='false'` rule and its comment; add:

```css
.psykl-settings__switch:disabled {
  opacity: 0.6;
}
```

`components/web_client/src/hooks/online-path.stub.ts`: delete `ONLINE_PATH_AVAILABLE` and its comment; change the file comment to: "`useRecentlyDeleted`'s restore rejects through here with Offline Mode off until online-offline-modes Spec 4 makes Recently Deleted work on both paths, then this file is deleted." Update its export list.

Run: `pnpm --filter @psykl/web-client exec vitest run src/components src/hooks && pnpm --filter @psykl/web-client test:component`
Expected: PASS, including both new stories.

Commit: `feat: send waiting changes when Offline Mode turns off, and show the switch as available`

- [ ] **Step 6: Activate the E2E scenario**

Remove the `.skip`.

Run (with `dangerouslyDisableSandbox`): `./scripts/e2e-up.sh && pnpm test:e2e`, then the compose `down -v`.
Expected: the full suite passes, including `settings` and `online_mode`.

Commit: `test: activate sending waiting changes on switching Offline Mode off`

- [ ] **Step 7: Spec close-out (final DevTask)**

Per `docs/workflows/production-dev-workflow.md` → Spec close-out completeness checklist:

- Create `docs/features/[20261114]GH144_online-only-lists-tasks.md` from `docs/templates/FEATURE.md`; carry the visual artifact, updated to what was built, into `## Visual Record`.
- `docs/ARCHITECTURE.md`: add **ADR-OOM-004 — The online path reads through TanStack Query and writes without optimism**, before ADR-OOM-003, recording S3-1, S3-2 and S3-5.
- `docs/STACK.md`: add `@tanstack/react-query` 5 to the `web_client` row.
- `CHANGELOG.md` Unreleased: one entry, "Offline Mode can be turned off", linking #144, the three DevTask PRs and the feature doc.
- `docs/PROJECT_STATUS.md`: last completed spec = Spec 3 (Spec PR awaiting review); current execution N/A; next = Spec 4 `online-only-surfaces`.
- `docs/initiatives/online-offline-modes/MILESTONE.md`: "Spec 3 done; Spec 4 next".
- `git rm` this spec doc and its visual artifact; `grep -rn "20261114-Spec3" docs README.md AGENTS.md` shows only the feature doc.
- The Spec PR body says `Closes #144`.

Commit: `feat: close out working with Offline Mode off`, with the doc updates as body bullets.

---

## Verification (manual)

1. `git pull && pnpm install && pnpm verify:prepare`
2. `docker compose up --build`
3. Open `http://localhost:5173/settings`: the switch is on, in the accent color.
4. Add a task on the "Tasks" list. In DevTools → Network, set **Offline**, add a second task, then set **No throttling**.
5. Turn Offline Mode off: "Sending changes made on this device…" shows briefly, then the switch is off.
6. `curl -s localhost:3000/tasks -H 'X-User-Id: local'` lists both tasks.
7. Add, rename, re-order and delete a list; complete and delete a task. Each change shows after the server answers, and survives a reload.
8. `pnpm test:e2e -- online_mode settings`

---

## Decisions made during spec drafting

- **S3-1 — One `QueryClient` per Offline Mode off session**, created in `SettingsProvider` inside the keyed subtree. The remount (Decision 3) drops it, so turning the mode off again starts from the server, not a stale cache.
- **S3-2 — No optimistic writes on the API path.** A change shows once the server has answered, and the cache is updated from the server's response, not refetched. The API path exists to show what the server says (Problem Statement), so a change the server refused never appears. Cost: each change shows after one round trip.
- **S3-3 — `moveList` computes the key between its two neighbours** with `generateKeyBetween`, without respacing. Decision 10 forbids a client position on create only; a move cannot be expressed without one. Neighbours out of order make the move reject (Review Focus 3).
- **S3-4 — A list-less capture lands in Tasks by `DEFAULT_LIST_ID`**, and tasks with `list_id: null` show under Tasks, mirroring the sync path's rule without reading IndexedDB.
- **S3-5 — Decision 11's flush-failure behaviour is confirmed as assumed**, with a 5-second cap. Turning off runs `replay({ ignoreBackoff: true })`; whatever is not sent in 5 seconds stays queued for the next time Offline Mode is on. `ignoreBackoff` is needed because a write that failed recently waits out a retry delay, and an ordinary replay would skip it.
- **S3-6 — While sending, the switch shows its new position, is disabled and `aria-busy`, and the description reads "Sending changes made on this device…".** Turning on sends nothing and flips at once.
- **S3-7 — `online-path.stub.ts` keeps `notImplementedOnline`** for `useRecentlyDeleted`'s restore, which Spec 4 owns; only `ONLINE_PATH_AVAILABLE` goes.
- **Query retries:** reads retry once in the app (`retry: 1`), never in tests. Writes are never retried by TanStack Query; each write already carries a fresh idempotency key from the shim.

## Open Questions / Risks

- **Page sync triggers still replay with Offline Mode off.** `registerPageSyncTriggers` wakes `replay()` on `online` and on the page becoming visible, so a write left queued by a failed flush may still be sent while off, against Decision 11's "the next time Offline Mode is on". Spec 4 makes the triggers idle on the API path ("page sync triggers idle in the API path").
- **The active list still lives in IndexedDB** (`sync_meta.active_list_id`, read by `useActiveList`). Offline Mode off works in every browser with IndexedDB; a browser without it is Spec 4's (Decision 13 and "without IDB").
- **Other tabs and devices** show on the API path when the window regains focus (TanStack Query's default refetch), not instantly.
- **Recently Deleted's restore still refuses** with Offline Mode off until Spec 4.

## Affected by / Depends on

- Spec 2 `server-positions-default-list` (merged, #150): optional `position` on list create, the server-kept default list, the `409` on deleting it.
- Spec 1 `data-mode-seam` (merged, #149): the seam, `SettingsProvider`, and the Service Client shims.
