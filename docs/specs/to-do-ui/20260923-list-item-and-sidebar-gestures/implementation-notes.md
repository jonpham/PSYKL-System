# Implementation Notes — Task Row and Sidebar Touch Gestures

> Lightweight feature workflow, `target = production`. Branch `feat/128-list-item-and-sidebar-gestures`, one PR.

## First slice

1. `useSwipeTrack` — a pointer-driven horizontal drag primitive: axis lock, live offset, release verdict (settle open / settle closed / commit). Unit-tested on its own before either surface uses it.
2. Task row rail wired through it (`TaskRow` shell + `EditableTaskRow` actions), which is the half of #128 that removes the most taps.
3. Sidebar edge-open and drag-close on the same primitive.

## Files

Production behaviour source files — **14**, where the plan said 7. Four of the extra files exist because the repo's 150-line-per-file ESLint cap rejected the first shape, and two of those (`useOpenRail`, `usePendingTaskIds`) are pure moves out of `TaskList.tsx` with no behaviour change. The ≤10 limit in `AGENTS.md` is scoped to DevTask PRs, which this is not — flagged rather than worked around, because it is a real deviation from what was approved.

The gesture primitive:

- `src/hooks/swipeTrack.ts` — new; the two pure decisions (is it horizontal, where does it land).
- `src/hooks/useSwipeTrack.ts` — new; pointer plumbing, window-bound, `pointercancel` abandons.

The row rail:

- `TaskList/TaskRow/TaskRow.tsx` — the grid moved from the `<li>` onto a `__surface` child that slides; the `<li>` is now the clipping box.
- `TaskList/TaskRow/task-row.css` — rail, surface transform, `touch-action: pan-y`, commit flood, dismiss cover.
- `TaskList/TaskRow/useRowSwipe.ts` — new; measuring, placing the surface, and the release verdict.
- `TaskList/TaskRow/SwipeRail/SwipeRail.tsx` + `index.ts` — new; the two revealed controls and the commit pane.
- `TaskList/TaskRow/EditableTaskRow.tsx` — supplies delete and details; both call what the (i) drawer already calls.
- `TaskList/TaskList.tsx` — passes the one open rail id down.
- `TaskList/useOpenRail.ts` — new; which row is open, closed by a scroll or by selection mode.
- `TaskList/usePendingTaskIds.ts` — new; **a pure move**, extracted only to get `TaskList.tsx` back under the line cap.

The sidebar:

- `AppShell/AppShell.tsx` — edge-zone open, drag-to-close, backdrop opacity from the live offset.
- `AppShell/app-shell.css` — `--sidebar-shift` drives shut, open and mid-drag from one property.
- `AppShell/useSidebarSwipe.ts` — new; the edge gate, the narrow-layout check, and the settle.

Read-only / reused: `TaskItemDrawer`, `useTasks().deleteTask`, `useHandOrder` (untouched — selection-mode rows get no rail, so the drag handle's `touch-action: none` never competes).

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
- Whether the rail should also appear on completed rows. It does, as assumed — the same two actions apply.
- **iOS Safari's own back-swipe lives on the same left edge.** In a browser tab the two compete; an installed home-screen PWA has no back gesture, which is the target. Worth checking both on device.
- The 14-file count above. If the operator wants it inside 10, the split to undo is the two pure moves out of `TaskList.tsx`, which means finding the lines elsewhere.
