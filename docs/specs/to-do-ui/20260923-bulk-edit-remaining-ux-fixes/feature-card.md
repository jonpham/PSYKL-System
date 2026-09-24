# Bulk edit — remaining UX fixes

> Lightweight feature workflow, `target = production`, Standard Lane. Issue [#138](https://github.com/jonpham/PSYKL-System/issues/138).
> Follows up [#126](https://github.com/jonpham/PSYKL-System/issues/126) ([feature doc](../../../features/%5B20260923%5DGH126_to-do-ui-task-selection-and-batch-editing.md)).

## User

Someone tidying a list: they have pooled several tasks in selection mode, or are about to delete a list.

## Problem

Three things the shipped surface gets wrong. Bulk completion only ever marks tasks complete — a pooled completed task is silently skipped, so there is no way to un-complete in bulk. And the two destructive confirmations disagree with each other: "Delete List" signals its armed second press with nothing but a `?`, while the selection bar's trash floods the whole button with `--destructive`.

## Outcome

One press flips the completion state of every pooled task individually. Both destructive controls arm the same way: red at rest, a red outline when armed.

## Scope

`SelectionBar` (toggle semantics, label, glyph, armed ring), `useTaskSelection.completeSelected` → `toggleSelectedCompletion`, `ListMenu` armed border. CSS in both stylesheets.

## Not now

No undo for a bulk toggle. No tri-state "all complete" indicator on the bar. No change to single-row completion, or to the delete flow's two-press count.

## Done when

A pool of mixed tasks flips each row's state on one press; both armed destructive controls show a red outline and nothing else changes colour.

## Verdict

Shipped. All three defects fixed plus cascade-aware Recently Deleted; no schema or API change was needed. Built in two slices (selection bar, then list deletion) on one branch.
