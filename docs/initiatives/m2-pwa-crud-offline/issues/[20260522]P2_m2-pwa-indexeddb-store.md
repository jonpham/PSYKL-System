---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: GH#39
branches: # one entry per DevTask (each branches off spec/m2-s2-... per revised workflow)
  -
prs: # one entry per DevTask PR (each targets the Spec branch)
  -
spec_branch: # spec/m2-s2-pwa-indexeddb-store once cut
spec_pr: # PR URL for spec/m2-s2-... → main
completed_at:
created_at: 2026-05-22
initiative: m2-pwa-crud-offline
spec: 2
devtasks_total: 2 # M2-5 + M2-6
devtasks_complete: 0
---

# 20260522 - M2 Spec 2: PWA IndexedDB store + useSyncExternalStore hook

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge into the Spec branch, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **user**, I want **the PWA to load my tasks instantly from local storage instead of waiting on the network** so that **the app feels native-fast even on flaky Wi-Fi, my tasks survive a tab refresh without a round-trip to the server, and offline reads work transparently without me knowing or caring whether the network is up**.

## Features (DevTasks composing this Spec)

1. **DevTask M2-5 — `idb` integration + IDB store schemas.** New `src/db/idb.ts` in `web_client` using the `idb` library (Jake Archibald, ~2KB). Object store schemas for `tasks` (mirror server row shape), `sync_queue`, `sync_meta`, and `failed_ops`. Schema-version upgrade machinery: `idb.openDB('psykl', 1, { upgrade })` with explicit migration callbacks per version. Initial seed leaves all stores empty; hydration is Spec 3's concern. Unit tests for each store's CRUD operations against an in-memory IDB shim (`fake-indexeddb`). Integration tests against real IDB (jsdom). ~5 production behavior source files.
2. **DevTask M2-6 — `useSyncExternalStore` hook + UI refactor.** New `src/hooks/useTasks.ts` exposing a `useTasks()` hook using React 18's `useSyncExternalStore` primitive. Subscription bus: same-tab uses `EventTarget`, cross-tab uses `BroadcastChannel('psykl-idb')`. Initial PWA load hydrates IDB from a single `GET /tasks` call (hydration-on-cold-start; subsequent reads are IDB-only). The existing `TaskList` and create form refactor to read from `useTasks()` instead of fetching directly. Component-layer tests using MSW for the cold-start hydration path and Vitest + `fake-indexeddb` for the subscription/re-render contract. ~7 production behavior source files.

## Verification Steps

**Associated E2E test:** none directly in this Spec — Spec 6 (M2-13) covers the offline-load and cross-device sync E2Es. This Spec ships Component-layer tests.

**Manual verification:**

_Setup / Preconditions_

- Spec 1 merged into `main`; service-task supports PATCH/DELETE/Idempotency-Key/LWW. (Or — for parallel development — Spec 1's DevTasks are present in the developer's local stack.)
- Spec branch `spec/m2-s2-pwa-indexeddb-store` cut from `main`; draft PR opened against `main`.
- `web_client` running locally on `:5173` via `pnpm --filter web_client dev`.
- At least one Task exists on the running `service-task` instance.

_Steps_

