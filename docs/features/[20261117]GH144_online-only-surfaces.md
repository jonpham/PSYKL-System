---
status: DONE
issue: GH144
branches:
  - spec/online-offline-modes-s4-online-only-surfaces # Spec integration branch
  - feat/online-offline-modes-s4-dt11-hide-sync-online
  - feat/online-offline-modes-s4-dt12-recently-deleted-online
  - feat/online-offline-modes-s4-dt13-preferences-without-idb
prs:
  - https://github.com/jonpham/PSYKL-System/pull/158 # Spec integration PR
  - https://github.com/jonpham/PSYKL-System/pull/159
  - https://github.com/jonpham/PSYKL-System/pull/160
  - https://github.com/jonpham/PSYKL-System/pull/161
completed_at: 2026-11-17
created_at: 2026-11-17
initiative: online-offline-modes
spec: docs/specs/online-offline-modes/20261117-Spec4-online-only-surfaces.md (deleted at close-out; this doc is the record)
---

# Every Surface Works with Offline Mode Off

> Glossary:
>
> - IDB = IndexedDB, the browser's local database.
> - Offline Mode on = the sync path (IDB + sync queue). Offline Mode off = the API path (server + TanStack Query's in-memory cache).
> - TanStack Query = `@tanstack/react-query`, an in-memory server-state cache for React. Query key = the name a cached read is stored under.
> - Device-local value = something about this device, never sent to the server: appearance, contrast, "show completed" per list, the open list.

## User Story

As a PSYKL user with Offline Mode off, every screen works against the server: I see no sync controls that have nothing to report, I can restore what I deleted, and the app keeps my preferences and open list even in a browser without IndexedDB.

## Features

1. [#144](https://github.com/jonpham/PSYKL-System/issues/144): **No sync controls with Offline Mode off.** The header's sync control and the Sync item in the navigation are gone; a bookmark or typed address to `/sync` opens the list. With Offline Mode on they are unchanged.
2. **Page sync stays idle with Offline Mode off.** Returning to the app or coming back online no longer sends changes left queued from before switching off; they wait for Offline Mode on (Decision 11).
3. **Recently Deleted works with Offline Mode off.** It shows what the server holds as deleted in the last 30 days. Restore waits for the server, and a list comes back with the tasks deleted with it. Something just deleted shows without a reload. A refused restore leaves the row in place.
4. **Preferences and the open list work without IndexedDB.** Appearance, contrast, "show completed" per list and the open list fall back to `localStorage` when IndexedDB cannot be opened (Decision 13, S4-5), so the app runs with Offline Mode off in such a browser.

## Visual Record

**List header.** The sync control belongs to the sync path; with Offline Mode off nothing waits on the device, so there is nothing for it to report.

```text
Offline Mode on (unchanged)                 Offline Mode off
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│ ☰ PSYKL        Tasks          ⟳   ⋯   │   │ ☰ PSYKL        Tasks              ⋯   │
└───────────────────────────────────────┘   └───────────────────────────────────────┘
                                  ↑ sync control                       ↑ gone; List options stays
```

**Navigation.**

```text
Offline Mode on (unchanged)        Offline Mode off
┌ PSYKL ─────────────────────┐     ┌ PSYKL ─────────────────────┐
│ ▤ Lists                  ⌄ │     │ ▤ Lists                  ⌄ │
│     Tasks                  │     │     Tasks                  │
│     Groceries              │     │     Groceries              │
│ 🗑 Recently Deleted         │     │ 🗑 Recently Deleted         │
│ ────────────────────────── │     │ ────────────────────────── │
│ ⟳ Sync                     │     │ ⚙ Settings                 │  ← the divider moves up
│ ⚙ Settings                 │     └────────────────────────────┘
└────────────────────────────┘
```

**Recently Deleted with Offline Mode off.** Same screen as with Offline Mode on; Restore now works.

```text
┌ Recently Deleted ─────────────────────────┐
│ ☐ Milk                 task     30d  Restore │
│ ▤ Groceries      list · 1 item  29d  Restore │
└───────────────────────────────────────────┘
```

| State                            | What the user sees                                                                                  | How they got here                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| On (default)                     | Unchanged: sync control in the header, Sync in the navigation, the Sync destination at `/sync`.     | Offline Mode on                                    |
| Off, a list                      | No sync control in the header; List options stays.                                                  | Offline Mode off                                   |
| Off, navigation open             | No Sync item; the divider sits above Settings.                                                      | Opened the navigation                              |
| Off, opens `/sync`               | Lands on their list instead.                                                                        | A bookmark or typed address                        |
| Off, Recently Deleted            | What the server holds as deleted in the last 30 days, with days left.                               | Opened Recently Deleted                            |
| Off, just deleted something      | The deleted task or list is in Recently Deleted without a reload.                                   | Deleted, then opened Recently Deleted              |
| Off, Restore                     | The row leaves after the server answers; the task or list, with the tasks deleted with it, is back. | Pressed Restore                                    |
| Off, a refused Restore           | The row stays. Nothing else changes.                                                                | The server refused or could not be reached         |
| Off, a browser without IndexedDB | The app works. Appearance, contrast, "show completed" and the open list are kept across reloads.    | Private browsing, blocked site data, or no support |

Built as planned. No new copy.

## Verification Steps

**Associated E2E tests:**

- `e2e/online_mode.e2e.spec.ts`:
  - "a user sees no Sync controls, and a link to Sync opens their list instead"
  - "a user picks Dark and opens a list, and both are kept after reloading" (in a browser without IndexedDB)
- `e2e/recently_deleted.e2e.spec.ts`:
  - "a user deletes a task, finds it in Recently Deleted, and restores it"
  - "a user restores a deleted list and its tasks come back"

**Manual verification**

_Setup / Preconditions_ — `pnpm install && pnpm verify:prepare && docker compose up --build`.

_Steps_

1. With Offline Mode on: the header shows the sync control, the navigation shows Sync, and `/sync` opens the Sync destination.
2. Turn Offline Mode off in Settings. There is no sync control and no Sync item, and typing `localhost:5173/sync` opens the list.
3. Delete a task, then open Recently Deleted: it is there. Restore it: it leaves Recently Deleted and is back in its list.
4. Delete a list with its items and restore it: the list and its tasks come back.
5. In a browser where IndexedDB is unavailable (or with site data blocked), with Offline Mode off: pick Dark, open a list, reload. Both are kept.

_Expectation_ — with Offline Mode off, no screen shows sync-only controls or depends on IndexedDB, and Recently Deleted restores through the server.

## Affected Components

- `components/web_client`:
  - `src/App.tsx`: gates the sync control and the Sync destination on Offline Mode; replaces `/sync` with the list when off
  - `src/hooks/usePathname.ts`, `src/hooks/useDestination.ts`: `navigate` and `goTo` take `{ replace }`
  - `src/components/TaskList/TaskList.tsx`: reads the write ceiling only with Offline Mode on
  - `src/components/HeaderSyncStatus/` (new), `src/components/SyncDestination/` (new): own the IndexedDB-reading sync hooks, mounted only with Offline Mode on
  - `src/components/AppShell/AppShell.tsx`, `SidebarNav/SidebarNav.tsx`: `showSync`
  - `src/sync/page-triggers.ts`: `isOfflineMode`, read when each event fires
  - `src/hooks/useRecentlyDeleted.ts` (seam), `.sync.ts`, `.api.ts`, `.items.ts` (new)
  - `src/hooks/query-keys.ts` (new): the online query keys
  - `src/hooks/useLists.api.ts`, `src/hooks/useTasks.api.ts`: a delete refreshes Recently Deleted
  - `src/preferences/deviceStore.ts` (new): `readDeviceValue`, `writeDeviceValue`
  - `src/preferences/appearance.ts`, `contrast.ts`, `completedVisibility.ts`, `src/hooks/useActiveList.ts`: read and write through the device store
  - `src/hooks/online-path.stub.ts`: deleted
- `e2e`: `online_mode.e2e.spec.ts`, `recently_deleted.e2e.spec.ts`, `settings.e2e.spec.ts` (waits for sending to finish before reloading)

## Design Decisions

- **S4-1 — Recently Deleted gets the seam shape of Lists and Tasks:** `useRecentlyDeleted.ts` (types + seam), `.sync.ts` (the previous code, unchanged), `.api.ts` (new), and the pure item rules in `.items.ts`, shared by both.
- **S4-2 — The API path reads Recently Deleted only from `GET /deleted`.** A restore waits for the server, then re-reads Recently Deleted, Lists and Tasks whatever the answer. A delete on this path re-reads Recently Deleted. The query keys live in `hooks/query-keys.ts`, so no API-path hook imports another.
- **S4-3 — Sync-only UI is hidden, not disabled,** with Offline Mode off. Their IndexedDB reads moved into `HeaderSyncStatus` and `SyncDestination`, which mount only with Offline Mode on (Premise 3). `SyncDestination` stays mounted with Offline Mode on, so the sync path keeps loading its records before the user opens Sync.
- **S4-4 — Page sync triggers read Offline Mode when each event fires,** from `localStorage`, with no React wiring. The service worker's background sync is unchanged: it cannot read `localStorage`, and only sync-path writes register it.
- **S4-5 — The fallback covers every device-local value the API path reads:** appearance and contrast (Decision 13), plus "show completed" per list and the open list. Stale-write records stay IndexedDB-only, as only the sync path has them. Extends Decision 13; confirmed by the operator at plan review.
- **S4-6 — IndexedDB first, `localStorage` only when IndexedDB cannot be opened,** per call, under `psykl:{key}` as JSON. Nothing migrates between them.
- **S4-7 — `online-path.stub.ts` is deleted:** restore was its last caller.
- **Process:** DevTask PRs stacked as drafts (DevTask 12 on 11, 13 on 12).
- **Final review fixes** (a separate reviewer read the whole branch: one Important finding, re-grading raised one more):
  - `TaskList` still read the sync queue with Offline Mode off. A device that switched off with 100 changes queued could not add a task, and a browser without IndexedDB logged errors. `TaskList` now reads the queue only with Offline Mode on.
  - The `/sync` redirect added a history entry, so Back returned to `/sync` and was sent to the list again. It now replaces the entry (`goTo(…, { replace: true })`).
- **Known gaps:**
  - Restoring a list stops at the first of its tasks the server refuses; the rest must be restored one by one. The screen still matches the server.
  - A refused restore says nothing, on either path, and a double tap sends two restores.
  - A refused rename, complete or delete still says nothing with Offline Mode off; only capture tells the user.
  - Turning Offline Mode on in a browser without IndexedDB breaks the sync path. The switch is not disabled there.
  - A background sync the service worker registered before switching off may still send queued changes while off.
  - Reloading while the switch still reads "Sending changes made on this device…" keeps Offline Mode on: the choice is saved only once sending finishes (Spec 3 behaviour; its E2E test now waits for it).

## Architecture Decisions (ADR)

- [ADR-OOM-005](../ARCHITECTURE.md): Device-Local Values Fall Back to `localStorage`.

## Change Log

| Date       | PR                                                       | Summary                                                                          |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 2026-11-17 | [#159](https://github.com/jonpham/PSYKL-System/pull/159) | DevTask 11: sync controls hidden and page sync idle with Offline Mode off        |
| 2026-11-17 | [#160](https://github.com/jonpham/PSYKL-System/pull/160) | DevTask 12: Recently Deleted works with Offline Mode off                         |
| 2026-11-17 | [#161](https://github.com/jonpham/PSYKL-System/pull/161) | DevTask 13: preferences and the open list work without IndexedDB; Spec close-out |
