---
status: DONE
issue: P2
branches:
  - feat/todo-experience-s2-dt7-restore-and-deleted
  - feat/todo-experience-s2-dt8-purge-job
  - feat/todo-experience-s2-dt9-orphan-sweep
  - feat/todo-experience-s2-dt10-restore-plumbing
  - feat/todo-experience-s2-dt11-recently-deleted-ui
  - feat/todo-experience-s2-dt12-offline-pressure
  - spec/todo-experience-s2-recently-deleted-and-offline-posture
prs:
  - https://github.com/jonpham/PSYKL-System/pull/76
  - https://github.com/jonpham/PSYKL-System/pull/77
  - https://github.com/jonpham/PSYKL-System/pull/78
  - https://github.com/jonpham/PSYKL-System/pull/79
  - https://github.com/jonpham/PSYKL-System/pull/80
  - https://github.com/jonpham/PSYKL-System/pull/82
  - https://github.com/jonpham/PSYKL-System/pull/75
completed_at: 2026-09-15
created_at: 2026-08-18
initiative: todo-experience
spec: (deleted at close-out; was docs/specs/todo-experience/20260818-Spec2-recently-deleted-and-offline-posture.md)
---

# `todo-experience` Spec 2 — Recently Deleted + Offline Posture

> Filename convention: `[{YYYYMMDD}]{ISSUE_REF}_{feature-slug}.md` — see [`AGENTS.md`](../../AGENTS.md#naming-convention). Written by `superpowers:writing-plans` (DevTasks 7-12) and `superpowers:executing-plans`.

## User Story

As the operator, I can undo any deletion for 30 days, and the app tells me plainly when I have been offline too long, so that I never silently lose work.

## Features

1. A delete on the client is a _move_, not a destroy — deleted Tasks and Lists surface in a "Recently Deleted" screen for 30 days, with a days-remaining count, and can be restored.
2. The server hard-deletes tombstoned rows only after they've sat untouched for 30 days, via a daily scheduled purge job.
3. Dangling `Task.list_id` references (a List deleted with Tasks still pointing at it) self-heal on read via an orphan sweep, reassigning to the account's default list — no foreign key is enforced, by design (offline clients can create a Task inside a List before that List has synced).
4. An offline-pressure banner appears once 25 local changes are queued but unsynced; new writes are refused past a hard ceiling of 100 queued changes, with the capture field disabled and reading "Reconnect to keep adding."

## Verification Steps

**Associated E2E tests:** `e2e/recently_deleted.e2e.spec.ts`, `e2e/offline_pressure.e2e.spec.ts`

**Manual verification**

_Setup / Preconditions_ — the app running against the real stack (`docker compose up --build -d`), at least one existing Task.

_Steps_

1. Delete a Task (two-tap confirm). Open Recently Deleted — the Task appears with a days-remaining count.
2. Restore it. It disappears from Recently Deleted and reappears in the active list.
3. Delete a List that still has Tasks in it. The delete is a single move (not one queued operation per Task); the List appears in Recently Deleted.
4. Go offline (DevTools → Network → Offline) and queue 25+ changes (e.g., repeated edits). A banner reading "`<n>` changes waiting to sync. Reconnect to save them." appears above the capture field.
5. Keep queuing until 100 changes are queued. The capture field disables and reads "Reconnect to keep adding."; existing-row writes are refused with the same underlying error.

_Expectation_ — deletes are always recoverable for 30 days; the offline posture is visible and self-explanatory rather than a silent, unbounded queue.

## Affected Components

- `components/service-task` — `DeletedController` (`GET /deleted`), `POST /tasks/{id}/restore` and `POST /lists/{id}/restore`, `PurgeService` (scheduled 30-day hard delete), Task/List orphan-sweep healing on read.
- `components/web_client` — `SyncClient`/`ServiceClient` gain `list()`/`listPending()`/`restore()`; `RecentlyDeleted` screen + `useRecentlyDeleted` hook; `OutOfSyncBanner` + `useSyncDiscrepancy` hook; `sync/sync-discrepancy.ts` thresholds (`NAG_THRESHOLD = 25`, `WRITE_CEILING = 100`) and `SyncWriteCeilingError`, enforced at `sync-client.ts`'s `enqueueOptimistic` choke point (all Task/List mutations flow through it).
- `packages/shared-types` — `TaskRestoreInput`/`ListRestoreInput`/`DeletedResponse` schemas.

## Design Decisions

- **Deletes are moves, not destroys; purge is server-side and time-boxed at 30 days** (locks in `DESIGN.md` → Offline Posture decisions `offline-posture-deletes-are-moves` and `offline-posture-thresholds`).
- **No foreign key from `tasks.list_id` to `lists.id`** (`offline-posture-no-foreign-keys`) — an offline client can create a Task inside a List before that List has synced; integrity is healed by the orphan sweep rather than enforced by the schema.
- **`service-client-read-parity`** (narrow-scope re-open of ADR-TE-003, see ADR-TE-004 below): `SyncClient`/`ServiceClient` previously only exposed mutation methods plus a write-only `hydrate()`. Adding `useRecentlyDeleted.ts` as a third consumer needing local reads surfaced the gap; resolved by adding `list()` (local-first, hydrates at most once per page load) and `listPending()` to both layers, removing `hydrate()`/`absorb()` from the public interface.
- **Restore replayed from the offline sync queue reconciles against replay time, not original tap time.** `restoreTaskRemote`/`restoreListRemote` always send `new Date().toISOString()` at send time. Accepted as a narrow edge case (restore-then-offline-then-another-device-edits-same-item), not fixed by widening the interface.
- **Recently Deleted's entry point is a temporary button next to the list-switcher**, not the `⋯` overflow menu UX.md eventually specifies — that menu doesn't exist in the codebase yet and is unscoped, later-Spec work.
- **DevTask 12 (offline pressure) has no code dependency on DevTask 11 (Recently Deleted screen)** despite branching off its branch — an explicit, operator-confirmed sequencing exception to the normal "stack only on a real dependency" rule, done purely to avoid rebasing mid-review. The real dependency is Spec 1's sync-queue foundation.
- **Two real regressions were found and fixed via TDD/Storybook during implementation, not anticipated by the plan:** a shared-hydrate-promise race in `sync-client.ts` (concurrent `list()` callers could each attempt their own network hydrate); `useRecentlyDeleted.ts`'s `restore()` initially missing `enqueueWithReplay`, so it never triggered replay or notified `useTasks`'s subscribers.
- **A deeper, more consequential race was found post-merge via CI flakiness, not TDD:** `useTasks.sync.ts`'s `reloadSnapshot()` and `useLists.sync.ts`'s `reloadListsSnapshot()` — the module-level singletons every Task/List mutation across the whole app reloads through — had no guard against out-of-order concurrent calls. `enqueueWithReplay` fires its `notify()` callback twice per mutation (once immediately after enqueue, again after the fire-and-forget `replay()` settles) with no ordering guarantee, so an earlier call's stale result could resolve after a newer one and silently revert the shared snapshot. Fixed with a generation-counter guard (same pattern applied to `useRecentlyDeleted.ts`'s own per-instance reload). This was the actual root cause behind several CI-only `RecentlyDeleted` Storybook failures that looked at first like isolated timing flakes.
- **Test-hygiene fixes made along the way, generalizable beyond this Spec:** Storybook stories that intentionally leave a mutation queued (mocking a `500` response) must wait for the fire-and-forget replay attempt to actually settle (`attempts > 0`) before the play function returns — otherwise the attempt can land after the next story's `deleteDB()` reset and bleed state forward. The global `testing-library` `waitFor` timeout was raised from 1000ms to 5000ms in `.storybook/preview.ts` after it proved tight across multiple unrelated stories under CI's slower runner. A heavily-interactive Storybook harness (multiple hooks all subscribed to the same change notifications, all mounted together) should seed fixtures directly via `putTask()`/`putList()` rather than drive every setup step through the real UI, to keep unrelated concurrent-reload churn out of what the story is actually testing.

