---
status: IN_PROGRESS
issue: P2
pr:
completed_at:
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec_number: 2
devtasks_total: 2
devtasks_complete: 1
step_gating: false
honors_decisions: [37, 38, 39, 40, 46, 55]
---

# PWA IndexedDB Store + useSyncExternalStore — Implementation Spec

> Generated using `superpowers:writing-plans`.
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement one DevTask at a time.

**Goal:** Make IndexedDB (IDB) the PWA read source of truth and expose task state to React through `useSyncExternalStore`.

**Architecture:** `components/web_client/src/db/idb.ts` owns the `idb` database and store helpers. React reads through `src/hooks/useTasks.ts`; cold start performs one server hydration and then renders from IDB snapshots. Same-tab changes notify through `EventTarget`; cross-tab changes notify through `BroadcastChannel('psykl-idb')`.

**Tech Stack:** React 18, Vite, `idb`, `fake-indexeddb`, MSW, Storybook test-runner, Vitest.

---

## Overview

As a user, the PWA can load my tasks instantly from local storage instead of waiting on the network. This spec touches only `components/web_client`, plus generated OpenAPI client types from Spec 1.

## Data Model

No server schema changes. Browser IDB database `psykl` version `1` has stores:

- `tasks`, keyPath `id`, indexes `user_id`, `updated_at`, `deleted_at`.
- `sync_queue`, keyPath `id`, indexes `task_id`, `created_at`.
- `sync_meta`, keyPath `key`.
- `failed_ops`, keyPath `id`, indexes `created_at`, `task_id`.

Task rows mirror server wire shape exactly.

## API

No new API surface. Cold-start hydration calls existing `GET /tasks?include_deleted=1`.

## Implementation Components

### `components/web_client/`

- Create `src/db/idb.ts` with `openPsyklDb()`, typed helpers, and upgrade path.
- Create `src/db/__tests__/idb.unit.test.ts` using `fake-indexeddb`.
- Create `tests/integration/idb.integration.test.ts` for upgrade and persistence behavior.
- Create `src/hooks/useTasks.ts` and `src/hooks/__tests__/useTasks.unit.test.tsx`.
- Modify `src/App.tsx`, `src/components/TaskList/TaskList.tsx`, and `src/components/TaskCreateForm/TaskCreateForm.tsx` so reads use `useTasks()`.
- Modify Storybook stories and MSW handlers for hydration.

## Test Plan

Static: `pnpm verify:static`.

Unit:

| File                                                               | Assertion                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `components/web_client/src/db/__tests__/idb.unit.test.ts`          | opens DB, creates all stores, writes/reads/deletes task rows |
| `components/web_client/src/hooks/__tests__/useTasks.unit.test.tsx` | subscription updates render after IDB writes                 |

Integration:

| File                                                              | Assertion                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `components/web_client/tests/integration/idb.integration.test.ts` | versioned upgrade path creates stores without losing existing task rows |

Component:

| File                                                                                       | Assertion                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx`             | cold-start hydration renders server tasks from IDB             |
| `components/web_client/src/components/TaskCreateForm/__tests__/TaskCreateForm.stories.tsx` | create form observes IDB updates instead of direct fetch state |

End-to-End: deferred to Spec 6.

## DevTasks

Spec integration branch: `spec/m2-s2-pwa-indexeddb-store`.

### DevTask M2-5: Add IDB database and store helpers

**Branch:** `feat/m2-s2-dt5-idb-store`
**Affected:** `components/web_client/src/db/idb.ts`, `components/web_client/src/db/idb.types.ts`, `components/web_client/src/db/__tests__/idb.unit.test.ts`, `components/web_client/tests/integration/idb.integration.test.ts`, `components/web_client/package.json`, lockfile.

- [x] Step 1: Add `idb` and `fake-indexeddb` dependencies.
- [x] Step 2: Write failing unit tests for opening database version 1 and all four stores.
- [x] Step 3: Write failing tests for `putTask`, `listTasks`, `getTask`, `deleteTask`, `enqueueSyncOp`, `listSyncQueue`, and `putMeta`.
- [x] Step 4: Implement `src/db/idb.ts` with typed store helpers.
- [x] Step 5: Write upgrade integration test proving a version 0/empty database upgrades to version 1 and preserves inserted tasks across reopen.
- [x] Step 6: Run `pnpm --filter @psykl/web-client test:unit` and targeted IDB integration command used by the component package.
- [x] Step 7: Commit with `feat: add pwa indexeddb task store`.

### DevTask M2-6: Add useTasks and refactor UI reads

**Branch:** `feat/m2-s2-dt6-use-tasks-store`
**Affected:** `components/web_client/src/hooks/useTasks.ts`, `components/web_client/src/hooks/__tests__/useTasks.unit.test.tsx`, `components/web_client/src/App.tsx`, `components/web_client/src/components/TaskList/TaskList.tsx`, `components/web_client/src/components/TaskList/__tests__/TaskList.unit.test.tsx`, `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx`, `components/web_client/src/components/TaskCreateForm/TaskCreateForm.tsx`, `components/web_client/src/test/msw-handlers.ts`.

- [ ] Step 1: Write failing hook tests proving subscribers render the IDB snapshot and rerender on same-tab event.
- [ ] Step 2: Write failing hook test proving BroadcastChannel messages trigger snapshot reload.
- [ ] Step 3: Implement `useTasks()`, `notifyTasksChanged()`, and cold-start hydration from `GET /tasks?include_deleted=1`.
- [ ] Step 4: Refactor `TaskList`, `TaskCreateForm`, and `App` to read tasks from the hook and stop maintaining fetch-owned task state.
- [ ] Step 5: Update Storybook stories with MSW hydration data and play functions that wait for IDB-rendered rows.
- [ ] Step 6: Add final Spec close-out docs in the Spec integration PR: feature doc, `CHANGELOG.md`, durable docs if changed, and delete the P2 issue brief plus this spec at close-out.
- [ ] Step 7: Run `pnpm verify:prepare`, `pnpm --filter @psykl/web-client test:unit`, and `pnpm --filter @psykl/web-client test:component`.
- [ ] Step 8: Commit with `feat: read pwa tasks from indexeddb`.

## Verification

1. `pnpm verify:prepare`
2. `pnpm verify:static`
3. `pnpm --filter @psykl/web-client test:unit`
4. `pnpm --filter @psykl/web-client test:component`

## Decisions made during spec drafting

- Hydration uses `include_deleted=1` from the start so tombstones survive local reconciliation.

## Open Questions / Risks

- `fake-indexeddb` behavior can miss browser transaction timing; Spec 4 and Spec 6 add real Chromium coverage.

## Affected by / Depends on

- Depends on Spec 1 for evolved Task response types and `GET /tasks?include_deleted=1`.
- Blocks Specs 3 through 6.
