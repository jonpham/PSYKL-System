# Implementation Notes — Bulk edit and list deletion UX fixes

## First slice

Two slices, in this order, each green before the next:

1. **Selection bar** — `completeSelected` becomes `toggleSelectedCompletion` (drop the `completed_at === null` filter; send `completed_at: null` for rows that are already complete), and the armed trash swaps its fill for an inset ring. Self-contained and shippable on its own.
2. **List deletion** — `DeleteListDialog`, the two cascade modes, cascade-aware restore, and the Recently Deleted type indicators.

## Files

Client only.

- `TaskList/SelectionBar/SelectionBar.tsx`, `selection-bar.css` — label, semantics, armed ring
- `TaskList/useTaskSelection.ts` — `toggleSelectedCompletion` replaces `completeSelected`
- `TaskList/TaskList.tsx` — renamed prop wiring
- `ListMenu/ListMenu.tsx` — drop `confirmingDelete`; one press closes the sheet and asks the host to open the dialog
- `components/DeleteListDialog/` — new: `DeleteListDialog.tsx`, `delete-list-dialog.css`, `index.ts`
- `hooks/useListDeletion.ts` — new: composes `useLists` + `useTasks` to run each cascade
- `hooks/useRecentlyDeleted.ts` — group cascaded tasks under their list; restore the list as a unit
- `components/RecentlyDeleted/RecentlyDeleted.tsx`, `recently-deleted.css` — type glyph, `list · N items`
- `App.tsx` — mount the dialog beside `ListMenu` (`App.tsx:79`)

Larger than the ≤10-source-file cap in `AGENTS.md`, which by its own wording binds DevTask PRs; lightweight work has no DevTasks. Flagging rather than silently ignoring — the two slices are separable if the operator wants two PRs after all.

## Data / API

**No schema change and no new endpoint.** Every call already exists; both cascades are client-orchestrated batches, the same shape as `useTaskSelection`'s bulk delete. Three constraints found while reading the service:

- **Grouping is derived, not stored.** The client issues one `deleted_at` for the list and every task deleted with it, so a cascaded task is one whose `list_id` matches a tombstoned list _and_ whose `deleted_at` equals that list's. A stored `deleted_with_list` column would be exact but is a migration, i.e. an escalation — not worth it here.
  - Known edge: `deleteTask` clamps `deleted_at` through `clampFutureTimestamp` (`task.service.ts:82`) while `deleteList` does not (`list.service.ts:80`), so a client whose clock runs ahead of the server can desync the pair and leave a task ungrouped. It still appears in Recently Deleted on its own row and is still individually restorable, so the failure is cosmetic.
- **"Just the List" moves only live tasks.** `patchTask` sets `deletedAt: null` unconditionally (`task.service.ts:70`), so patching a tombstoned task's `list_id` would resurrect it. Tasks already deleted before the list keep pointing at the deleted list — and, having a different `deleted_at`, are correctly _not_ counted as cascaded.
- **Today's behaviour is already "Just the List", implicitly.** `task-orphan-sweep.ts:16` re-homes any task whose list is gone to the earliest-position live list. The explicit patch makes the move visible and immediate; the sweep stays as the backstop for rows that never synced.

## Tests

TDD ordering, full pyramid. No Integration layer: nothing in `service-task` changes.

- **Unit** — `useTaskSelection` inverting a mixed pool; `useListDeletion` issuing each cascade; the cascade-grouping helper extracted from `useRecentlyDeleted`; `DeleteListDialog` offering two choices for a populated list and one for an empty one
- **Component (Storybook)** — `SelectionBar` armed ring and toggle label; `ListMenu` press opening the dialog; `DeleteListDialog` all three choices; `RecentlyDeleted` type indicators and unit restore
- **E2E** — extend `e2e/task_selection.e2e.spec.ts` (bulk toggle), `e2e/list_options.e2e.spec.ts` (the three dialog choices), `e2e/recently_deleted.e2e.spec.ts` (unit restore, single cascaded task restored alone). Titles come from `acceptance-checks.md`.

## Evidence

Local screenshots at 390px and desktop: armed selection bar, the dialog over a populated and an empty list, Recently Deleted with a cascaded list. Into a gitignored `screenshots/`, deleted at close-out.

## Open questions

None blocking.