## Architecture Decisions (ADR)

- **ADR-TE-004** (`docs/ARCHITECTURE.md`): `SyncClient`/`ServiceClient` gain `list()`/`listPending()`, lose `hydrate()`/`absorb()` from their public interface. Narrow-scope re-open of ADR-TE-003, back-linked.

## Change Log

| Date       | PR                                                     | Summary                                                                                                                             |
| ---------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-08 | [#76](https://github.com/jonpham/PSYKL-System/pull/76) | DevTask 7 — Restore endpoints + `GET /deleted`                                                                                      |
| 2026-09-09 | [#77](https://github.com/jonpham/PSYKL-System/pull/77) | DevTask 8 — 30-day purge job                                                                                                        |
| 2026-09-10 | [#78](https://github.com/jonpham/PSYKL-System/pull/78) | DevTask 9 — Orphan sweep heals dangling `list_id`                                                                                   |
| 2026-09-15 | [#79](https://github.com/jonpham/PSYKL-System/pull/79) | DevTask 10 — Restore sync-queue plumbing                                                                                            |
| 2026-09-15 | [#80](https://github.com/jonpham/PSYKL-System/pull/80) | DevTask 11 — Recently Deleted screen + read/write abstraction parity (ADR-TE-004)                                                   |
| 2026-09-15 | [#82](https://github.com/jonpham/PSYKL-System/pull/82) | DevTask 12 — Offline pressure banner + write ceiling                                                                                |
| 2026-09-15 | [#75](https://github.com/jonpham/PSYKL-System/pull/75) | Spec integration to `main`; review feedback (naming, comment hygiene); two post-merge concurrency-race fixes found via CI flakiness |