1. Run `pnpm --filter web_client test:unit` — `idb.ts` CRUD tests pass against `fake-indexeddb`.
2. Run `pnpm --filter web_client test:integration` — IDB store schema + upgrade machinery tests pass.
3. Run `pnpm --filter web_client test:component` — `useTasks()` hook + cold-start hydration + cross-tab subscription tests pass.
4. Open the PWA at `http://localhost:5173/`. Confirm a single `GET /tasks` request fires on cold start (DevTools → Network) and the task list renders.
5. Reload the page. Confirm tasks render BEFORE any new `GET /tasks` request fires (IDB hydration is instant). The `GET /tasks` fires shortly after as a background revalidate (the SWR cache shape will solidify in Spec 4 — for Spec 2, a single hydrate on cold start is sufficient).
6. In DevTools → Application → IndexedDB → `psykl`, confirm the four object stores exist (`tasks`, `sync_queue`, `sync_meta`, `failed_ops`) and `tasks` is populated.
7. With DevTools → Network → "Offline" toggle ON, reload the page. Tasks STILL render (IDB-only read).
8. Open the PWA in a SECOND tab. Trigger a mutation via the running service (e.g., `curl` the API). Re-hydrate the first tab manually (force-reload). Confirm the new state appears in both tabs after the next cold-start hydration (cross-tab realtime via `BroadcastChannel` only fires for IDB writes happening within the PWA — it activates fully when Spec 3's sync engine writes to IDB; for Spec 2 alone the cross-tab path is wired but not yet exercised by writes).

_Expectation_
The PWA's UI is fully IDB-backed for reads. Network is only used for the initial hydrate on cold start. Closing the network has zero impact on the read experience. The IDB schema is in place for Spec 3 (sync engine) and Spec 4 (Service Worker) to populate.

## Affected Components

- `components/web_client/` (extended):
  - `src/db/idb.ts` (new — `idb` integration, store schemas, upgrade callback).
  - `src/db/idb.types.ts` (new — shared IDB row and schema types).
  - `src/db/__tests__/idb.unit.test.ts`, `tests/integration/idb.integration.test.ts` (new test files).
  - `src/hooks/useTasks.ts` (new — `useSyncExternalStore` wrapper).
  - `src/hooks/__tests__/useTasks.unit.test.tsx` (new — hook subscription tests).
  - `src/db/events.ts` (new — `EventTarget` + `BroadcastChannel` subscription bus).
  - `src/api/hydrate.ts` (new — cold-start hydration from `GET /tasks`).
  - `src/components/TaskList/TaskList.tsx` (refactor — read from `useTasks()` instead of inline fetch).
  - `src/components/TaskCreateForm/TaskCreateForm.tsx` (refactor — write to IDB directly; sync wiring comes in Spec 3).
  - `package.json` (add `idb`, `fake-indexeddb` dependencies).

## Design Decisions

From `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` → Decisions appendix:

- **#37** IndexedDB library: `idb` (Jake Archibald, ~2KB). Promise wrapper, standards-close, manual upgrade functions.
- **#38** IDB schema shape: mirror server. One object store per server table; plus operational stores.
- **#39** M2 IDB stores: `tasks`, `sync_queue`, `sync_meta`, `failed_ops`.
- **#46** PWA UI source of truth: IndexedDB only, accessed via `useSyncExternalStore`. No parallel in-memory state library.

## Architecture Decisions (ADR)

- **ADR-M2-005:** IDB is the source of truth for UI reads. Network reads are reserved for cold-start hydration (Spec 2) and SWR background revalidate (Spec 4). UI components NEVER call `fetch` directly; they go through `useTasks()` / equivalent hooks. See Decision #46.
- **ADR-M2-006:** Cross-tab IDB invalidation uses `BroadcastChannel('psykl-idb')`. Same-tab uses a plain `EventTarget`. No SharedWorker, no localStorage event bus, no third-party state-sync library. `BroadcastChannel` is the modern API for this case and works in every PWA target browser (Chromium-family + Android Chrome).
- **ADR-M2-007:** `fake-indexeddb` is the test-time shim for Unit-layer IDB tests. Integration tests use jsdom's real IDB. The shim is dev-dep only. See `package.json` impact above.
- **ADR-M2-008:** IDB schema-version upgrade callbacks are colocated with the schema definition in `src/db/idb.ts`. Pattern: a single `upgrade(db, oldVersion, newVersion, transaction)` callback uses cumulative `if (oldVersion < N)` checks to dispatch to per-version named helper functions:

  ```ts
  // src/db/idb.ts
  export const CURRENT_SCHEMA_VERSION = 1; // bumped by M3 to 2 when task_intervals lands

  export function openPsyklDb() {
    return openDB<PsyklSchema>('psykl', CURRENT_SCHEMA_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) createV1Stores(db);
        // M3 will add: if (oldVersion < 2) addV2TaskIntervals(db, tx);
        // each subsequent milestone appends its own check
      },
    });
  }

  function createV1Stores(db: IDBPDatabase<PsyklSchema>) {
    db.createObjectStore('tasks', { keyPath: 'id' });
    db.createObjectStore('sync_queue', { keyPath: 'op_id' });
    db.createObjectStore('sync_meta'); // key/value, no keyPath
    db.createObjectStore('failed_ops', { keyPath: 'op_id' });
  }
  ```

  Each per-version helper is idempotent within its transition (running it twice on the same database produces the same final state). When v2 lands in M3, the v1→v2 helper is added inline and the v1→v2 transition is contract-tested at the Component layer. M2 ships only v0→v1; the function shape is locked here in this ADR so M3+ inherit the pattern without reinventing it. (Per the durable-docs principle, this ADR — not a DESIGN.md Decision — is the home for the pattern; at M2 close the ADR carries forward into the Spec M2-2 feature doc, and `docs/ARCHITECTURE.md` gets a cross-reference once the pattern has shipped.)

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
