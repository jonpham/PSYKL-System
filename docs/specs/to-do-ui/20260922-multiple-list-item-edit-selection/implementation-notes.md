# Implementation Notes — Select and edit multiple list items

> Lightweight feature workflow, `target = production`. **Data/API line is NOT empty — see Backend change.**

## Backend change (operator decision required before implementation)

Manual re-ordering has no persistence today: `Task` has no `position`, and `sortTasks.ts` derives order from `created_at`. Batch complete, move, and delete need **no** backend work — `TaskPatchInputSchema` already accepts `completed_at` and `list_id`, and the offline queue already carries `patch`/`delete` per task.

Recommended: mirror the shipped **List** ordering pattern exactly — `tasks.position` as `text` (fractional index, `COLLATE "C"`), `position` added to `TaskSchema` / `TaskInputSchema` / `TaskPatchInputSchema`, one Drizzle migration, and a task-side twin of `useLists.positions.ts`. Precedent: `packages/shared-types/src/schemas/list.ts`, `components/service-task/src/db/schema/list.ts`, `components/web_client/src/hooks/useLists.positions.ts`. Nullable `position` keeps existing rows valid; a null sorts by `created_at` as today.

Alternative if the operator declines: ship selection + complete/move/delete now and split re-ordering into its own change (escalated to the production workflow for the migration).

## First slice

Selection mode on the list view — enter from the menu, select rows, batch **delete** — proving the mode switch, the pooled selection, the centred action bar, and one batch mutation path end to end. Complete, move drawer, and re-order follow as subsequent slices on the same branch.

## Files

- `components/web_client/src/components/TaskList/TaskList.tsx` — owns selection state, renders the action bar in place of (+)
- `components/web_client/src/components/TaskList/SelectionBar/` — new: centred floating glyph bar (complete / move / delete)
- `components/web_client/src/components/TaskList/MoveToListDrawer/` — new: from-bottom drawer, destinations from `useLists()` minus the active list
- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` + `task-row.css` — selection presentation, drag handle, non-tappable title, completed mark as filled disc
- `components/web_client/src/components/TaskList/sortTasks.ts` — order by `position` when present, fall back to `created_at`
- `components/web_client/src/components/ListMenu/ListMenu.tsx` — "Select Items" item
- `components/web_client/src/App.tsx` — header ✓ replaces ⋯ while selection mode is on (shell owns `headerAction`)
- `components/web_client/src/hooks/useTasks.ts` (+ new `useTasks.positions.ts`) — batch mutation helper, task position keys
- Backend, only if the operator approves the position field: `packages/shared-types/src/schemas/task.ts`, `components/service-task/src/db/schema/task.ts`, `components/service-task/src/task/task.service.ts`, one generated migration, `components/web_client/src/db/idb.types.ts`

Production behaviour source-file count stays at or under the ≤10 DevTask limit only if re-ordering is a separate slice; if the full scope lands in one PR it will exceed it and must be split into two PRs.

## Tests

Per the operator's iteration rule for this change, the test floor is **temporarily lowered**: unit tests only (TDD, failing first) during implementation — selection reducer/helpers, `sortTasks` with positions, `TaskRow` selection presentation, drawer destination filtering. Static analysis (lint, format, typecheck) is not reduced.

After operator UX approval on the local deployment, restore the full floor in the same branch: Storybook component stories with play functions for selection mode, the action bar, and the move drawer, plus E2E specs in `e2e/task_list.e2e.spec.ts` (or a new `e2e/task_selection.e2e.spec.ts`) titled from the acceptance checks above.

## Evidence

Local screenshots at 390px and desktop, gitignored: normal list, selection mode empty, two selected with the bar, move drawer open, mid-drag. Deleted at close-out.

## Open questions

- Does batch **complete** also un-complete an already-completed selected row, or is ● complete-only? (Assumed complete-only.)
- Should the move drawer allow one destination or stay open for repeated moves? (Assumed one destination, ✓ commits.)
