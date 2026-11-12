---
status: IN-PROGRESS # DevTask 1 landed on the Spec branch as the operator-requested architecture sandbox
issue: GH144
pr:
completed_at:
created_at: 2026-11-11
initiative: online-offline-modes
spec_number: 1
devtasks_total: 4
devtasks_complete: 1
honors_decisions:
  - 1
  - 3
  - 5
  - 6
  - 7
  - 8
  - 12
  - 14
---

# Data-Mode Seam — Implementation Spec

> Written by `superpowers:writing-plans` (2026-11-11) from the APPROVED [`online-offline-modes/DESIGN.md`](../../initiatives/online-offline-modes/DESIGN.md).
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan DevTask by DevTask. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-11-11
**Initiative:** `online-offline-modes`
**Spec:** 1/5
**Spec User Story:** _As a PWA developer, I can switch the app between the IndexedDB sync path and an online-only path from Settings, so that I can compare local data against the server's canonical data — with the online path stubbed until Spec 3._
**Status:** see frontmatter
**Time-box:** 1 day
**Reads from:** `docs/initiatives/online-offline-modes/DESIGN.md` Decisions appendix (LOCKED — do not re-open).

**Goal:** Every `use{Entity}()` hook picks its data path from one Settings value, every path-agnostic caller gets its Service Client by injection, and Settings shows an Offline Mode switch colored as not yet functional.

