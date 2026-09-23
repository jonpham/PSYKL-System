---
status: DONE
issue: GH126
branches:
  - feat/126-multiple-list-item-edit-selection
prs:
  - https://github.com/jonpham/PSYKL-System/pull/134
completed_at: 2026-09-23
created_at: 2026-09-23
initiative: to-do-ui
spec: none — lightweight feature workflow, `target = production` (artifact folder consolidated into this doc at close-out)
---

# Select and edit multiple list items

> Lightweight `target = production` change, Standard Lane, under [`docs/workflows/lightweight-feature-workflow.md`](../workflows/lightweight-feature-workflow.md). Source: [#126](https://github.com/jonpham/PSYKL-System/issues/126).

## User Story

As a PWA user with a list that has grown past a handful of tasks, I want to select several tasks at once and complete, move, delete, or re-order them, so that tidying a list is one pass instead of one row at a time.

## Features

1. **Selection mode** — `Select Items` in the list options menu turns the list into a selection surface. The header belongs to the mode: the sync control steps aside and a filled accent checkmark is the one way out, which also empties the pool.
2. **Pooling rows** — the mark or the title pools a task; a tick in the circle means "selected" and nothing else. Titles are not editable while selecting.
3. **Batch actions** — a flat action bar, centred on the plane the new-task button occupies, applies **complete**, **move**, or **delete** to the whole pool. The bar arrives with the mode and reads dimmed with its actions disabled until something is pooled. A batch is issued at once and awaited as a whole: the pool is frozen while it is in flight, one failed write never strands the tasks behind it, and when everything settles the mode hands the user back to the ordinary list with the affected rows already showing their new state.
4. **Two-press delete** — the first press arms (open-lidded trash, filled destructive pill, accessible name `Confirm deleting N tasks`), the second performs. A changed pool, another batch action, or leaving the mode disarms it. Deletes are soft and recoverable from Recently Deleted.
5. **Move to another list** — a from-bottom drawer titled `Move to:` lists every list except the one in view; ✕ dismisses, ✓ commits. Each task's `list_id` is patched through the offline queue.
6. **Hand re-ordering** — open tasks carry a drag handle: pointer drag (works on iOS, where HTML5 drag does not) or ArrowUp/ArrowDown on a focused handle. Completed tasks keep their completion order and carry no handle.
7. **Rename the list in place** — while selecting, the list name is an editable field in the header. Blur commits, Enter commits, Escape discards; a rename arriving from another device flows through. First consumer of `useLists().renameList`.
8. **Completed rows re-drawn** — a completed task is a ring with a filled core, the way Reminders draws it, never a solid disc; the solid tick is reserved for selection.

## Visual Record

> The shipped surface, at ~390px (iPhone). Chrome that already existed is marked `=`; chrome this
> change introduced is marked `+`. Carried from the planning `visual-artifact.md` and updated to
> what was built — see the note at the end for how the two differ.

### 1. Ordinary list view — the way in

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries  ⟳  ⋯   │ = ⋯ opens the list options menu
├──────────────────────────────────────┤
│ ○  Oat milk                          │ = tap circle completes, tap title edits
│ ○  Sourdough                         │
│ ◉  Coffee beans          (completed) │ + ring with a FILLED CORE, no tick
├──────────────────────────────────────┤
│  ⋯ menu ▾                            │
│   Hide Completed (1)                 │ =
│ + Select Items                       │ + new menu item
│   Delete List                        │ =
├──────────────────────────────────────┤
│                 (+)                  │ = new-task button, right of the bar
└──────────────────────────────────────┘
```

### 2. Selection mode, nothing pooled yet

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries     ✓   │ + ✓ (filled accent) replaces ⋯ and is
│                                      │   the one way out; ⟳ sync steps aside
├──────────────────────────────────────┤
│ ○  Groceries                    (✎)  │ + the list NAME is editable here
│ ○  Oat milk                      ≡   │ + titles pool instead of editing
│ ○  Sourdough                     ≡   │ + ≡ drag handle on open tasks only
│ ◉  Coffee beans                      │ + completed rows carry no handle
├──────────────────────────────────────┤
│        ┌──────────────────┐          │ + the bar arrives WITH the mode,
│        │  ◉     ≡+    ⌫   │          │   dimmed and disabled; the (+) button
│        └──────────────────┘          │   is already gone
└──────────────────────────────────────┘
```

### 3. Two rows pooled — the action bar live

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries     ✓   │
├──────────────────────────────────────┤
│ ✓  Oat milk                      ≡   │ + mark or title pools the row
│ ○  Sourdough                     ≡   │ + a tick means SELECTED, nothing else
│ ✓  Coffee beans                      │
├──────────────────────────────────────┤
│        ┌──────────────────┐          │ + flat bar: accent border and glyphs
│        │  ◉     ≡+    ⌫   │          │   over the elevated surface
│        └──────────────────┘          │   ◉ complete · ≡+ move · ⌫ delete
└──────────────────────────────────────┘

    first press on ⌫              second press
    ┌──────────────┐              ┌──────────────┐
    │ ◉   ≡+  (⌫▲) │  ───────▶    │  tasks gone  │
    └──────────────┘              └──────────────┘
    + lid open, filled            + soft-deleted, recoverable from
      destructive pill,             Recently Deleted. A changed pool or
      "Confirm deleting 2 tasks"    another action disarms it instead.
```

### 4. Move drawer, opened by the move glyph

```text
┌──────────────────────────────────────┐
│ ☰ PSYKL            Groceries     ✓   │
│ ✓  Oat milk                      ≡   │  (list dimmed behind the drawer)
├──────────────────────────────────────┤
│  ✕            Move to:           ✓   │ + ✕ dismisses, ✓ commits the move
│ ──────────────────────────────────── │
│  ◯  Errands                          │ + the current list is never offered
│  ◉  Weekend                          │ + one destination at a time
│  ◯  Reading                          │
└──────────────────────────────────────┘
```

### Notes

- Hand re-ordering applies to **open** tasks only; a drop past the completed group clamps to the end of the open tasks. Dragging is pointer-driven so it works on iOS; ArrowUp/ArrowDown on a focused handle is the keyboard equivalent.
- Leaving the mode clears the pool and disarms a pending delete. The pool is not remembered across a reload.
- A completed batch leaves the mode on its own, so the user sees the result on the ordinary list; the header checkmark is for leaving without acting.
- The completed mark changed list-wide, not just inside the mode, so a tick can only ever mean "selected".

**How this differs from the plan.** The planning wireframes had the action bar appear with the first selection (it now arrives with the mode, dimmed), the new-task button leaving only once something was pooled (it leaves on entry), a single-press delete (now two presses), a solid disc for completion (now a ring with a filled core), a blue filled action bar (now flat), and no editable list name. All six came out of the operator's UX review on the running build.

## Verification Steps

**Associated E2E test:** [`e2e/task_selection.e2e.spec.ts`](../../e2e/task_selection.e2e.spec.ts) (7 scenarios); shared drivers in [`e2e/helpers/selection.ts`](../../e2e/helpers/selection.ts).

**Manual verification**

_Setup / Preconditions_ — the local stack up (`docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build`), a list holding at least three open tasks and one completed task. Verified by the operator on an iPhone over the LAN and in a desktop browser.

_Steps_

1. Open the list, then ⋯ → **Select Items**.
2. Tap three rows; confirm the action bar is centred and live, and that the new-task button is gone.
3. Press delete once, then again to confirm; check Recently Deleted holds the tasks.
4. Confirm the list returns on its own after the delete, with the deleted rows gone — no second gesture needed.
5. Re-enter the mode; select two tasks, press complete, and confirm the return to the list with both rows marked and sunk below the open ones. Do the same for a move through the drawer.
6. Re-enter the mode; drag a task's handle to a new position, then tab to a handle and use the arrow keys.
7. Tap the list name, rename it, press Enter.
8. Press the header checkmark without acting; confirm titles edit inline again and the sync control is back.

_Expectation_ — every batch action applies to exactly the pooled tasks and returns the user to the list showing the result, deletes never happen on one press, the moved tasks appear in the destination list, and membership, completion, and the new list name survive a reload.

## Affected Components

- `components/web_client/src/App.tsx` — selection mode state; the header handover
- `components/web_client/src/components/AppShell/AppShell.tsx`, `EditableTitle/`, `DoneSelectingButton/` — renameable title and the way out of the mode
- `components/web_client/src/hooks/useInlineEdit.ts` — the one inline-edit state machine, shared with the task row
- `components/web_client/src/components/ListMenu/ListMenu.tsx` — `Select Items`
- `components/web_client/src/components/TaskList/TaskList.tsx`, `useTaskSelection.ts`, `useHandOrder.ts`, `reorder.ts`
- `components/web_client/src/components/TaskList/SelectionBar/`, `MoveToListDrawer/`
- `components/web_client/src/components/TaskList/TaskRow/` — split into a shell plus `EditableTaskRow` and `SelectableTaskRow`

No service, schema, or shared-type change.

## Design Decisions

1. **Hand order is React state, not persisted (operator decision, 2026-09-22).** `Task` has no `position`, and this change adds none: the UX was judged before the contract was designed. A drag survives re-renders and re-sorts, not a reload, which falls back to `created_at` order. **The persisted slice is outstanding work** — it mirrors List ordering exactly (`tasks.position` as a `COLLATE "C"` fractional index, shared-types + migration + IndexedDB + a task-side twin of `useLists.positions.ts`) and carries its own sync and service-model work.
2. **Batch actions reuse the single-row client paths**, so each inherits the offline queue and its recovery rather than growing a batch endpoint. `TaskPatchInputSchema` already carried `completed_at` and `list_id`, so complete/move/delete needed no backend work. The hook treats those calls as plain async service calls and knows nothing about a queue behind them — whether one exists is the client's business (see [#135](https://github.com/jonpham/PSYKL-System/issues/135)). The batch is awaited with `allSettled`, not `all`: a user who asked for five deletions should not lose four because the first failed.
3. **A finished batch leaves the mode.** An action the user cannot see the result of reads as nothing having happened; returning them to the list is how the batch reports itself.
4. **One inline-edit state machine** (`hooks/useInlineEdit.ts`) serves the list name and the task title. `CaptureRow` deliberately does not use it — capture creates rather than edits, keeps its field open after a save, shows a retry on failure, and treats an empty field as discard.
5. **The row is a presentation shell plus two behaviour components.** What differs between modes is what a tap means and what the leading control claims to assistive tech; the chrome does not. The drag handle hangs off the shell's reorder props rather than selection mode, so ordinary rows can become draggable later without a second copy. (Review thread: [#134 r4079867787](https://github.com/jonpham/PSYKL-System/pull/134#discussion_r4079867787).)
6. **Delete is two presses**, mirroring `Delete List` in the list menu, so the destructive gesture is the same shape across the app.
7. **Completion is a ring with a filled core; the tick means selection.** A solid disc read as "selected" and collided with the new mode.
8. **Test floor was reduced to unit tests during iteration** (operator instruction), then restored in full before merge: Storybook play functions and the E2E spec landed in the same PR.

## Architecture Decisions (ADR)

None. No new ADR; the change sits inside the offline-first posture already recorded in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

## Known Follow-ups

- Persist hand order (`Task.position`) — the deferred vertical slice above.
- **Bulk edits have no contract** — [#137](https://github.com/jonpham/PSYKL-System/issues/137). A batch is N independent writes, so it is atomic nowhere, and a partial failure is survivable but silent: the user is not told which of the N did not apply. The decision has to hold under both client paradigms (direct-service and offline sync).
- **`applyHandOrder` is O(n²)** (`includes`/`indexOf` inside the comparator) — deferred to [#136](https://github.com/jonpham/PSYKL-System/issues/136), where it lands with the `Task.position` work rather than ahead of it.
- **A pooled open task can silently leave the batch** if Hide Completed was on before entering the mode and another device completes that task mid-pool. Narrow — the toggle itself is unreachable while selecting, and the freeze closes the window once an action is pressed. Deferred to [#135](https://github.com/jonpham/PSYKL-System/issues/135)/[#136](https://github.com/jonpham/PSYKL-System/issues/136).
- Addressed in review and no longer outstanding: batch failure handling and in-flight freezing, per-`pointermove` layout measurement, and the duplicated inline-edit state machine. See the [#134 review](https://github.com/jonpham/PSYKL-System/pull/134#pullrequestreview-5288431414).

## Change Log

| Date       | PR                                                       | Summary                                                                            |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2026-09-23 | [#134](https://github.com/jonpham/PSYKL-System/pull/134) | Selection mode, batch complete/move/delete, hand re-ordering, in-place list rename |
