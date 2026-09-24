# Implementation Notes — Task Row and Sidebar Touch Gestures

> Lightweight feature workflow, `target = production`. Branch `feat/128-list-item-and-sidebar-gestures`, one PR.

## First slice

1. `useSwipeTrack` — a pointer-driven horizontal drag primitive: axis lock, live offset, release verdict (settle open / settle closed / commit). Unit-tested on its own before either surface uses it.
2. Task row rail wired through it (`TaskRow` shell + `EditableTaskRow` actions), which is the half of #128 that removes the most taps.
3. Sidebar edge-open and drag-close on the same primitive.

## Files

Production behaviour source files — **7**, under the ≤10 per-PR limit in `AGENTS.md`.

- `components/web_client/src/hooks/useSwipeTrack.ts` — new; the shared gesture primitive.
- `components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx` — the grid moves from the `<li>` onto a `__surface` child that translates, with a `__rail` painted behind it. New optional `swipeActions` prop; absent, the row renders exactly as it does today.
- `components/web_client/src/components/TaskList/TaskRow/task-row.css` — rail, surface transform, `touch-action: pan-y`, full-swipe flood state.
- `components/web_client/src/components/TaskList/TaskRow/EditableTaskRow.tsx` — supplies Details and Delete to the rail; both call the handlers the (i) drawer already calls.
- `components/web_client/src/components/TaskList/TaskList.tsx` — holds the id of the one open rail, so opening one closes another.
- `components/web_client/src/components/AppShell/AppShell.tsx` — edge-zone open, drag-to-close, backdrop opacity driven from the live offset.
- `components/web_client/src/components/AppShell/app-shell.css` — sidebar transition and drag-offset custom property.

Read-only / reused: `TaskItemDrawer`, `useTasks().deleteTask`, `useHandOrder` (untouched — selection-mode rows get no swipe, so the drag handle's `touch-action: none` never competes with the rail).

## Data / API

**Empty.** No schema change, no new endpoint, no shared-model change. Delete is the existing soft delete (`deleteTask`), the same call the (i) drawer and the batch delete already make, so it inherits the offline queue and Recently Deleted. Nothing here is raised for escalation.

## Tests

**Operator-directed deviation from the `target = production` test floor, for this iteration only.** The operator has instructed that E2E specs and Storybook component stories are _not_ written during TDD, to keep iteration cheap while the feel of the gesture is still being judged on device. During implementation the floor is:

- **Static analysis** — unchanged, must pass.
- **Unit** — full TDD ordering, failing test first: `useSwipeTrack` (axis lock, thresholds, flick velocity, release verdict), `TaskRow` rail rendering and surface offset, `EditableTaskRow` rail actions, `AppShell` edge-zone open/close.

After the operator verifies the UX on device and approves it, the full floor is restored **in this same PR before merge**: Storybook stories at the component layer and E2E specs titled from `acceptance-checks.md`, landing in `e2e/task_list.e2e.spec.ts` and `e2e/navigation.e2e.spec.ts`. The PR does not merge with that gap open.

## Evidence

Local, gitignored screenshots at 390px: row at rest, rail open, past the full-swipe threshold, sidebar mid-drag, sidebar open. Deleted at close-out; `visual-artifact.md` is updated to what was built and carried into the feature doc's `## Visual Record`.

## Open questions

- Does the Delete pane flooding the row (frame 3) read as commit on device, or does it need a glyph change too? Judged on the phone, not decided here.
- Whether the rail should also appear on completed rows. Assumed yes — the same two actions apply — but worth a look once it runs.
