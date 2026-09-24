# Implementation Notes — Task Item Details Drawer

> `target = production`, Standard Lane, branch `feat/127-list-item-details-drawer`.

## First slice

1. `TaskRow` gains a trailing `action` slot alongside the existing handle slot; `EditableTaskRow` fills it with the (i) button while `editing` is true and owns the open/closed state of the drawer.
2. `TaskItemDrawer` renders title field + three timestamps + Delete, reusing `MoveToListDrawer`'s header grammar; desktop centring is a shared CSS concern applied to both drawers.

## Files

- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` — trailing action slot (the handle branch is unchanged)
- `components/web_client/src/components/TaskList/TaskRow/EditableTaskRow.tsx` — (i) button, drawer state, title commit, delete
- `components/web_client/src/components/TaskList/TaskItemDrawer/TaskItemDrawer.tsx` + `task-item-drawer.css` + `index.ts` — new
- `components/web_client/src/components/TaskList/TaskRow/task-row.css` — (i) affordance
- `components/web_client/src/components/TaskList/MoveToListDrawer/move-to-list-drawer.css` — desktop centred-modal rules
- Reused read-only: `hooks/useTasks.ts` (`patchTask`, `deleteTask`), `hooks/useInlineEdit.ts`, `components/AppShell/Glyphs`

Six production source files — inside the ≤10 per-PR limit.

## Data / API

**Empty — no backend change.** `created_at`, `updated_at`, `completed_at` are already on the `Task` payload (`api/types.ts:755-775`), and deletion reuses the existing soft-delete `deleteTask(id, { deleted_at, updated_at }, optimistic)` path that `useTaskSelection.deleteSelected` already calls. No schema, no endpoint, no shared-model change.

## Boundaries

- Desktop is the shell's existing `@container psykl-shell (min-width: 768px)` breakpoint — no new breakpoint token.
- Delete is a soft delete and flows into Recently Deleted unchanged; no cascade logic, unlike list deletion (#138).
- Selection mode is untouched: the (i) slot and the ≡ handle are mutually exclusive by construction.

## Tests

**Operator-authorized reduced floor for the implementation pass:** unit tests only (TDD ordering kept). **No E2E spec and no Storybook play-function stories are written or updated until the operator has verified the UX on device and approved it.** They are then written to close the floor before the PR merges — the acceptance checks above are their titles. Static analysis (lint / format / typecheck) is not reduced.

Unit tests for this pass:

- `TaskRow.presentation.unit.test.tsx` — the trailing slot renders the action when given, the handle when given, never both
- `EditableTaskRow` — (i) appears only while editing; opening/closing the drawer; delete calls `deleteTask` with a soft-delete body
- `TaskItemDrawer.unit.test.tsx` — timestamp formatting incl. the `—` Completed empty state; ✓ disabled until the title changes; Escape closes

## Evidence

Local screenshots (gitignored, deleted at close-out): 390px row-with-(i), 390px open drawer on an incomplete task, 390px open drawer on a completed task, ≥768px centred modal for both drawers.

## Open questions

- None blocking. Non-blocking: whether the (i) should persist after the title input blurs (proposal: it does not — the affordance is tied to the focused row).
