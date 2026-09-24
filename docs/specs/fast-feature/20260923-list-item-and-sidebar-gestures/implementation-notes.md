# Implementation Notes — Task Row Gestures and Touch Polish

> Lightweight feature workflow, `target = production`. Branch `feat/128-list-item-and-sidebar-gestures`, one PR.

## Slices

1. `useSwipeTrack` — a pointer-driven horizontal drag primitive: axis lock, live offset, release verdict (settle open / settle closed / commit).
2. Task row rail wired through it (`TaskRow` shell + `EditableTaskRow` actions).
3. ~~Sidebar edge-open and drag-close~~ — built, then **removed** after iteration 1 (see `acceptance-checks.md` → Verified). `AppShell` is back to main apart from the tint fix.
4. Iteration 1 feedback: focus frame, boxed rail actions, Safari tint, empty-space capture, new empty-state copy.

## Files

Production behaviour source files — **16**, against 7 planned and the ≤10 `AGENTS.md` applies to DevTask PRs (this is not one). Flagged rather than worked around. Three are forced by the 150-line ESLint cap, two of them pure moves; five arrived with iteration 1's new asks.

The gesture primitive:

- `src/hooks/swipeTrack.ts` — new; the two pure decisions (is it horizontal, where does it land).
- `src/hooks/useSwipeTrack.ts` — new; pointer plumbing, window-bound, `pointercancel` abandons.

The row rail and focus frame:

- `TaskList/TaskRow/TaskRow.tsx` — the grid moved from the `<li>` onto a sliding `__surface`; `data-focused` frames the row while editing, swiping, or open.
- `TaskList/TaskRow/task-row.css` — rail, surface transform, `touch-action: pan-y`, focus frame, boxed actions, delete pane, dismiss cover.
- `TaskList/TaskRow/useRowSwipe.ts` — new; measuring, placing the surface, and the release verdict.
- `TaskList/TaskRow/SwipeRail/SwipeRail.tsx` + `index.ts` — new; the two revealed controls, and the full-swipe `DeletePane`.
- `TaskList/TaskRow/EditableTaskRow.tsx` — supplies delete and details, and reports editing as focus.
- `TaskList/TaskList.tsx` — passes the one open rail id down, and the empty-space tap.
- `TaskList/useOpenRail.ts` — new; which row is open, closed by a scroll or by selection mode.
- `TaskList/usePendingTaskIds.ts` — new; **a pure move** to get `TaskList.tsx` under the line cap.

Iteration 1:

- `TaskList/task-list.css` — the empty space fills the list body down to the (+).
- `TaskList/EmptyState/EmptyState.tsx` — copy is "Nothing to do yet."
- `AppShell/app-shell.css` — scrim is `absolute`, not `fixed`; `html` and `body` paint `--bg-app`.
- `preferences/apply.ts`, `preferences/bootstrap.ts` — `theme-color` follows the resolved `--bg-app`, including on a system appearance flip. `index.html`'s static default moved from navy to white (not counted: outside `src/`).

Read-only / reused: `TaskItemDrawer`, `useTasks().deleteTask`, `useHandOrder`.

## Data / API

**Empty.** No schema change, no new endpoint, no shared-model change. Delete is the existing soft delete (`deleteTask`), so it inherits the offline queue and Recently Deleted.

## Tests

**Operator-directed deviation from the `target = production` test floor, for this iteration only.** E2E specs and Storybook stories are _not_ written or updated during TDD while the feel is judged on device. During implementation the floor is static analysis (unchanged) plus TDD-ordered **Unit** tests.

After operator approval, the full floor is restored **in this same PR before merge**:

- E2E specs titled from `acceptance-checks.md`, in `e2e/task_list.e2e.spec.ts`.
- Storybook stories for the rail, the focus frame, and empty-space capture.
- **Known stale until then:** `e2e/task_list.e2e.spec.ts` and `TaskList/__tests__/TaskList.stories.tsx` still assert the old copy "No tasks yet. Create your first one." — CI's E2E and component jobs will fail on it until this pass.

## Evidence

Local, gitignored screenshots at 390px: row at rest, focused row, rail open, past the full-swipe threshold, empty-space tap, sidebar open with the Safari tint. Deleted at close-out; `visual-artifact.md` is carried into the feature doc's `## Visual Record`.

## Open questions

- **Safari tint is a best-effort fix until seen on device.** Safari 26 samples the page for its chrome colour rather than reading `theme-color`; the fix removes the one fixed full-bleed element it was sampling (the scrim) and gives the page itself the app background. The two drawers' scrims are still `fixed` and may show the same tint — not in the feedback, so not changed.
- Whether the frame should also show on a selection-mode row being dragged by its handle. Not asked for; not done.
- The artifact folder is still named `…-list-item-and-sidebar-gestures`. The sidebar gesture is gone; renaming is cheap if you want it to match.
