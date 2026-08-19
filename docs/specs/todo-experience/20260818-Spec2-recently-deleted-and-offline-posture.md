---
status: TODO
issue: P2
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 2
devtasks_total: 4
devtasks_complete: 0
honors_decisions:
  - offline-posture-deletes-are-moves
  - offline-posture-thresholds
  - offline-posture-no-foreign-keys
---

# Recently Deleted + Offline Posture — Implementation Spec

> **Outline.** DevTask boundaries, files, and tests are settled; per-Step TDD detail is written when this Spec starts, against the interfaces Spec 1 actually shipped.

**Date:** 2026-08-18
**Initiative:** `todo-experience`
**Spec:** 2/7
**Spec User Story:** _As the operator, I can undo any deletion for 30 days, and the app tells me plainly when I have been offline too long, so that I never silently lose work._
**Time-box:** ~3 days human / ~1 Claude Code session
**Reads from:** [`DESIGN.md`](../../initiatives/todo-experience/DESIGN.md) → Offline Posture (LOCKED).

---

## Overview

Implements the offline posture the engineering review locked: deletes stop being destructive, and offline stops being unbounded.

Two halves:

1. **Recently Deleted.** A delete on the client is a _move_, not a destroy. The server hard-deletes only what has sat untouched for 30 days. This replaces the cascading list delete that would have queued one operation per task.
2. **Offline pressure.** A banner at 25 unsynced changes, a hard write ceiling at 100.

Components: `components/service-task`, `components/web_client`, `packages/shared-types`.

---

## Data Model

No new tables. `tasks.deleted_at` and `lists.deleted_at` already exist as tombstones (ADR-M2-004) — Recently Deleted is a _read_ over rows carrying a non-null `deleted_at`, not a new store.

Adds one server-side scheduled purge:

```sql
DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
DELETE FROM lists WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
```

**Restore** clears `deleted_at` and bumps `updated_at`, so it reconciles under Last-Write-Wins like any other patch.

---

## API

```
GET    /deleted                 → { lists: List[], tasks: Task[] }  (deleted_at not null, within 30d)
POST   /lists/{id}/restore      → 200 + List   Body: { updated_at }
POST   /tasks/{id}/restore      → 200 + Task   Body: { updated_at }
```

The purge runs as a NestJS scheduled job, not an endpoint.

---

## DevTasks

| #   | Title                                   | Branch                                            | Files | Depends on       |
| --- | --------------------------------------- | ------------------------------------------------- | ----- | ---------------- |
| 7   | Restore endpoints + 30-day purge job    | `feat/todo-experience-s2-dt7-restore-and-purge`   | ~5    | Spec 1 DevTask 3 |
| 8   | Orphan sweep heals dangling `list_id`   | `feat/todo-experience-s2-dt8-orphan-sweep`        | ~3    | DevTask 7        |
| 9   | Recently Deleted screen + restore UI    | `feat/todo-experience-s2-dt9-recently-deleted-ui` | ~5    | DevTask 7        |
| 10  | Offline pressure banner + write ceiling | `feat/todo-experience-s2-dt10-offline-pressure`   | ~4    | Spec 1 DevTask 1 |

### DevTask 7 — Restore endpoints + purge

Adds `restore` to `ListService` and `TaskService`, two controller routes, and a `PurgeService` on a daily schedule. The purge test controls the clock rather than waiting.

**Key test:** `components/service-task/tests/integration/recently-deleted-purge.integration.test.ts` — a row deleted 31 days ago is purged; one deleted 29 days ago is not; a row _restored_ on day 29 is never purged.

### DevTask 8 — Orphan sweep

A task whose `list_id` matches no live list is reassigned to the default list on read. Runs server-side in `listTasks`, so it heals without a background job.

**Key test:** `task-orphan-sweep.integration.test.ts` — a task pointing at a deleted list surfaces in the default list rather than vanishing.

### DevTask 9 — Recently Deleted UI

New `RecentlyDeleted/` component tree, reachable from the list overflow menu. Rows show remaining days in the metadata column (`28d`). Restore returns an item to its original list, or to the default list if that list is itself deleted.

**Key tests:** Storybook play function for restore; `e2e/recently_deleted.e2e.spec.ts`.

### DevTask 10 — Offline pressure

New `useSyncPressure()` hook counting `sync_queue` depth. Banner above the capture field at 25. At 100 the capture field disables and mutations are refused with `Reconnect to keep adding.`

**Key test:** `e2e/offline_pressure.e2e.spec.ts` — this behavior only exists at the E2E layer, since it depends on real queue depth and real offline state.

---

## Test Plan

- **Unit:** purge boundary arithmetic; `useSyncPressure` threshold transitions at 24/25/99/100.
- **Integration:** purge with a controlled clock; restore clears the tombstone; orphan sweep.
- **Component:** restore route contract incl. `user_id` default-deny; Storybook play function for the Recently Deleted list.
- **E2E:** `recently_deleted.e2e.spec.ts`, `offline_pressure.e2e.spec.ts`.

New user stories to add to `UX.md` § 5 are already written there under Spec 1 and Spec 2 headings.

---

## Open Questions / Risks

- **The purge is destructive and scheduled.** It needs a dry-run mode and a log line per purged row before it runs against robin.
- **Clock control in tests.** `service-task` has no time-mocking helper yet; DevTask 7 introduces one and later Specs reuse it.
- **The 25/100 thresholds are guesses.** Premise P3 says live with them and change them if real use disagrees.

## Affected by / Depends on

- **Depends on:** Spec 1 (List entity, generalized queue).
- **Blocks:** nothing. Specs 3-7 are independent of this one.
