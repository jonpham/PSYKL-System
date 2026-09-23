# Implementation Notes — Select and edit multiple list items

> Lightweight feature workflow, `target = production`. **Data/API line is NOT empty — see Backend change.**

## Backend change — settled (operator decision, 2026-09-22)

**This iteration makes no backend change.** Hand ordering is held in **local React state** in the list view so the operator can try the interaction and refine the UX before any contract is written. A reload falls back to today's `created_at` order; that is intended, not a defect.

Batch complete, move, and delete are **not** deferred — they need no backend work and go through the real offline-first paths: `TaskPatchInputSchema` already accepts `completed_at` and `list_id`, and the sync queue already carries `patch`/`delete` per task.

Once the UX is approved, `Task.position` lands as its own vertical slice **using the same pattern as List ordering**: `tasks.position` as `text` (fractional index, `COLLATE "C"`), the field added to `TaskSchema` / `TaskInputSchema` / `TaskPatchInputSchema`, one Drizzle migration, the IndexedDB record, and a task-side twin of `useLists.positions.ts`. Precedent: `packages/shared-types/src/schemas/list.ts`, `components/service-task/src/db/schema/list.ts`, `components/web_client/src/hooks/useLists.positions.ts`. That slice carries the sync and service-model work and the full test pyramid with it.

## First slice

Selection mode on the list view — enter from the menu, select rows, batch **delete** — proving the mode switch, the pooled selection, the centred action bar, and one batch mutation path end to end. Complete, move drawer, and re-order follow as subsequent slices on the same branch.

## Files

- `components/web_client/src/components/TaskList/TaskList.tsx` — owns selection state, renders the action bar in place of (+)
- `components/web_client/src/components/TaskList/SelectionBar/` — new: centred floating glyph bar (complete / move / delete)
- `components/web_client/src/components/TaskList/MoveToListDrawer/` — new: from-bottom drawer, destinations from `useLists()` minus the active list
- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` + `task-row.css` — selection presentation, drag handle, non-tappable title, completed mark as filled disc
- `components/web_client/src/components/TaskList/sortTasks.ts` — apply the session's hand order over the `created_at` order; unknown ids keep today's placement
- `components/web_client/src/components/ListMenu/ListMenu.tsx` — "Select Items" item
- `components/web_client/src/App.tsx` — header ✓ replaces ⋯ while selection mode is on (shell owns `headerAction`)
- No new hook file: batch actions reuse `useTasks()`'s existing `patchTask` / `deleteTask` one task at a time, so every action inherits the offline queue.
- Deferred to the post-approval slice: `packages/shared-types/src/schemas/task.ts`, `components/service-task/src/db/schema/task.ts` (+ migration), `components/service-task/src/task/task.service.ts`, `components/web_client/src/db/idb.types.ts`.

Production behaviour source files stay at or under the ≤10 limit for this PR because the persistence files are deferred.

## Tests

Per the operator's iteration rule for this change, the test floor is **temporarily lowered**: unit tests only (TDD, failing first) during implementation — selection reducer/helpers, `sortTasks` with positions, `TaskRow` selection presentation, drawer destination filtering. Static analysis (lint, format, typecheck) is not reduced.

After operator UX approval on the local deployment, restore the full floor in the same branch: Storybook component stories with play functions for selection mode, the action bar, and the move drawer, plus E2E specs in `e2e/task_list.e2e.spec.ts` (or a new `e2e/task_selection.e2e.spec.ts`) titled from the acceptance checks above.

## Evidence

Local screenshots at 390px and desktop, gitignored: normal list, selection mode empty, two selected with the bar, move drawer open, mid-drag. Deleted at close-out.

## Open questions

- Does batch **complete** also un-complete an already-completed selected row, or is ● complete-only? (Assumed complete-only.)
- Should the move drawer allow one destination or stay open for repeated moves? (Assumed one destination, ✓ commits.)
