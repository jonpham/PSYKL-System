# Design: Online / Offline Modes — two data paths in the PWA

Drafted directly in the gstack initiative-design shape (operator chose a draft over `/office-hours`) on 2026-10-11
Review: lightweight operator review in place of a full `/plan-eng-review` (operator decision, 2026-10-11)
Branch: `feat/144-web-app-api-store`
Repo: [jonpham/PSYKL-System](https://github.com/jonpham/PSYKL-System)
Status: DRAFT — awaiting operator review
Milestone tag: `online-offline-modes`
Sources: [#144](https://github.com/jonpham/PSYKL-System/issues/144) (online-only mode), [#135](https://github.com/jonpham/PSYKL-System/issues/135) (isolate sync behind services), operator direction commit `d537d44`

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - IDB = IndexedDB, the browser's local database.
> - Offline Mode = the user setting choosing the data path. `true` (default) = today's IDB + sync queue path. `false` = online-only path.
> - Sync path = Offline Mode `true`: IDB is the read source of truth, writes queue and replay (ADR-M2-005, ADR-TE-003).
> - API path = Offline Mode `false`: the server is the source of truth; the client holds only an in-memory cache.
> - TanStack Query = the `@tanstack/react-query` library — an in-memory server-state cache for React.
> - Seam = the single place a `use{Entity}` hook picks a path.
> - RxJS = Reactive Extensions for JavaScript — an observable-stream library.
> - DexieJS = an IDB wrapper library; its `liveQuery()` turns an IDB query into an observable.
> - Shim = a thin, stateless wrapper; here, the `{entity}ServiceClient` that sends each call to the API or Sync inner client.

## Problem Statement

Every entity hook (`useLists`, `useTasks`) reads and writes through IDB and the sync queue. There is no way to see what the **server** says without the local store in between, so a sync bug cannot be told apart from a server bug. Browsers without usable IDB cannot run the app at all.

## Constraints

- Client changes in `components/web_client/src/` (#144 Scope). Server changes in `components/service-task/` are limited to Spec 2's contract (Decision 10), with `packages/shared-types` regenerated from it.
- User-visible sync-path behaviour does not change (#144 Not now). It stays the default. Spec 5 swaps its internals, not its behaviour.
- UI Components keep calling `use{Entity}()` and stay unaware of which path is active.
- Both paths return the **same result type** per entity; neither leaks its framework (no `useSyncExternalStore` or TanStack types in the result).

## Premises

1. The seam belongs in the `use{Entity}` hooks, not in the Service Client — the two paths differ in **state ownership** (module store + IDB vs query cache), not just transport.
2. The mode is fixed for the lifetime of a mounted React tree. Switching remounts the tree.
3. Sync-only surfaces (`SyncView`, `SyncStatus`, `useSyncRecords`, `useSyncDiscrepancy`) are the only UI allowed to know sync exists (#135).

## Architecture

```mermaid
flowchart TD
  SP["SettingsProvider<br/>offlineMode · setOfflineMode<br/>remounts children on change<br/>provides ServiceClients (rebuilt per mode)"] --> App
  App --> C["UI Components"]
  C --> UL["useLists() / useTasks()<br/>(seam: reads useUserSettings)"]
  UL -- "offlineMode = true" --> SC["use{Entity}SyncClient<br/>hooks/use{Entity}.sync.ts"]
  UL -- "offlineMode = false" --> AC["use{Entity}ApiClient<br/>hooks/use{Entity}.api.ts"]
  SC --> SSC["{entity}ServiceClient shim<br/>offlineCapable: true"]
  AC --> TQ["TanStack Query cache<br/>(observable)"]
  TQ --> DSC["{entity}ServiceClient shim<br/>offlineCapable: false"]
  SSC --> SYNCC["{entity}SyncClient singleton"] --> IDB[("IDB — the observable store<br/>today: idb + hand-rolled subscribers<br/>future: Dexie liveQuery")] --> API[(service-task)]
  DSC --> APIC["{entity}ApiClient singleton"] --> API
```

Each path has exactly one observable source. On the API path it is the TanStack Query cache. On the sync path it is IDB itself — there is no second store above it (Decision 9). The shims are stateless and come from `useServiceClients()`. All state (hydration, queue, IDB) lives in the inner singletons, so rebuilding a shim on a mode change costs nothing. IDB opens per call, not when a client is built, so the sync singleton is harmless in a browser without IDB as long as the API path never calls it.

| File (per entity)                     | Owns                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hooks/use{Entity}.ts`                | Result type + the seam. No sync or TanStack imports.                                                                                                   |
| `hooks/use{Entity}.sync.ts`           | Today's implementation: module snapshot store, hydrate, `enqueueWithReplay`, change subscriptions.                                                     |
| `hooks/use{Entity}.api.ts`            | Online implementation over TanStack Query. **Stubbed in Spec 1.**                                                                                      |
| `hooks/useUserSettings.ts`            | Settings context + hook.                                                                                                                               |
| `hooks/useServiceClients.ts`          | Service Client context + hook. Hooks take their Service Client from here, never by module import.                                                      |
| `components/SettingsProvider/`        | Reads/writes the stored mode, keys `children` on it, builds the per-mode Service Client shims.                                                         |
| `services/{entity}-service-client.ts` | Exports the inner singletons (`{entity}ApiClient`, `{entity}SyncClient`) and a `create{Entity}ServiceClient(offlineCapable)` factory — no static shim. |

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Status               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Bifurcate at `use{Entity}()`; each path is a `use{Entity}{Sync\|Api}Client()` hook with the shared result type (#144 Outcome).                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Operator, 2026-10-11 |
| 2   | TanStack Query backs the **API path**. The sync path keeps `useSyncExternalStore` + IDB. (#144's body has the two labels swapped; its title is right.)                                                                                                                                                                                                                                                                                                                                                                                                                            | Operator, 2026-10-11 |
| 3   | Toggling remounts the app tree: `SettingsProvider` renders `children` under `key={mode}`. A conditional hook call in the seam is then safe because the branch never changes within one mount.                                                                                                                                                                                                                                                                                                                                                                                     | Operator, 2026-10-11 |
| 4   | #135 (move `sync/` under `services/sync/`) is a later Spec, not part of the seam work.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Operator, 2026-10-11 |
| 5   | Offline Mode is stored in **`localStorage`** (`psykl:offline-mode`), not IDB `sync_meta`. The API path's target users may have no IDB. **Re-opens** the device-local-preferences rule in [`docs/DESIGN.md`](../../DESIGN.md) for this one key.                                                                                                                                                                                                                                                                                                                                    | Operator, 2026-10-11 |
| 6   | The singletons are the inner clients (`{entity}ApiClient`, `{entity}SyncClient`). `{entity}ServiceClient` is a stateless shim built by `createServiceClient({ apiClient, syncClient, offlineCapable })`, rebuilt when the mode changes, and injected through React context (`useServiceClients()`). `ServiceClientConfig` stops being a discriminated union, since both inner clients always exist. Callers outside React take the shim as an argument. Lands in Spec 1. **Re-opens** ADR-TE-003's constructor-time, static `offlineCapable`.                                     | Operator, 2026-10-11 |
| 7   | **Scheduled.** Default-list bootstrap (`useLists.default-list`) and list positions (`useLists.positions`) read IDB directly from `hooks/` and are sync-path only. Until Spec 5 these smells stay, marked with in-code comments, and the online stubs must not import them. Spec 2 (Decision 10) removes the online path's need for them. Spec 5 moves the sync path's provisional offline position and offline default-list bootstrap behind the Sync Client, so no hook reads IDB. The sync path cannot drop them entirely, because offline creation cannot wait for the server. | Operator, 2026-10-11 |
| 8   | Sync-store change notifications (`subscribeToListChanges`, `notifyListSubscribers`, `subscribeToTaskChanges`) are **interim** machinery for today's hand-rolled sync observable. They live in `use{Entity}.sync.ts`, and the seam re-exports them so existing consumers stay untouched. They are retired, not relocated, when Decision 9 lands.                                                                                                                                                                                                                                   | Operator, 2026-10-11 |
| 9   | **Lands in Spec 5:** the sync path reads IDB **as** the observable. A DexieJS wrapper's `liveQuery()` (re-fires on any write to the tables it read, across tabs) replaces the snapshot, subscribers, BroadcastChannel, and reload-generation guards. RxJS is optional glue for composing streams, not a second store. Neither Dexie nor RxJS types may appear in `Use{Entity}Result`.                                                                                                                                                                                             | Operator, 2026-10-11 |
| 10  | **Server owns positions and the default list (Spec 2, before any online write).** `position` becomes optional on list create; when omitted, the server appends the list after the current last one. The server ensures the default list exists under the fixed `DEFAULT_LIST_ID`. The online path never computes a position or bootstraps a list. The sync path keeps sending a provisional position for offline creates. Contract settled per AGENTS.md → API Decision Discipline, inheriting the existing REST + OpenAPI choices.                                               | Operator, 2026-10-11 |

## Spec Breakdown (UI-first per production workflow)

| Spec | Slug                            | Delivers                                                                                                                                                                                                                                                                                                                              |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `data-mode-seam`                | `SettingsProvider` + `useUserSettings`, seam in `useLists`/`useTasks`, `.sync.ts` holds today's code, `.api.ts` stubs. Service Client shims injected via `useServiceClients()`. Static singleton shims removed from `useLists.sync`, `useTasks.sync`, `useRecentlyDeleted`, `usePendingTaskIds` (Decision 6). No user-visible change. |
| 2    | `server-positions-default-list` | `service-task`: optional `position` on list create (server appends), server-ensured default list under `DEFAULT_LIST_ID`; OpenAPI + `shared-types` regenerated (Decision 10). Sync path unchanged. The only Spec that is backend-first: it is a contract that Spec 3's UI depends on (production workflow → UI/UX-First exception).   |
| 3    | `online-only-lists-tasks`       | Settings toggle (UI first, against stubs), then TanStack Query implementations of `useListsApiClient`/`useTasksApiClient` on the Spec 2 contract. Closes #144.                                                                                                                                                                        |
| 4    | `online-only-surfaces`          | `useRecentlyDeleted` on both paths; sync-only UI hidden in the API path; page sync triggers idle in the API path.                                                                                                                                                                                                                     |
| 5    | `sync-behind-services`          | Move `sync/` to `services/sync/`; no `hooks/` or `components/` file imports it. Dexie `liveQuery` replaces the hand-rolled sync store (Decision 9), retiring the interim notifications (Decision 8). Offline position + default-list bootstrap move behind the Sync Client (Decision 7). Closes #135.                                 |

## Settings surface (Spec 3 — low fidelity)

```
┌ Settings ─────────────────────────────┐
│ Appearance   [System][Light][Dark]    │
│ Contrast     [Standard][Increased]    │
│ Data                                  │
│   Offline Mode            [ ●── On ]  │
│   Keep a copy on this device and      │
│   sync when online.                   │
│ Experiments …                         │
└───────────────────────────────────────┘
Off → app remounts and reads straight from the server.
```

## Open Questions

1. **Pending sync queue on switch to Offline Mode off.** Keep queued writes and replay them on return, warn before switching, or block the switch until the queue drains? (Spec 3.)
2. **Toggle visibility before Spec 3 completes.** Hide the toggle until the API path works, or show it only when experiment tools are on?
3. **Appearance/contrast prefs read IDB at startup** (`preferences/bootstrap.ts`). In a browser with no IDB they fail. Fall back to defaults silently, or move them to `localStorage` too? (Spec 4.)
4. ~~**Default list on the API path.**~~ Resolved by Decision 10: the server ensures it (Spec 2).
5. **Where the Dexie observable is exposed (Decision 9, Spec 5).** Through the Sync Client (e.g. `observe(): Observable<TEntity[]>`, keeping hooks free of `db/` and `sync/` imports per #135 and ADR-TE-004), or read by `use{Entity}SyncClient` directly via `useLiveQuery`?
6. **Default-list trigger on the server (Spec 2).** Ensure it lazily on the first `GET /lists` that finds none, or on any list/task write? This interacts with the existing `onConflictDoNothing` create (ADR on the fixed default-list id) and with #117 (`DEFAULT_LIST_ID` is a global primary key, so it is single-account only).

## Out of Scope

Server changes beyond Decision 10; Apple-native clients; user-visible sync-path behaviour changes; multi-tenant auth (including #117).
