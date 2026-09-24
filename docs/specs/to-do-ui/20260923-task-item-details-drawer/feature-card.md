# Task Item Details Drawer

> Lightweight feature workflow — `target = production`, Standard Lane. Issue [#127](https://github.com/jonpham/PSYKL-System/issues/127).
> Follows [`20260923-…-bulk-edit-and-list-deletion-fixes`](../../../features/%5B20260923%5DGH138_to-do-ui-bulk-edit-and-list-deletion-fixes.md), which left single-item editing untouched.

## User

Every PWA user, on a phone, looking at one task in a list and wanting to know when it happened or to get rid of it.

## Problem

Today a task's timestamps are invisible, a single task can only be deleted by entering selection mode for a batch of one, and tapping a title swaps the row for a single-line `<input>` — a wrapped two-line title snaps to one line and the row jumps height under the user's finger.

## Outcome

Tapping a task title still focuses it for inline editing, and now also reveals an **(i)** button in the row's trailing slot — the same position the drag handle holds in selection mode. Tapping **(i)** opens a Task Item Drawer holding an editable title, the task's Created / Last updated / Completed timestamps, and a delete action.

## Scope

- Trailing **(i)** affordance on the focused row, non-selection mode only.
- Inline title editing that keeps the row's shape: the edit field wraps and grows exactly as the rendered title does.
- Task Item Drawer: close (✕) + confirm (✓) header matching `MoveToListDrawer`, editable title, three read-only timestamps, centred Delete at the bottom that **arms on the first press and deletes on the second**, exactly as the selection bar's batch delete does.
- Both this drawer and `MoveToListDrawer` become viewport-centred modals at the shell's `768px` desktop breakpoint.

## Not now

No new `Task` properties, no notes/due-date/priority fields, no swipe gestures, and no change to selection-mode batch behaviour.

## Done when

A user can tap one task, read its three timestamps, rename it, or delete it — without ever entering selection mode — and the same drawer reads as a centred modal on a desktop-width window.

## Verdict

{Filled at close-out.}
