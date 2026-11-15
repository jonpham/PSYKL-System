---
status: DONE
issue: GH144
branches:
  - spec/online-offline-modes-s3-online-only-lists-tasks # Spec integration branch
  - feat/online-offline-modes-s3-dt8-online-lists
  - feat/online-offline-modes-s3-dt9-online-tasks
  - feat/online-offline-modes-s3-dt10-flush-on-switch-off
prs:
  - https://github.com/jonpham/PSYKL-System/pull/154 # Spec integration PR
  - https://github.com/jonpham/PSYKL-System/pull/155
  - https://github.com/jonpham/PSYKL-System/pull/156
completed_at: # set when the Spec integration PR merges to main
created_at: 2026-11-14
initiative: online-offline-modes
spec: docs/specs/online-offline-modes/20261114-Spec3-online-only-lists-tasks.md (deleted at close-out; this doc is the record)
---

# Online-Only Lists and Tasks

> Glossary:
>
> - PWA = Progressive Web App. IDB = IndexedDB, the browser's local database.
> - Offline Mode on = the sync path (IDB + sync queue). Offline Mode off = the API path (server + an in-memory cache).
> - TanStack Query = `@tanstack/react-query`, an in-memory server-state cache for React. `QueryClient` = one such cache.
> - Flush = one replay of the sync queue that sends every queued write, retry delays aside.

## User Story

As a PSYKL user, I can turn Offline Mode off and work straight against the server: my lists and tasks are what the server holds, every change I make is saved there before I see it, and nothing I changed on this device is left behind when I switch.

## Features