**Architecture:** `SettingsProvider` owns Offline Mode (stored in `localStorage`), builds one stateless `{entity}ServiceClient` shim per entity for that mode, and remounts its children when the mode changes. `useLists`/`useTasks` branch to `use{Entity}SyncClient` (today's code) or `use{Entity}ApiClient` (stub). The sync path's module-level store, which runs outside React, keeps a private sync-configured shim until Spec 5 retires it.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library + fake-indexeddb, Storybook 8 play functions, Playwright.

## Global Constraints

- Offline Mode key: `psykl:offline-mode` in `localStorage`; only the exact string `false` turns it off; default on (Decision 5).
- Changing Offline Mode remounts the tree under `SettingsProvider` (Decision 3).
- No component imports `sync/`, TanStack, or a Service Client module directly as part of this Spec's new code (Decisions 1, 6).
- `Use{Entity}Result` types stay unchanged (Decision 14).
- `useLists.positions` and `useLists.default-list` are not modified beyond their existing Decision 7 comments; online stubs must not import them.
- Test floor during DevTasks 2-3 (operator override, 2026-10-11): Static Analysis + Unit + Integration only. Component (Storybook) and E2E tests wait for DevTask 4, after the operator approves the UX on a local deployment.
- ≤10 production behavior source files per DevTask PR.

## Review Focus

Failure modes the design implies but no feature test exercises, most likely first. Each has a test in the owning DevTask.

1. **`localStorage` throws on read** (Safari private mode, blocked site data) → Offline Mode reads as on; the app starts on the sync path. _Test: DevTask 3, `offlineMode.unit.test.ts`._
2. **`localStorage` throws on write** → the switch still flips for this session and nothing throws. _Test: DevTask 3, `offlineMode.unit.test.ts`._
3. **A stored value other than `true`/`false`** (`"off"`, `"0"`, hand-edited) → reads as on. _Test: DevTask 3, `offlineMode.unit.test.ts`._
4. **Switching mode while a hook holds the old shim** → after the switch, `useServiceClients()` returns a shim built for the new mode, never the old one. _Test: DevTask 2, `useServiceClients.unit.test.tsx`._
5. **A write on the stubbed online path** (a user captures a task with Offline Mode off) → the call rejects with a named error rather than resolving silently or writing to IDB. _Test: DevTask 2, `online-path.stub.unit.test.ts`._

---

## Overview

Spec 1 delivers the seam the rest of the initiative builds on, inside `components/web_client` only. DevTask 1 (already on the Spec branch) split `useLists`/`useTasks` into a seam plus `.sync.ts` and `.api.ts` implementations and added `SettingsProvider`. DevTask 2 replaces the module-level `listServiceClient`/`taskServiceClient` singletons with a factory and React-context injection (Decision 6). DevTask 3 adds the visible Offline Mode switch (Decision 12). DevTask 4 adds the Component and E2E tests after UX approval and closes the Spec out.

> Vocabulary reminder: `DevTask` is the workflow unit (one PR). `Task` is the PSYKL data entity.

## Data Model

No schema changes. One new `localStorage` key, `psykl:offline-mode` (`"true"` | `"false"`).

## API

No API surface.

## Visual Artifact

[`20261111-Spec1-data-mode-seam-visual-artifact.md`](20261111-Spec1-data-mode-seam-visual-artifact.md) — the new Settings `Data` section and its states.

## Implementation Components

### `components/web_client/`

| File                                                                  | DevTask | Responsibility                                                        |
| --------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| `src/hooks/useLists.ts`, `useTasks.ts`                                | 1 ✅    | Result types + seam                                                   |
| `src/hooks/useLists.sync.ts`, `useTasks.sync.ts`                      | 1 ✅, 2 | Sync implementation; module store keeps a private sync shim (S1-1)    |
| `src/hooks/useLists.api.ts`, `useTasks.api.ts`, `online-path.stub.ts` | 1 ✅, 3 | Online stubs; `ONLINE_PATH_AVAILABLE` flag                            |
| `src/hooks/useUserSettings.ts`                                        | 1 ✅    | Settings context                                                      |
| `src/preferences/offlineMode.ts`                                      | 1 ✅    | `localStorage` read/write                                             |
| `src/components/SettingsProvider/`                                    | 1 ✅, 2 | Mode state, remount key, Service Client shims                         |
| `src/Root.tsx`                                                        | 1 ✅    | Mounts `SettingsProvider` around `<App />`                            |
| `src/services/service-client.ts`                                      | 2       | `ServiceClientConfig` no longer a union                               |
| `src/services/list-service-client.ts`, `task-service-client.ts`       | 2       | `create{Entity}ServiceClient(offlineCapable)` factory; no static shim |
| `src/hooks/useServiceClients.ts`                                      | 2       | Service Client context + hook                                         |
| `src/hooks/useRecentlyDeleted.ts`                                     | 2       | Shims from context                                                    |
| `src/components/TaskList/usePendingTaskIds.ts`                        | 2       | Shim from context                                                     |
| `src/components/SettingsView/SettingsView.tsx`, `settings-view.css`   | 3       | Offline Mode switch                                                   |

## Test Plan

### Static Analysis

No new rules. New files join the existing `tsc -b` graph. Run `pnpm lint && pnpm typecheck && pnpm format:check` in `components/web_client` at every Step.

### Unit tests

| File                                                                                          | What it asserts                                                                             |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/hooks/__tests__/useLists.mode.unit.test.tsx` ✅                                          | Seam picks sync with no provider / mode on, api with mode off                               |
| `src/hooks/__tests__/useTasks.mode.unit.test.tsx` ✅                                          | Same, for tasks                                                                             |
| `src/components/SettingsProvider/__tests__/SettingsProvider.unit.test.tsx` ✅                 | Default on, reads stored mode, persists change and remounts children                        |
| `src/services/__tests__/service-client.unit.test.ts`                                          | Updated: `offlineCapable: false` never touches the sync client                              |
| `src/services/__tests__/list-service-client.unit.test.ts`, `task-service-client.unit.test.ts` | Factory `true` queues to IDB; factory `false` reads the server and writes nothing to IDB    |
| `src/hooks/__tests__/useServiceClients.unit.test.tsx`                                         | Default is sync; provider builds per-mode shims; a switch yields new shims (Review Focus 4) |
| `src/hooks/__tests__/online-path.stub.unit.test.ts`                                           | Stub writes reject with the named error (Review Focus 5)                                    |
| `src/__tests__/App.offline-mode.unit.test.tsx`                                                | The full app renders its empty state with Offline Mode off                                  |
| `src/preferences/__tests__/offlineMode.unit.test.ts`                                          | Review Focus 1-3                                                                            |
| `src/components/SettingsView/__tests__/SettingsView.offline-mode.unit.test.tsx`               | Switch on by default, flips and persists, marked unavailable                                |
| `src/components/TaskList/__tests__/TaskList.pending.unit.test.tsx`                            | Updated mock: `useServiceClients` instead of `task-service-client`                          |

### Integration tests

None new. Existing `pnpm test:integration` must stay green.

### Component tests (DevTask 4, after UX approval)

| File                                                                                            | What it asserts                                       |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/components/SettingsView/__tests__/SettingsView.stories.tsx` → `OfflineModeNotYetAvailable` | Switch on, muted, flips off inside `SettingsProvider` |

### End-to-End tests (DevTask 4, after UX approval)

| File                       | What it asserts                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/settings.e2e.spec.ts` | "a user sees Offline Mode on by default and marked not yet available"; "a user who turns Offline Mode off keeps that choice after reloading" |

### TDD order

1. DevTask 2: Service Client tests → factory → `useServiceClients` tests → context → consumer migration.
2. DevTask 3: `offlineMode` edge tests → SettingsView switch tests → switch.
3. DevTask 4: Storybook play function → E2E (both written after UX approval, against built behavior).

---

## DevTasks

The Spec integration branch is **`feat/144-web-app-api-store`** (operator decision, 2026-10-11 — it replaces the conventional `spec/online-offline-modes-s1-data-mode-seam` name). Each DevTask from 2 on branches off it and opens its PR against it. Rebase onto `origin/feat/144-web-app-api-store` before opening any PR, and push only with an explicit refspec (`git push -u origin HEAD:<branch>`).

### DevTask 1: Seam, settings, and online stubs ✅

**Files:** 12 production behavior source files (over the ≤10 limit — see Open Questions)
**Branch:** landed directly on `feat/144-web-app-api-store` as the operator-requested architecture sandbox (commits `48f3de3`, `d17104a`, `734da5d`)
**PR:** none — reviewed in the Spec PR
**Affected:** `src/hooks/{useLists,useLists.sync,useLists.api,useTasks,useTasks.sync,useTasks.api,online-path.stub,useUserSettings}.ts`, `src/preferences/offlineMode.ts`, `src/components/SettingsProvider/{SettingsProvider.tsx,index.ts}`, `src/Root.tsx`, plus 3 unit test files

- [x] Step 1: Failing seam + provider tests
- [x] Step 2: Seam, `SettingsProvider`, `useUserSettings`, `offlineMode`, stubs; unit + integration green
- [x] Step 3: Decision 7 smell comments in `useLists.positions.ts` / `useLists.default-list.ts`

### DevTask 2: Inject Service Client shims ✅

**Files:** 9 production behavior source files
**Branch:** `feat/online-offline-modes-s1-dt2-service-client-injection`
**PR:** _filled once opened_
**Affected:**

- Modify: `src/services/service-client.ts`, `src/services/list-service-client.ts`, `src/services/task-service-client.ts`, `src/hooks/useLists.sync.ts`, `src/hooks/useTasks.sync.ts`, `src/hooks/useRecentlyDeleted.ts`, `src/components/TaskList/usePendingTaskIds.ts`, `src/components/SettingsProvider/SettingsProvider.tsx`
- Create: `src/hooks/useServiceClients.ts`
- Tests: `src/services/__tests__/{service-client,list-service-client,task-service-client}.unit.test.ts`, `src/hooks/__tests__/{useServiceClients.unit.test.tsx,online-path.stub.unit.test.ts}`, `src/components/TaskList/__tests__/TaskList.pending.unit.test.tsx`

**Interfaces:**

- Consumes: `UserSettingsContext`, `useUserSettings()` (`src/hooks/useUserSettings.ts`); `notImplementedOnline(operation: string): Promise<never>` (`src/hooks/online-path.stub.ts`).
- Produces:
  - `ServiceClientConfig<TEntity, TInput, TPatchInput, TDeleteInput> = { apiClient; syncClient; offlineCapable: boolean }`
  - `createListServiceClient(offlineCapable: boolean): ListServiceClient`, `type ListServiceClient = ServiceClient<List, ListInput, ListPatchInput, ListDeleteInput>`
  - `createTaskServiceClient(offlineCapable: boolean): TaskServiceClient`, `type TaskServiceClient = ServiceClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput>`
  - `interface ServiceClients { lists: ListServiceClient; tasks: TaskServiceClient }`, `createServiceClients(offlineMode: boolean): ServiceClients`, `ServiceClientsContext`, `useServiceClients(): ServiceClients`
- Removed: `listServiceClient`, `taskServiceClient` exports.

- [x] **Step 1: Make the `offlineCapable: false` tests pass a sync client and prove it is never called**

In `src/services/__tests__/service-client.unit.test.ts`, every `createServiceClient({ apiClient, offlineCapable: false })` becomes:

```ts
const syncClient = fakeSyncClient();
const client = createServiceClient({ apiClient, offlineCapable: false, syncClient });
```

and the first `offlineCapable: false` test gains, under `// Then`:

```ts
expect(syncClient.create).not.toHaveBeenCalled();
expect(syncClient.patch).not.toHaveBeenCalled();
expect(syncClient.delete).not.toHaveBeenCalled();
expect(syncClient.list).not.toHaveBeenCalled();
```

- [x] **Step 2: Rewrite the list wiring tests against the factory**

Replace `src/services/__tests__/list-service-client.unit.test.ts` lines 8 and 19-57 with:

```ts
import { createListServiceClient } from '../list-service-client';

// …existing constants and afterEach unchanged…

describe('createListServiceClient — production wiring', () => {
  it('offlineCapable true: create() writes to IDB + queues, without touching the network', async () => {
    // When
    const result = await createListServiceClient(true).create(
      listId,
      { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
      {
        id: listId,
        user_id: 'local',
        title: 'Groceries',
        position: 'a0',
        created_at: nowIso,
        updated_at: nowIso,
        server_updated_at: nowIso,
        deleted_at: null,
      },
    );

    // Then
    expect(result.title).toBe('Groceries');
    await expect(getList(listId)).resolves.toMatchObject({ title: 'Groceries' });
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'create' }]);
  });

  it('offlineCapable true: list() pulls server-side lists into IDB', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await createListServiceClient(true).list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId, title: 'Groceries' })]));
    await expect(getList(listId)).resolves.toMatchObject({ id: listId, title: 'Groceries' });
  });

  it('offlineCapable false: list() returns server lists and writes nothing to IDB', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await createListServiceClient(false).list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId, title: 'Groceries' })]));
    await expect(getList(listId)).resolves.toBeUndefined();
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
```

Apply the same three tests to `src/services/__tests__/task-service-client.unit.test.ts` using `createTaskServiceClient`, `createTaskRemote`, `getTask`, and that file's existing constants and Task fixture. The third test asserts `getTask(taskId)` resolves `undefined` and the queue is empty.

- [x] **Step 3: Run the service tests — expect failures**

Run: `cd components/web_client && pnpm exec vitest run service-client`
Expected: FAIL — `createListServiceClient` / `createTaskServiceClient` are not exported, and `syncClient` is not part of the `offlineCapable: false` config type.

- [x] **Step 4: Flatten `ServiceClientConfig`**

In `src/services/service-client.ts`, replace the `ServiceClientConfig` union with:

```ts
/**
 * Both inner clients always exist; `offlineCapable` picks which one a call
 * goes to. The shim built from this is stateless — all state lives in the
 * inner clients — so it is rebuilt freely when Offline Mode changes
 * (online-offline-modes DESIGN.md Decision 6).
 */
interface ServiceClientConfig<TEntity, TInput, TPatchInput, TDeleteInput> {
  apiClient: EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput>;
  offlineCapable: boolean;
  syncClient: SyncClient<TEntity, TInput, TPatchInput, TDeleteInput>;
}
```

`createServiceClient`'s body is unchanged.

- [x] **Step 5: Turn the list and task singletons into factories**

`src/services/list-service-client.ts` — replace lines 28-38 with:

```ts
type ListServiceClient = ServiceClient<List, ListInput, ListPatchInput, ListDeleteInput>;

/** The inner clients above are the singletons; this shim is rebuilt per
 * Offline Mode (DESIGN.md Decision 6). */
function createListServiceClient(offlineCapable: boolean): ListServiceClient {
  return createServiceClient({ apiClient: listApiClient, offlineCapable, syncClient: listSyncClient });
}

function resetListServiceClientForTest(): void {
  resetSyncClientHydrationForTest(listSyncClient);
}

export { createListServiceClient, resetListServiceClientForTest };
export type { ListServiceClient };
```

and change line 11 to `import { createServiceClient, type EntityApiClient, type ServiceClient } from './service-client';`.

`src/services/task-service-client.ts` — the same, replacing lines 28-38:

```ts
type TaskServiceClient = ServiceClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput>;

/** The inner clients above are the singletons; this shim is rebuilt per
 * Offline Mode (DESIGN.md Decision 6). */
function createTaskServiceClient(offlineCapable: boolean): TaskServiceClient {
  return createServiceClient({ apiClient: taskApiClient, offlineCapable, syncClient: taskSyncClient });
}

function resetTaskServiceClientForTest(): void {
  resetSyncClientHydrationForTest(taskSyncClient);
}

export { createTaskServiceClient, resetTaskServiceClientForTest };
export type { TaskServiceClient };
```

with the same `ServiceClient` type import.

- [x] **Step 6: Give the sync path's module store its private sync shim (S1-1)**

`src/hooks/useLists.sync.ts` — change the service-client import to `import { createListServiceClient, resetListServiceClientForTest } from '../services/list-service-client';` and add below the imports:

```ts
// Decision 6 exception (Spec 1 decision S1-1): this module's snapshot store
// runs outside React — page sync triggers and the BroadcastChannel reload it —
// so it cannot read the injected shim. It is sync-path only, so it builds the
// offline-capable shim itself and can never reach the API path by mistake.
// Retired with the store in Spec 5 (Decisions 8-9).
const listServiceClient = createListServiceClient(true);
```

`src/hooks/useTasks.sync.ts` — the same, with `createTaskServiceClient` / `taskServiceClient`.

- [x] **Step 7: Run the service tests — expect green**

Run: `cd components/web_client && pnpm exec vitest run service-client && pnpm typecheck`
Expected: service tests PASS. `typecheck` FAILS only in `useRecentlyDeleted.ts` and `usePendingTaskIds.ts` (removed exports) — fixed in Step 11.

- [x] **Step 8: Commit**

```bash
git add components/web_client/src/services components/web_client/src/hooks/useLists.sync.ts components/web_client/src/hooks/useTasks.sync.ts
git commit -m "feat: build Service Client shims from a per-mode factory"
```

(`pnpm typecheck` runs in the pre-commit hook; if it blocks on the two consumers, fold this commit into Step 13's. It did: one commit.)

- [x] **Step 9: Write the failing context + stub tests**

Create `src/hooks/__tests__/useServiceClients.unit.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsProvider } from '../../components/SettingsProvider';
import { writeOfflineMode } from '../../preferences/offlineMode';
import { useServiceClients } from '../useServiceClients';
import { useUserSettings } from '../useUserSettings';

vi.mock('../../services/list-service-client', () => ({
  createListServiceClient: (offlineCapable: boolean) => ({ entity: 'list', offlineCapable }),
}));
vi.mock('../../services/task-service-client', () => ({
  createTaskServiceClient: (offlineCapable: boolean) => ({ entity: 'task', offlineCapable }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

afterEach(() => {
  localStorage.clear();
});

describe('useServiceClients', () => {
  it('gives the sync-path shims when no provider is mounted', () => {
    // Act
    const { result } = renderHook(() => useServiceClients());

    // Assert
    expect(result.current.lists).toEqual({ entity: 'list', offlineCapable: true });
    expect(result.current.tasks).toEqual({ entity: 'task', offlineCapable: true });
  });

  it('gives api-path shims when Offline Mode is off', () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    const { result } = renderHook(() => useServiceClients(), { wrapper });

    // Assert
    expect(result.current.lists).toEqual({ entity: 'list', offlineCapable: false });
    expect(result.current.tasks).toEqual({ entity: 'task', offlineCapable: false });
  });

  it('hands out shims for the new mode after a switch, never the old ones', () => {
    // Arrange
    const { result } = renderHook(() => ({ clients: useServiceClients(), settings: useUserSettings() }), { wrapper });
    const before = result.current.clients.lists;

    // Act
    act(() => result.current.settings.setOfflineMode(false));

    // Assert
    expect(result.current.clients.lists).not.toBe(before);
    expect(result.current.clients.lists).toEqual({ entity: 'list', offlineCapable: false });
  });
});
```

Create `src/hooks/__tests__/online-path.stub.unit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { useListsApiClient } from '../useLists.api';
import { useTasksApiClient } from '../useTasks.api';

describe('online path stubs', () => {
  it('refuses a task capture with a named error instead of dropping it silently', async () => {
    // When / Then
    await expect(useTasksApiClient().createTask('Buy milk')).rejects.toMatchObject({
      message: 'createTask is not available with Offline Mode off yet',
    });
  });

  it('refuses a list rename with a named error', async () => {
    // When / Then
    await expect(useListsApiClient().renameList('any-id', 'Groceries')).rejects.toMatchObject({
      message: 'renameList is not available with Offline Mode off yet',
    });
  });
});
```

(The stubs call no React hooks, so calling them directly is safe. `rejects.toThrow('<message>')` fails in this jsdom setup even for a bare `Promise.reject(new Error())`, so these use the repo's `rejects.toMatchObject({ message })` form, as `src/api/__tests__/version.unit.test.ts` does.)

Create `src/__tests__/App.offline-mode.unit.test.tsx` — the whole app must still render on the stubbed path, with no lists at all (verified to pass against DevTask 1 while drafting this plan; it pins that behaviour):

```tsx
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import App from '../App';
import { SettingsProvider } from '../components/SettingsProvider';
import { resetUseListsForTest } from '../hooks/useLists';
import { resetUseTasksForTest } from '../hooks/useTasks';
import { writeOfflineMode } from '../preferences/offlineMode';

afterEach(async () => {
  localStorage.clear();
  resetUseTasksForTest();
  resetUseListsForTest();
  await deleteDB('psykl');
});

describe('App with Offline Mode off', () => {
  it('renders the shell and an empty list instead of crashing on the stubbed path', async () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Open PSYKL navigation' })).toBeInTheDocument();
    expect(await screen.findByText(/nothing to do yet/i)).toBeInTheDocument();
  });
});
```

- [x] **Step 10: Run them — expect failure**

Run: `cd components/web_client && pnpm exec vitest run useServiceClients online-path.stub App.offline-mode`
Expected: `useServiceClients` FAILS ("Failed to resolve import ../useServiceClients"); the stub and `App.offline-mode` tests PASS already (they pin existing behaviour).

- [x] **Step 11: Add the context and migrate the consumers**

Create `src/hooks/useServiceClients.ts`:

```ts
import { createContext, useContext } from 'react';

import { createListServiceClient, type ListServiceClient } from '../services/list-service-client';
import { createTaskServiceClient, type TaskServiceClient } from '../services/task-service-client';

interface ServiceClients {
  lists: ListServiceClient;
  tasks: TaskServiceClient;
}

function createServiceClients(offlineMode: boolean): ServiceClients {
  return { lists: createListServiceClient(offlineMode), tasks: createTaskServiceClient(offlineMode) };
}

/** Trees without a `SettingsProvider` (unit tests, stories) get the sync
 * path, matching `UserSettingsContext`'s default (DESIGN.md Decisions 3, 6). */
const ServiceClientsContext = createContext<ServiceClients>(createServiceClients(true));

function useServiceClients(): ServiceClients {
  return useContext(ServiceClientsContext);
}

export { createServiceClients, ServiceClientsContext, useServiceClients };
export type { ServiceClients };
```

`src/components/SettingsProvider/SettingsProvider.tsx` — import `createServiceClients, ServiceClientsContext` from `../../hooks/useServiceClients`, and replace the return with:

```tsx
const clients = useMemo(() => createServiceClients(offlineMode), [offlineMode]);

return (
  <UserSettingsContext.Provider value={settings}>
    <ServiceClientsContext.Provider value={clients}>
      <Fragment key={offlineMode ? 'offline' : 'online'}>{children}</Fragment>
    </ServiceClientsContext.Provider>
  </UserSettingsContext.Provider>
);
```

and extend its doc comment with: `It also builds the per-mode Service Client shims (Decision 6).`

`src/hooks/useRecentlyDeleted.ts`:

- Delete the `listServiceClient` and `taskServiceClient` imports; add `import { useServiceClients } from './useServiceClients';`.
- First line of `useRecentlyDeleted()`: `const { lists: listServiceClient, tasks: taskServiceClient } = useServiceClients();`
- `reload`'s dependency array `[]` → `[listServiceClient, taskServiceClient]`. `restore` already depends on `reload`.

`src/components/TaskList/usePendingTaskIds.ts`:

- Replace the `task-service-client` import with `import { useServiceClients } from '../../hooks/useServiceClients';`.
- First line of the hook: `const { tasks: taskServiceClient } = useServiceClients();`
- Effect dependencies `[tasks]` → `[tasks, taskServiceClient]`.

`src/components/TaskList/__tests__/TaskList.pending.unit.test.tsx` — replace the `task-service-client` mock with a **stable** object (the hook's effect now depends on the shim's identity; a fresh object per render would re-run the effect on every render and loop):

```ts
const mockServiceClients = vi.hoisted(() => ({ tasks: { listPending: vi.fn() } }));
const mockListPending = mockServiceClients.tasks.listPending;

vi.mock('../../../hooks/useServiceClients', () => ({
  useServiceClients: () => mockServiceClients,
}));
```

and delete the old `const mockListPending = vi.hoisted(() => vi.fn());` line.

- [x] **Step 12: Run everything — expect green**

Run: `cd components/web_client && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test:unit && pnpm test:integration`
Expected: all PASS; unit count = previous + 8 (list +1, task +1, useServiceClients +3, stubs +2, App +1).

- [x] **Step 13: Commit**

```bash
git add components/web_client/src
git commit -m "feat: inject Service Client shims through React context"
```

Then update this doc's DevTask 2 checkboxes, rebase onto `origin/feat/144-web-app-api-store`, and open the PR.

### DevTask 3: Offline Mode switch in Settings

**Files:** 3 production behavior source files
**Branch:** `feat/online-offline-modes-s1-dt3-offline-mode-switch`
**PR:** _filled once opened_
**Affected:**

- Modify: `src/components/SettingsView/SettingsView.tsx`, `src/components/SettingsView/settings-view.css`, `src/hooks/online-path.stub.ts`
- Tests: `src/preferences/__tests__/offlineMode.unit.test.ts`, `src/components/SettingsView/__tests__/SettingsView.offline-mode.unit.test.tsx`

**Interfaces:**

- Consumes: `useUserSettings(): { offlineMode: boolean; setOfflineMode(next: boolean): void }`; `readOfflineMode()`, `writeOfflineMode()`; `SettingsProvider`.
- Produces: `ONLINE_PATH_AVAILABLE: boolean` exported from `src/hooks/online-path.stub.ts` (Spec 3 sets it to `true`, then deletes the file); a `role="switch"` element named "Offline Mode" with `data-available="true" | "false"`.

- [ ] **Step 1: Write the `offlineMode` edge-case tests (Review Focus 1-3)**

Create `src/preferences/__tests__/offlineMode.unit.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readOfflineMode, writeOfflineMode } from '../offlineMode';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('offlineMode preference', () => {
  it('reads as on when storage throws, so the app still starts on the sync path', () => {
    // Given
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    // When / Then
    expect(readOfflineMode()).toBe(true);
  });

  it('swallows a write that storage refuses', () => {
    // Given
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    // When / Then
    expect(() => writeOfflineMode(false)).not.toThrow();
  });

  it.each(['off', '0', 'False', ''])('reads an unrecognised stored value %j as on', (stored) => {
    // Given
    localStorage.setItem('psykl:offline-mode', stored);

    // When / Then
    expect(readOfflineMode()).toBe(true);
  });

  it('reads the exact string "false" as off', () => {
    // Given
    writeOfflineMode(false);

    // When / Then
    expect(readOfflineMode()).toBe(false);
  });
});
```

- [ ] **Step 2: Run it**

Run: `cd components/web_client && pnpm exec vitest run offlineMode.unit`
Expected: PASS (pins DevTask 1 behaviour; no implementation change needed). If any case fails, fix `src/preferences/offlineMode.ts` before continuing.

- [ ] **Step 3: Write the failing switch tests**

Create `src/components/SettingsView/__tests__/SettingsView.offline-mode.unit.test.tsx`:

```tsx
import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { readOfflineMode } from '../../../preferences/offlineMode';
import { SettingsProvider } from '../../SettingsProvider';
import { SettingsView } from '../SettingsView';

function renderSettings() {
  return render(
    <SettingsProvider>
      <SettingsView />
    </SettingsProvider>,
  );
}

afterEach(async () => {
  localStorage.clear();
  await deleteDB('psykl');
});

describe('SettingsView — Offline Mode', () => {
  it('shows Offline Mode on by default', () => {
    // Arrange
    renderSettings();

    // Assert
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Keep a copy on this device and sync when online.')).toBeInTheDocument();
  });

  it('marks the switch as not yet functional while the online path is stubbed', () => {
    // Arrange
    renderSettings();

    // Assert
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('data-available', 'false');
  });

  it('turns Offline Mode off and remembers it', async () => {
    // Arrange
    const user = userEvent.setup();
    renderSettings();

    // Act
    await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

    // Assert — the provider remounts the view, so query again
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false');
    expect(readOfflineMode()).toBe(false);
  });
});
```

- [ ] **Step 4: Run it — expect failure**

Run: `cd components/web_client && pnpm exec vitest run SettingsView.offline-mode`
Expected: FAIL — "Unable to find an accessible element with the role "switch" and name "Offline Mode"".

- [ ] **Step 5: Add the availability flag**

Append to `src/hooks/online-path.stub.ts`, before the export:

```ts
/** Whether the online-only path works yet. Settings colors the Offline Mode
 * switch from this (DESIGN.md Decision 12); Spec 3 sets it to `true` when the
 * API client hooks are real, then deletes this file. */
const ONLINE_PATH_AVAILABLE = false;
```

and change the export to `export { notImplementedOnline, ONLINE_PATH_AVAILABLE };`.

- [ ] **Step 6: Add the switch**

`src/components/SettingsView/SettingsView.tsx` — add imports:

```ts
import { ONLINE_PATH_AVAILABLE } from '../../hooks/online-path.stub';
import { useUserSettings } from '../../hooks/useUserSettings';
```

first line of the component body:

```ts
const { offlineMode, setOfflineMode } = useUserSettings();
```

and insert this section between the Contrast and Experiments sections:

```tsx
<section aria-label="Data" className="psykl-settings__section">
  <h3>Data</h3>
  <div className="psykl-settings__row">
    <span id="psykl-settings-offline-mode">Offline Mode</span>
    <button
      aria-checked={offlineMode}
      aria-labelledby="psykl-settings-offline-mode"
      className="psykl-settings__switch"
      data-available={String(ONLINE_PATH_AVAILABLE)}
      onClick={() => setOfflineMode(!offlineMode)}
      role="switch"
      type="button"
    />
  </div>
  <p>Keep a copy on this device and sync when online.</p>
</section>
```

- [ ] **Step 7: Style the switch**

Append to `src/components/SettingsView/settings-view.css`:

```css
.psykl-settings__row {
  align-items: center;
  color: var(--text-primary);
  display: flex;
  font-size: 17px;
  justify-content: space-between;
  min-height: var(--row-min);
}

.psykl-settings__switch {
  background: var(--bg-pressed);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  flex: none;
  height: 31px;
  padding: 2px;
  width: 51px;
}

.psykl-settings__switch::after {
  background: var(--bg-elevated);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgb(0 0 0 / 18%);
  content: '';
  display: block;
  height: 27px;
  transition: transform 150ms ease;
  width: 27px;
}

.psykl-settings__switch[aria-checked='true'] {
  background: var(--accent);
}

.psykl-settings__switch[aria-checked='true']::after {
  transform: translateX(20px);
}

/* Not yet functional: the online path is stubbed until Spec 3, and color is
   the only signal (online-offline-modes DESIGN.md Decision 12). */
.psykl-settings__switch[data-available='false'],
.psykl-settings__switch[data-available='false'][aria-checked='true'] {
  background: var(--text-tertiary);
}

.psykl-settings__switch:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .psykl-settings__switch::after {
    transition: none;
  }
}
```

- [ ] **Step 8: Run everything — expect green**

Run: `cd components/web_client && pnpm lint && pnpm typecheck && pnpm format:check && pnpm test:unit && pnpm test:integration`
Expected: all PASS, including the existing `SettingsView.unit.test.tsx` (it renders without a provider and does not touch the switch).

- [ ] **Step 9: Commit**

```bash
git add components/web_client/src
git commit -m "feat: show the Offline Mode switch in Settings, marked not yet available"
```

Update this doc's DevTask 3 checkboxes, rebase, open the PR.

- [ ] **Step 10: STOP — operator manual verification**

Operator runs the local deployment (see Verification) and approves or iterates on the UX. DevTask 4 starts only after approval.

### DevTask 4: Component + E2E tests, and Spec close-out (after UX approval)

**Files:** 0 production behavior source files expected (tests and docs only; `e2e/settings.e2e.spec.ts` counts as 1 because it changes E2E expectations)
**Branch:** `feat/online-offline-modes-s1-dt4-tests-and-close-out`
**PR:** _filled once opened_
**Affected:** `src/components/SettingsView/__tests__/SettingsView.stories.tsx`, `e2e/settings.e2e.spec.ts`, `docs/features/[YYYYMMDD]GH144_data-mode-seam.md`, `CHANGELOG.md`, `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, this spec doc and its visual artifact (deleted)

If the operator iterated on the UX in Step 10 of DevTask 3, update the test code below to match the approved behaviour before running it.

- [ ] **Step 1: Add the Storybook story**

Append to `src/components/SettingsView/__tests__/SettingsView.stories.tsx` (add `import { SettingsProvider } from '../../SettingsProvider';`):

```tsx
/** Offline Mode is on by default and visibly not yet functional (Decision 12). */
export const OfflineModeNotYetAvailable: Story = {
  decorators: [
    (StoryComponent) => {
      localStorage.removeItem('psykl:offline-mode');
      return (
        <SettingsProvider>
          <StoryComponent />
        </SettingsProvider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const offlineMode = canvas.getByRole('switch', { name: 'Offline Mode' });
    await expect(offlineMode).toHaveAttribute('aria-checked', 'true');
    await expect(offlineMode).toHaveAttribute('data-available', 'false');

    // Act
    await userEvent.click(offlineMode);

    // Assert — the provider remounts the view, so query again
    await waitFor(() =>
      expect(canvas.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false'),
    );

    // Leave the page as it was found.
    localStorage.removeItem('psykl:offline-mode');
  },
};
```

- [ ] **Step 2: Run the Component layer**

Run: `cd components/web_client && pnpm test:component:stories`
Expected: PASS, including `OfflineModeNotYetAvailable`.

- [ ] **Step 3: Add the E2E tests**

Append inside `test.describe('settings', …)` in `e2e/settings.e2e.spec.ts`:

```ts
test('a user sees Offline Mode on by default and marked not yet available', async ({ page }) => {
  await page.goto('/settings');
  const offlineMode = page.getByRole('switch', { name: 'Offline Mode' });
  await expect(offlineMode).toHaveAttribute('aria-checked', 'true');
  await expect(offlineMode).toHaveAttribute('data-available', 'false');
  await expect(page.getByText('Keep a copy on this device and sync when online.')).toBeVisible();
});

test('a user who turns Offline Mode off keeps that choice after reloading', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'Offline Mode' }).click();
  await expect(page.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false');

  await page.reload();

  await expect(page.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false');
});
```

- [ ] **Step 4: Run the E2E layer**

Run: `pnpm test:e2e -- settings.e2e.spec.ts`
Expected: PASS. Then run the full `pnpm test:e2e` to confirm the default sync path is unchanged.

- [ ] **Step 5: Commit the tests**

```bash
git add components/web_client/src/components/SettingsView e2e/settings.e2e.spec.ts
git commit -m "test: cover the Offline Mode switch in Storybook and end to end"
```

- [ ] **Step 6: Spec close-out (production workflow → Spec close-out checklist)**

1. Create `docs/features/[YYYYMMDD]GH144_data-mode-seam.md` from `docs/templates/FEATURE.md`. Carry the visual artifact into `## Visual Record`, updated to what was built, with any divergence noted beneath it. Record S1-1 and S1-2 under Design Decisions.
2. `docs/ARCHITECTURE.md`: add ADRs for the data-mode seam (Decisions 1, 3) and injected Service Client shims (Decision 6, noting it narrows ADR-TE-003; S1-1 exception).
3. `CHANGELOG.md` → `## Unreleased`: one entry for the Offline Mode switch and the seam.
4. `docs/PROJECT_STATUS.md`: last completed Spec → the feature doc; current execution `N/A`; next executable Spec → `online-offline-modes` Spec 2.
5. Delete this spec doc and its visual artifact; `grep -r 20261111-Spec1 docs/` returns nothing.
6. Confirm no screenshots are staged.

```bash
git add docs CHANGELOG.md
git commit -m "feat: close out the data-mode seam" -m "- Feature doc, ADRs, CHANGELOG, PROJECT_STATUS; Spec 1 planning docs removed"
```

---

## Verification (manual)

1. `pnpm install`, then start the stack the usual way (`pnpm dev` in `components/web_client` with `service-task` running, or `docker compose up`).
2. Open `http://localhost:5173/settings`. The **Data** section shows **Offline Mode** on, with a muted track.
3. Add a task on the home screen; it behaves exactly as before (sync path).
4. Turn Offline Mode off. The app remounts; lists and tasks are empty and adding a task does nothing (rejected by the stub; an error appears in the console). The switch stays muted.
5. Reload: the switch is still off. Turn it back on: your earlier tasks reappear.

---

## Decisions made during spec drafting

- **S1-1 — Sync store keeps a private sync shim** (operator, 2026-11-11). `useLists.sync.ts` and `useTasks.sync.ts` build `create{Entity}ServiceClient(true)` themselves because their snapshot store runs outside React. It is a bounded exception to Decision 6, retired with the store in Spec 5.
- **S1-2 — Inner clients stay module-private.** `list-service-client.ts` and `task-service-client.ts` export only the factory and the test reset, not `{entity}ApiClient`/`{entity}SyncClient`. Nothing outside the module needs them yet; DESIGN.md's file table lists them as exports, which this narrows.
- **S1-3 — Availability flag lives in `online-path.stub.ts`.** The file that marks the stubs is the one that says they are not functional, so Spec 3 removes both at once.
- **S1-4 — `role="switch"` button, not a segmented control.** The existing Appearance and Contrast choices use segmented radiogroups. A two-state on/off setting reads as a switch.

## Open Questions / Risks

- **DevTask 1 deviates from Git Conventions.** It landed straight on the Spec branch with no DevTask PR, and with 12 production behavior source files (limit 10). This was the operator-requested sandbox; it is reviewed in the Spec PR. Raise it if a split is wanted.
- **The Spec branch name deviates** (`feat/144-web-app-api-store`, not `spec/online-offline-modes-s1-data-mode-seam`). Operator decision; Specs 2-5 should confirm their branch naming at start.
- **Recently Deleted is half-online in Spec 1.** With Offline Mode off, `useRecentlyDeleted` reads through the API shims (real server data), but `restore` still goes through `enqueueWithReplay`. Spec 4 owns it; until then the toggle is marked non-functional.
- **Color-only availability signal** fails WCAG 1.4.1 (operator-accepted, Decision 12).
- **Pre-commit hook has dropped staged files on the first attempt** in this branch's history. If `git status` shows the files unstaged after a commit, re-stage and retry.

## Affected by / Depends on

- Depends on: DESIGN.md APPROVED (2026-11-11). No other Spec.
- Unblocks: Spec 2 (`server-positions-default-list`) and Spec 3 (`online-only-lists-tasks`).
