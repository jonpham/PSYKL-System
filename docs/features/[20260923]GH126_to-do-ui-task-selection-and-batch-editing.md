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
3. **Batch actions** — a flat action bar, centred on the plane the new-task button occupies, applies **complete**, **move**, or **delete** to the whole pool. The bar arrives with the mode and reads dimmed with its actions disabled until something is pooled.
4. **Two-press delete** — the first press arms (open-lidded trash, filled destructive pill, accessible name `Confirm deleting N tasks`), the second performs. A changed pool, another batch action, or leaving the mode disarms it. Deletes are soft and recoverable from Recently Deleted.
5. **Move to another list** — a from-bottom drawer titled `Move to:` lists every list except the one in view; ✕ dismisses, ✓ commits. Each task's `list_id` is patched through the offline queue.
6. **Hand re-ordering** — open tasks carry a drag handle: pointer drag (works on iOS, where HTML5 drag does not) or ArrowUp/ArrowDown on a focused handle. Completed tasks keep their completion order and carry no handle.
7. **Rename the list in place** — while selecting, the list name is an editable field in the header. Blur commits, Enter commits, Escape discards; a rename arriving from another device flows through. First consumer of `useLists().renameList`.
8. **Completed rows re-drawn** — a completed task is a ring with a filled core, the way Reminders draws it, never a solid disc; the solid tick is reserved for selection.

## Verification Steps

**Associated E2E test:** [`e2e/task_selection.e2e.spec.ts`](../../e2e/task_selection.e2e.spec.ts) (7 scenarios); shared drivers in [`e2e/helpers/selection.ts`](../../e2e/helpers/selection.ts).

**Manual verification**

_Setup / Preconditions_ — the local stack up (`docker compose -f docker-compose.yml -f docker-compose.e2e.yml up --build`), a list holding at least three open tasks and one completed task. Verified by the operator on an iPhone over the LAN and in a desktop browser.

_Steps_

1. Open the list, then ⋯ → **Select Items**.
2. Tap three rows; confirm the action bar is centred and live, and that the new-task button is gone.
3. Press delete once, then again to confirm; check Recently Deleted holds the tasks.
4. Select two more, press complete; select one, move it to another list through the drawer.
5. Drag a task's handle to a new position, then tab to a handle and use the arrow keys.
6. Tap the list name, rename it, press Enter.
7. Press the header checkmark; confirm titles edit inline again and the sync control is back.

_Expectation_ — every batch action applies to exactly the pooled tasks, deletes never happen on one press, the moved tasks appear in the destination list, and membership, completion, and the new list name survive a reload.

## Affected Components

- `components/web_client/src/App.tsx` — selection mode state; the header handover
- `components/web_client/src/components/AppShell/AppShell.tsx`, `EditableTitle/` — renameable title
- `components/web_client/src/components/ListMenu/ListMenu.tsx` — `Select Items`
- `components/web_client/src/components/TaskList/TaskList.tsx`, `useTaskSelection.ts`, `useHandOrder.ts`, `reorder.ts`
- `components/web_client/src/components/TaskList/SelectionBar/`, `MoveToListDrawer/`
- `components/web_client/src/components/TaskList/TaskRow/` — split into a shell plus `EditableTaskRow` and `SelectableTaskRow`

No service, schema, or shared-type change.

## Design Decisions

1. **Hand order is React state, not persisted (operator decision, 2026-09-22).** `Task` has no `position`, and this change adds none: the UX was judged before the contract was designed. A drag survives re-renders and re-sorts, not a reload, which falls back to `created_at` order. **The persisted slice is outstanding work** — it mirrors List ordering exactly (`tasks.position` as a `COLLATE "C"` fractional index, shared-types + migration + IndexedDB + a task-side twin of `useLists.positions.ts`) and carries its own sync and service-model work.
2. **Batch actions reuse the single-row client paths**, one task at a time, so each inherits the offline queue and its recovery rather than growing a batch endpoint. `TaskPatchInputSchema` already carried `completed_at` and `list_id`, so complete/move/delete needed no backend work.
3. **The row is a presentation shell plus two behaviour components.** What differs between modes is what a tap means and what the leading control claims to assistive tech; the chrome does not. The drag handle hangs off the shell's reorder props rather than selection mode, so ordinary rows can become draggable later without a second copy. (Review thread: [#134 r4079867787](https://github.com/jonpham/PSYKL-System/pull/134#discussion_r4079867787).)
4. **Delete is two presses**, mirroring `Delete List` in the list menu, so the destructive gesture is the same shape across the app.
5. **Completion is a ring with a filled core; the tick means selection.** A solid disc read as "selected" and collided with the new mode.
6. **Test floor was reduced to unit tests during iteration** (operator instruction), then restored in full before merge: Storybook play functions and the E2E spec landed in the same PR.

## Architecture Decisions (ADR)

None. No new ADR; the change sits inside the offline-first posture already recorded in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

## Known Follow-ups

- Persist hand order (`Task.position`) — the deferred vertical slice above.
- Review findings raised on the PR and not yet acted on: serial unguarded batch writes, per-`pointermove` layout measurement, `applyHandOrder`'s O(n²) shape, a third copy of the inline-edit state machine, and the pooled-batch/visibility interaction. See [#134 review](https://github.com/jonpham/PSYKL-System/pull/134#pullrequestreview-5288431414).

## Change Log

| Date       | PR                                                       | Summary                                                                            |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2026-09-23 | [#134](https://github.com/jonpham/PSYKL-System/pull/134) | Selection mode, batch complete/move/delete, hand re-ordering, in-place list rename |