1. [#144](https://github.com/jonpham/PSYKL-System/issues/144): **Lists work with Offline Mode off.** The lists are the server's, in position order. Adding a list sends no position, and the server appends it (Decision 10). Renaming, re-ordering and deleting work, and "Tasks" and the last remaining list are never offered for deletion (Decision 16).
2. **Tasks work with Offline Mode off.** Each list shows its own open tasks, newest first, with list-less tasks under "Tasks". A capture goes to the list that was open when it was typed, or to "Tasks" when none was chosen. Completing and deleting work. A failed first load reads "Failed to load tasks".
3. **Each change shows once the server has saved it.** There are no optimistic writes on this path (S3-2). A refused change never appears, and a refused capture keeps its text with the existing "That task could not be saved" message.
4. **Turning Offline Mode off sends this device's waiting changes first** (Decision 11). The switch is disabled and reads "Sending changes made on this device…" for at most 5 seconds. Whatever isn't sent stays queued for the next time Offline Mode is on.
5. **The switch shows as available.** The muted "not yet available" color from Spec 1 is gone (Decision 12).

## Visual Record

**Settings → Data, switch available.** The track uses the accent color when on.

```text
┌ Settings ─────────────────────────────────┐
│ Data                                      │
│ Offline Mode                  ( ░░░░●)    │  ← accent track when on
│ Keep a copy on this device and sync       │
│ when online.                              │
└───────────────────────────────────────────┘
```

**Settings → Data, while turning Offline Mode off.** Shown only while changes are still being sent, for up to 5 seconds.

```text
┌ Settings ─────────────────────────────────┐
│ Data                                      │
│ Offline Mode                  ( ●░░░░)    │  ← knob moved; disabled, aria-busy
│ Sending changes made on this device…      │  ← replaces the description
└───────────────────────────────────────────┘
```

| State                        | What the user sees                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| On (default)                 | Accent track, knob right. The app behaves as before.                                        |
| Turning off, changes waiting | Knob left, switch disabled at 60% opacity, "Sending changes made on this device…".          |
| Off                          | Knob left. Lists and tasks are the server's; each change shows after the server answers.    |
| Off, a write fails           | The change does not appear; a failed capture keeps its text and says it could not be saved. |
| Off, server unreachable      | "Failed to load tasks" where the list would be.                                             |
| Turning on                   | Flips at once, with no sending step.                                                        |

Built as planned.

## Verification Steps

**Associated E2E tests:**

- `e2e/online_mode.e2e.spec.ts`:
  - "a user adds a list, finds it saved on the server, and still sees it after reloading"
  - "a user can delete a list they made, but is never offered to delete Tasks"
  - "a user adds a task, finds it saved on the server, and still sees it after reloading"
  - "a task added to another list stays in that list"
- `e2e/settings.e2e.spec.ts`:
  - "a user sees Offline Mode on by default"
  - "a change that could not be sent yet reaches the server when the user turns Offline Mode off"

**Manual verification**

_Setup / Preconditions_ — `pnpm install && pnpm verify:prepare && docker compose up --build`.

_Steps_

1. Open `http://localhost:5173/settings`. The switch is on, in the accent color.
2. Add a task to "Tasks". In DevTools → Network, set **Offline**, add a second task, then set **No throttling**.
3. Turn Offline Mode off. "Sending changes made on this device…" shows briefly, then the switch is off.
4. `curl -s localhost:3000/tasks -H 'X-User-Id: local'` lists both tasks.
5. Add, rename, re-order and delete a list; complete and delete a task. Each change shows after the server answers and survives a reload.

_Expectation_ — with Offline Mode off the app shows and changes only what the server holds, and switching off leaves nothing behind that could be sent.

## Affected Components

- `components/web_client`:
  - `src/hooks/useLists.api.ts`, `src/hooks/useTasks.api.ts`: the TanStack Query implementations, in place of the Spec 1 stubs
  - `src/components/SettingsProvider/SettingsProvider.tsx`: one `QueryClient` per Offline Mode off session; flushes before switching off
  - `src/services/flush-sync-queue.ts` (new): `flushSyncQueue()`, capped at 5 seconds, never rejects
  - `src/sync/replay.ts`: `ReplayOptions.ignoreBackoff`
  - `src/hooks/useUserSettings.ts`: `sendingChanges`
  - `src/components/SettingsView/`: the sending state; `data-available` and its muted color removed
  - `src/hooks/online-path.stub.ts`: now only `notImplementedOnline`, for Recently Deleted's restore until Spec 4
  - New dependency: `@tanstack/react-query` 5
- `e2e`: `online_mode.e2e.spec.ts` (new), `settings.e2e.spec.ts`, `helpers/task-api.ts` (`fetchServerLists`), `helpers/multi-device.ts` (`list_id` on the task row)

## Design Decisions

- **S3-1 — One `QueryClient` per Offline Mode off session**, created in `SettingsProvider` inside the keyed subtree. The remount drops it, so turning the mode off again starts from the server.
- **S3-2 — No optimistic writes on the API path.** A write waits for the server, then puts the server's answer in the cache. A refused change never appears. The cost is one round trip before a change shows.
- **S3-3 — `moveList` computes the key between its two neighbours** with `generateKeyBetween`, without respacing. Neighbours out of order make the move reject, and `ListsPage` logs it.
- **S3-4 — A list-less capture lands in "Tasks" by `DEFAULT_LIST_ID`**, and list-less tasks show under "Tasks", with no IndexedDB read.
- **S3-5 — Decision 11's flush-failure behaviour is confirmed, with a 5-second cap.** Turning off runs `replay({ ignoreBackoff: true })`, because a write that failed recently would otherwise wait out its retry delay and be skipped.
- **S3-6 — While sending, the switch shows its new position, is disabled and `aria-busy`.** Turning on sends nothing.
- **S3-7 — `notImplementedOnline` stays** for Recently Deleted's restore, which Spec 4 owns.
- **Process:** DevTask PRs stacked as drafts (DevTask 9 on 8, 10 on 9), each depending on the one before.
- **Known gaps (Spec 4):**
  - Page sync triggers still wake `replay()` with Offline Mode off, so a write left queued by a failed flush may still be sent while off.
  - The active list still lives in IDB `sync_meta`, so Offline Mode off needs a browser with IDB.
  - Recently Deleted's restore still refuses with Offline Mode off.
  - Other tabs and devices show on the API path when the window regains focus, not instantly.

## Architecture Decisions (ADR)

- [ADR-OOM-004](../ARCHITECTURE.md): The Online Path Reads Through TanStack Query and Writes Without Optimism.

## Change Log

| Date       | PR                                                       | Summary                                                                                       |
| ---------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 2026-11-14 | [#155](https://github.com/jonpham/PSYKL-System/pull/155) | DevTask 8: lists work with Offline Mode off                                                   |
| 2026-11-14 | [#156](https://github.com/jonpham/PSYKL-System/pull/156) | DevTask 9: tasks work with Offline Mode off                                                   |
| 2026-11-14 | DevTask 10                                               | Turning Offline Mode off sends waiting changes; the switch shows as available; Spec close-out |
