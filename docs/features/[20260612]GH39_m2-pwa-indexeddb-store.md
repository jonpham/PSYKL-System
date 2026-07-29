---
status: DONE
issue: [GH#39](https://github.com/jonpham/PSYKL-System/issues/39)
branches:
  - feat/m2-s2-dt5-idb-store
  - feat/m2-s2-dt6-use-tasks-store
prs:
  - https://github.com/jonpham/PSYKL-System/pull/53
  - https://github.com/jonpham/PSYKL-System/pull/54
completed_at: 2026-06-12
created_at: 2026-06-12
initiative: m2-pwa-crud-offline
spec: consolidated-into-this-doc
---

# M2 Spec 2: PWA IndexedDB Store + useSyncExternalStore

> Generated from `superpowers:writing-plans` artifacts and completed using `superpowers:executing-plans` with `superpowers:test-driven-development`.

## User Story

As a user, I want the PWA to load my Tasks from local storage instead of waiting on the network so that the app feels native-fast on flaky Wi-Fi, Tasks survive tab refreshes, and offline reads have a stable browser-side source of truth.

## Features

1. `components/web_client` owns a versioned IndexedDB database named `psykl` through the `idb` package.
2. IndexedDB version 1 creates `tasks`, `sync_queue`, `sync_meta`, and `failed_ops` stores with indexes needed by later sync work.
3. Task rows in the `tasks` store mirror the server wire shape, including `completed_at`, `updated_at`, `server_updated_at`, and `deleted_at`.
4. `useTasks()` exposes Task snapshots through React `useSyncExternalStore`.
5. Cold-start hydration calls `GET /tasks?include_deleted=1`, writes returned rows into IndexedDB, and then renders from the local snapshot.
6. Tombstoned rows are retained locally but filtered out of the visible Task list.
7. Same-tab writes call `notifyTasksChanged()` to reload the local snapshot.
8. Cross-tab invalidation uses `BroadcastChannel('psykl-idb')`.
9. `TaskList` reads through `useTasks()` instead of accepting fetched task props.
10. `TaskCreateForm` writes successful server-created Tasks into IndexedDB and notifies subscribers; the sync queue takes over mutation ownership in Spec 3.
11. Storybook play functions reset IndexedDB between stories and verify the create-to-local-render path through MSW-backed HTTP responses.

## Source Artifacts Consolidated

- Initiative design: consolidated into this feature doc, `docs/ARCHITECTURE.md`, and `docs/retrospectives/2026-07-29-m2-pwa-crud-offline.md`; deleted at M2 initiative close-out.
- Original issue brief: `docs/initiatives/m2-pwa-crud-offline/issues/[20260522]P2_m2-pwa-indexeddb-store.md` (deleted by this PR).
- Execution spec: `docs/specs/m2-pwa-crud-offline/20260610-S2-pwa-indexeddb-store.md` (deleted by this PR).
- GitHub issue: [#39](https://github.com/jonpham/PSYKL-System/issues/39).
- Constituent DevTask PRs: [#53](https://github.com/jonpham/PSYKL-System/pull/53) and [#54](https://github.com/jonpham/PSYKL-System/pull/54).

## Implementation Notes

- **M2-5 (PR #53)** added the `idb` and `fake-indexeddb` dependencies, the typed database helpers, version-1 store creation, Unit tests for store helpers, and an Integration test for upgrade/persistence behavior.
- **M2-6** added `useTasks()`, same-tab notification, BroadcastChannel invalidation, cold-start hydration, and UI refactors so the PWA reads from IndexedDB-backed snapshots instead of React-owned fetch state.
- The database name is `psykl`; current schema version is `1`.
- Store helpers open and close transactions per operation. Future schema versions should keep cumulative upgrade checks in `src/db/idb.ts`.
- Hydration intentionally requests tombstones with `include_deleted=1` so local reconciliation can preserve deletes once the sync engine lands.

## Verification Steps

**Associated End-to-End test:** none in this Spec. M2 Spec 6 activates the full offline and multi-device End-to-End coverage after the sync engine and service worker land.

**Manual verification**

Setup / Preconditions:

- Node 24 LTS is active.
- Dependencies are installed with `pnpm install`.
- Generated artifacts are refreshed with `pnpm verify:prepare`.

Steps:

1. Run `pnpm verify:static`.
2. Run `pnpm --filter @psykl/web-client test:unit`.
3. Run `pnpm --filter @psykl/web-client test:integration`.
4. Run `pnpm --filter @psykl/web-client test:component`.
5. Start the local stack or run `service-task` and `web_client` separately.
6. Open the PWA at `http://localhost:5173/`.
7. Confirm a single `GET /tasks?include_deleted=1` hydration request fires on cold start.
8. In DevTools -> Application -> IndexedDB -> `psykl`, confirm `tasks`, `sync_queue`, `sync_meta`, and `failed_ops` exist.
9. Create a Task from the PWA and confirm the visible list updates from the local store.
10. Reload with the network offline and confirm stored Tasks still render from IndexedDB.

Expectation: the PWA's visible Task list is backed by IndexedDB snapshots. Network reads hydrate the local store; React renders from the store.

## Affected Components

- `components/web_client`: IndexedDB helper module, hook subscription module, Task UI Components, Storybook reset/play coverage, package dependencies.

## Design Decisions

- **Decision #37:** IndexedDB library is `idb`.
- **Decision #38:** IndexedDB schema mirrors server row shape.
- **Decision #39:** M2 ships `tasks`, `sync_queue`, `sync_meta`, and `failed_ops` stores.
- **Decision #40:** Sync queue entries use operation IDs rather than Task IDs as row identity.
- **Decision #46:** PWA UI source of truth is IndexedDB accessed through `useSyncExternalStore`.
- **Decision #55:** Spec 2 depends on Spec 1's evolved Task response shape and tombstone read path.

## Architecture Decisions (ADR)

- **ADR-M2-005:** Browser-side Task reads use IndexedDB as the PWA source of truth. UI Components do not own parallel fetched Task state.
- **ADR-M2-006:** `useTasks()` is the React boundary over the external IndexedDB store, using `useSyncExternalStore` for subscription-safe rendering.
- **ADR-M2-007:** Same-tab writes call `notifyTasksChanged()`; cross-tab invalidation uses `BroadcastChannel('psykl-idb')`.
- **ADR-M2-008:** IndexedDB schema-version upgrades live next to the store definitions in `components/web_client/src/db/idb.ts` and use cumulative version checks.
- **ADR-M2-009:** `fake-indexeddb` is the Unit/Integration test shim for browser storage behavior; real browser coverage remains in Storybook Component tests and later End-to-End tests.

## Change Log

| Date       | PR                                                     | Summary                                                                    |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| 2026-06-12 | [#53](https://github.com/jonpham/PSYKL-System/pull/53) | M2-5: IndexedDB database, typed store helpers, Unit and Integration tests. |
| 2026-06-12 | [#54](https://github.com/jonpham/PSYKL-System/pull/54) | M2-6: `useTasks()`, hydration, notifications, UI read refactor, stories.   |
