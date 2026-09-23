# Select and edit multiple list items

> Lightweight feature workflow, `target = production`, Standard Lane. Source: [#126](https://github.com/jonpham/PSYKL-System/issues/126).
> Initiative: `to-do-ui`. Status: awaiting operator review.

## User

A PWA user on a phone with a list that has grown past a handful of tasks, wanting to tidy it in one pass rather than row by row.

## Problem

Today a list row supports exactly two things: toggle complete, and tap the title to rename. Tasks cannot be re-ordered by hand (order is derived from `created_at` in `sortTasks.ts`), cannot be moved to another list, and can only be deleted one at a time through the row. Nothing in the list view operates on more than one task.

## Outcome

From the list options menu the user picks **Select Items** and enters a selection mode where tapping rows pools them into a batch, a floating action bar applies Complete / Move / Delete to the whole pool, and a drag handle re-orders open tasks by hand.

## Scope

Selection mode on the shipped list view: multi-select, batch complete, batch move via a from-bottom "Move to:" drawer, batch delete, manual drag re-order of open tasks, and the completed-row mark changing to a filled disc so a selected row's checkmark reads distinctly.

## Not now

No section headers, no select-all, no cross-list selection, no undo beyond the existing Recently Deleted recovery, and no re-ordering of completed tasks (they stay sorted by completion time).

## Done when

A user can enter selection mode, tick three tasks, delete or move them in one action, drag an open task to a new place, and leave selection mode with the header checkmark. Membership and completion survive a reload; **hand order does not yet** — ordering is React state until the UX is approved (operator decision, 2026-09-22), and the persisted fractional-index slice follows approval.

## Verdict

{Filled at close-out.}
