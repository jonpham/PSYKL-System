---
status: DONE
issue: GH138
branches:
  - bug/138-remaining-issues-list-bulk-edit
prs:
  -  # filled in once the PR is opened
completed_at: 2026-09-23
created_at: 2026-09-23
initiative: to-do-ui
spec: none — lightweight feature workflow, `target = production` (artifact folder consolidated into this doc at close-out)
---

# Bulk edit and list deletion UX fixes

> Lightweight `target = production` change, Standard Lane, under [`docs/workflows/lightweight-feature-workflow.md`](../workflows/lightweight-feature-workflow.md). Source: [#138](https://github.com/jonpham/PSYKL-System/issues/138), raised by the operator against the shipped [#126](https://github.com/jonpham/PSYKL-System/issues/126) surface ([feature doc](%5B20260923%5DGH126_to-do-ui-task-selection-and-batch-editing.md)).

## User Story

As a PWA user tidying a list, I want to reopen several tasks at once, see plainly when a destructive action is armed, and be told what happens to a list's items before I delete it, so that batch editing is reversible in both directions and deleting a list is never a guess.

## Features

1. **Batch completion is a toggle, not a one-way mark** — one press flips each pooled task to its own other state, so a pool of finished tasks reopens and a mixed pool inverts. Previously a pooled task that was already complete was filtered out of the batch entirely: bulk un-complete was impossible, and pressing the action on a wholly-complete pool did nothing at all. The glyph is unchanged; the accessible name carries the direction (`Toggle completion of selected tasks`).
2. **The armed batch delete is a ring, not a fill** — arming outlines the trash icon with a 2px inset `--destructive` ring and leaves the glyph red, instead of flooding the button with destructive colour and inverting the glyph. The open-lid glyph and the disarm rules from #126 are unchanged.
3. **Deleting a list asks what happens to its items** — one press on `Delete List` closes the menu and opens a dialog naming the list and its item count, offering **Delete With Items**, **Delete Just the List**, and **Cancel**. It replaces a second press on the menu item whose only cue was a `?` appended to the label, and which said nothing about the tasks inside.
4. **An empty list is offered a single deletion** — with nothing inside, keeping the items and taking them along are the same outcome, so only **Delete List** / **Cancel** appear and the item language is dropped.
5. **Deleting with items is one undoable unit** — the list and its tasks are tombstoned with one shared `deleted_at`, and restoring the list from Recently Deleted brings those tasks back with it, in it.
6. **Deleting just the list keeps its items** — live tasks are moved to the default list (the earliest-position live list) before the list is tombstoned. This was already the effective behaviour, performed invisibly server-side by the orphan sweep; it is now an explicit, immediate, user-chosen move.
7. **Recently Deleted says what each row was** — a kind glyph plus `task`, or `list · N items` for a list deleted with its tasks. Cascaded tasks keep their own rows, so one task can still be rescued out of a list the user meant to delete; restored alone while its list is still deleted, it lands in the default list.

## Visual Record

> The shipped surfaces at ~390px (iPhone), carried from the planning `visual-artifact.md` and
> updated to what was built. See the note at the end for how the two differ.

### 1. Selection bar — completion action

| Pool              | Before                                         | After                                                 |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------- |
| All incomplete    | "Mark selected tasks complete" — completes all | "Toggle completion of selected tasks" — completes all |
| All complete      | **No-op**: every task is filtered out          | Un-completes all                                      |
| Mixed             | Completes the incomplete ones, skips the rest  | **Inverts each row independently**                    |
| Empty / in flight | Dimmed, disabled                               | Unchanged                                             |

The glyph is unchanged — the existing ring-and-filled-disc. Only the label and the semantics move.

### 2. Selection bar — delete, armed

```text
before                           after
┌──────────────────────────┐     ┌──────────────────────────┐
│   ( ● )   ( ⇥ )  ███████ │     │   ( ● )   ( ⇥ )  ((🗑))   │
└──────────────────────────┘     └──────────────────────────┘
  solid --destructive fill,        transparent; 2px inset
  glyph inverted to                --destructive ring around
  --text-on-accent                 the icon, glyph stays red
```

### 3. Delete List — a dialog replaces the second press

```text
before                                after
┌────────────────────────┐            ┌────────────────────────┐
│ Hide Completed         │            │ Hide Completed         │
│ Select Items           │            │ Select Items           │
│ Delete List?           │ ← 2nd      │ Delete List            │ ← one press,
└────────────────────────┘   press    └────────────────────────┘   sheet closes
  red text, `?` is the                       ↓
  only cue; tasks silently      ┌─────────────────────────────────┐
  re-homed, unannounced         │ Delete "Groceries"?             │
                                │ It still holds 4 items.         │
                                ├─────────────────────────────────┤
                                │ Delete With Items        (red)  │
                                │ Delete Just the List     (red)  │
                                │ Cancel                          │
                                └─────────────────────────────────┘
```

Cancel holds the initial focus and sits last, after both destructive options, so no keypress on a freshly-opened dialog destroys anything. Escape cancels.

### 4. Recently Deleted — what each row was

```text
before                             after
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ Groceries      30d [Restore] │   │ 📁 Groceries                 │
│ Milk           30d [Restore] │   │    list · 4 items 30d [Restore]│
│ Eggs           30d [Restore] │   ├──────────────────────────────┤
│ Weekly review  29d [Restore] │   │ ☑ Milk                       │
└──────────────────────────────┘   │    task          30d [Restore]│
  a list and its cascaded items    ├──────────────────────────────┤
  are indistinguishable rows       │ ☑ Eggs      task 30d [Restore]│
                                   ├──────────────────────────────┤
                                   │ ☑ Weekly review              │
                                   │    task          29d [Restore]│
                                   └──────────────────────────────┘
                                     every row says what it was; the
                                     list row restores as a unit
```

Restoring the list row brings the list and the four tasks deleted with it back together — the count on the row is what that press will return.

**How the shipped surface differs from the plan.** Two deliberate departures, both the operator's call:

- The plan first proposed a half-filled disc for the toggle glyph; the **existing** filled-disc glyph was kept instead, because a per-row inversion has no single direction to draw.
- The plan first gave `Delete List` a red armed border to match the selection bar's armed treatment. The dialog replaced that outright mid-plan, so the two destructive surfaces no longer share an armed language: the selection bar arms, list deletion asks.

## Verification Steps

**Associated E2E tests:**

- `e2e/task_batch_completion.e2e.spec.ts` — bulk complete, bulk reopen, mixed-pool inversion
- `e2e/list_deletion.e2e.spec.ts` — the dialog's three choices
- `e2e/recently_deleted.e2e.spec.ts` — restoring a list brings its tasks back (previously committed skipped; activated here)
- `e2e/list_options.e2e.spec.ts` — deleting an empty list through the dialog

**Manual verification**

_Setup / Preconditions_ — the Compose stack up (`docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build`), at least two lists, and a list holding both a complete and an incomplete task.

_Steps_

1. `Select Items`, pool one complete and one incomplete task, press the completion action.
2. Pool two tasks, press the trash once, then again.
3. On a list holding tasks, `⋯` → `Delete List`; read the count, press Cancel; reopen and press **Delete Just the List**.
4. Repeat on another populated list with **Delete With Items**, then open Recently Deleted.
5. Press Restore on the list row, then reopen that list.

_Expectation_ — (1) both rows land on their opposite state; (2) the first press rings the icon without filling the button, the second deletes; (3) nothing changes on Cancel, and the kept items appear in the default list; (4) the list row reads `list · N items` and its tasks have their own rows; (5) the list and its tasks come back together.

## Affected Components

- `components/web_client/src/components/TaskList/SelectionBar/` — toggle label and semantics, armed ring
- `components/web_client/src/components/TaskList/useTaskSelection.ts` — `toggleSelectedCompletion` replaces `completeSelected`
- `components/web_client/src/components/DeleteListDialog/` — new
- `components/web_client/src/hooks/useListDeletion.ts` — new; orchestrates both cascades
- `components/web_client/src/hooks/useLists.ts` — `deleteList` accepts a caller-supplied `deleted_at`
- `components/web_client/src/hooks/useRecentlyDeleted.ts` — cascade grouping and unit restore
- `components/web_client/src/components/RecentlyDeleted/` — kind glyph and item count
- `components/web_client/src/components/ListMenu/` — one press, no armed state
- `components/web_client/src/App.tsx` — mounts the dialog
- `e2e/helpers/task-api.ts` — `expectListDeletedOnServer`

**Unchanged:** `components/service-task` entirely. No schema change, no migration, no new endpoint.

## Design Decisions

- **A mixed pool inverts per row** rather than resolving to one shared outcome (operator's call). Predictable per-row; the accessible name, not the glyph, carries the direction.
- **Destructive controls stay red at rest.** The issue's alternative — neutral until armed — was considered and declined, so an unarmed delete still reads as destructive.
- **Deleting a list asks rather than arms**, because a second press on a menu item cannot express "and the items too".
- **An empty list gets one choice**, since a choice between two identical outcomes is only a chance to get it wrong.
- **Which tasks were deleted _with_ a list is derived, not stored.** The cascade issues one `deleted_at` for the list and every task in it, so the pair is recoverable without a `deleted_with_list` column — and a task deleted on its own an hour earlier stays out of the list's count and out of its restore. A stored column would be exact but is a migration, i.e. an escalation out of this workflow.
  - Known edge, accepted: `deleteTask` clamps `deleted_at` through `clampFutureTimestamp` (`task.service.ts`) while `deleteList` does not (`list.service.ts`), so a client whose clock runs ahead of the server can desync the pair and leave a cascaded task ungrouped. It still appears on its own row and is still restorable, so the failure is cosmetic.
- **`Delete Just the List` moves only live tasks.** `patchTask` clears `deletedAt` unconditionally, so patching a tombstoned task's `list_id` would resurrect it. Tasks deleted before the list keep pointing at it and are correctly not counted as cascaded.
- **The tasks settle before the list is tombstoned.** The service re-homes any task whose list is already gone (`task-orphan-sweep.ts`), which would strand a cascade's tasks in the default list if the order were reversed. That sweep stays as the backstop for rows that never synced, and for a list whose items have nowhere to go.
- **Both cascades are client-orchestrated batches** over the calls a single row already uses, so each inherits the offline queue and its recovery — the same shape as #126's batch actions.

## Architecture Decisions (ADR)

None. No new ADR; no existing ADR is amended.

## Change Log

| Date       | PR                                                       | Summary                                                                                        |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 2026-09-23 | [#139](https://github.com/jonpham/PSYKL-System/pull/139) | Batch completion toggle, armed delete ring, Delete List dialog, cascade-aware Recently Deleted |

## Notes on the test harness

Two fixes earned here, both worth knowing about:

- **Stories that render `<App />` had no design tokens.** `styles/tokens.css` is imported only by `main.tsx`, so every such story ran unstyled and no assertion on a token-derived colour could hold. The three story files touched here import it explicitly, as `AppShell.stories.tsx` already did; other story files likely still have the gap.
- **"Sync queue empty" is not proof a cascade landed.** The queue empties briefly between the last cascaded task delete and the list delete, so polling it let a reload drop the list delete. `expectListDeletedOnServer` waits on the service's own view of the tombstone instead.
