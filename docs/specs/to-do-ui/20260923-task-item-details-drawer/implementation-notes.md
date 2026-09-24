# Implementation Notes — Task Item Details Drawer

> `target = production`, Standard Lane, branch `feat/127-list-item-details-drawer`.

## First slice

1. `TaskRow` gains a trailing `action` slot alongside the existing handle slot; `EditableTaskRow` fills it with the (i) button while `editing` is true and owns the open/closed state of the drawer.
2. The inline title field becomes an auto-growing `textarea` so a tapped row keeps its wrap and height — done first, since it is the jump the user feels before anything else on the row.
3. `TaskItemDrawer` renders title field + three timestamps + Delete, reusing `MoveToListDrawer`'s header grammar; desktop centring is a shared CSS concern applied to both drawers.

## Files

- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` — trailing action slot (the handle branch is unchanged)
- `components/web_client/src/components/TaskList/TaskRow/EditableTaskRow.tsx` — (i) button, drawer state, title commit, delete
- `components/web_client/src/components/TaskList/TaskItemDrawer/TaskItemDrawer.tsx` + `task-item-drawer.css` + `index.ts` — new
- `components/web_client/src/hooks/useInlineEdit.ts` — `inputProps` generalized over `HTMLInputElement | HTMLTextAreaElement`
- `components/web_client/src/components/TaskList/TaskRow/task-row.css` — (i) affordance, and the textarea sharing the title's box (`resize: none`, `overflow: hidden`, auto-grown to `scrollHeight`)
- `components/web_client/src/components/TaskList/MoveToListDrawer/move-to-list-drawer.css` — desktop centred-modal rules
- Reused read-only: `hooks/useTasks.ts` (`patchTask`, `deleteTask`), `hooks/useInlineEdit.ts`, `components/AppShell/Glyphs`

Seven production source files — inside the ≤10 per-PR limit.

## Data / API

**Empty — no backend change.** `created_at`, `updated_at`, `completed_at` are already on the `Task` payload (`api/types.ts:755-775`), and deletion reuses the existing soft-delete `deleteTask(id, { deleted_at, updated_at }, optimistic)` path that `useTaskSelection.deleteSelected` already calls. No schema, no endpoint, no shared-model change.

## Boundaries

- Desktop is the shell's existing `@container psykl-shell (min-width: 768px)` breakpoint — no new breakpoint token.
- Delete is a soft delete and flows into Recently Deleted unchanged; no cascade logic, unlike list deletion (#138).
- The two-press arm/confirm is local `armed` state in the drawer mirroring `SelectionBar`'s, not a shared abstraction — two call sites is not yet a pattern; the third is when to extract one.
- `useInlineEdit` is shared with the list-title editor (`AppShell/EditableTitle`); the hook is widened to accept either element, and the list title keeps its `<input>` — a list name is one line by design.
- Selection mode is untouched: the (i) slot and the ≡ handle are mutually exclusive by construction.

## Tests

**Operator-authorized reduced floor for the implementation pass:** unit tests only (TDD ordering kept). **No E2E spec and no Storybook play-function stories are written or updated until the operator has verified the UX on device and approved it.** They are then written to close the floor before the PR merges — the acceptance checks above are their titles. Static analysis (lint / format / typecheck) is not reduced.

Unit tests for this pass:

- `TaskRow.presentation.unit.test.tsx` — the trailing slot renders the action when given, the handle when given, never both
- `EditableTaskRow` — (i) appears only while editing; opening/closing the drawer; delete calls `deleteTask` with a soft-delete body
- `TaskRow.interactions.unit.test.tsx` — the edit field is a textarea, seeded with the stored title, Enter commits rather than inserting a newline
- `TaskItemDrawer.unit.test.tsx` — delete arms on the first press and calls `deleteTask` only on the second; a title edit and a reopen each disarm it; timestamp formatting incl. the `—` Completed empty state; ✓ disabled until the title changes; Escape closes

## Evidence

Local screenshots (gitignored, deleted at close-out): 390px two-line title resting vs. being edited (the jump this fixes), 390px row-with-(i), 390px open drawer on an incomplete task, 390px open drawer on a completed task, ≥768px centred modal for both drawers.

## Open questions

- None blocking. Non-blocking: whether the (i) should persist after the title input blurs (proposal: it does not — the affordance is tied to the focused row).
