---
status: TODO
issue:
pr:
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 2
devtasks_total: 2
devtasks_complete: 0
honors_decisions:
  - 1
---

# Task List and Row — Implementation Spec

> **Outline fidelity.** Expanded by `superpowers:writing-plans` when this Spec starts.

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 2/6
**Spec User Story:** _As someone working a list daily, I complete a task by tapping a circle that fills, watch the row settle below the tasks still open, and edit a title in place, so that the list reads and behaves like a to-do app I would keep using._
**Status:** see frontmatter
**Time-box:** ~2 days
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md).
**UI reference:** `screenshots/390-loaded-light.png`, `390-loaded-dark.png`, `1024-loaded-light.png`.

---

## Overview

Rewrites `components/web_client/src/components/TaskList/` in the prototype's row language: a 22px
circle checkbox that fills with the tint and strikes the title within ~200ms, 17px titles that wrap
rather than truncate, hairline separators inset to the title's leading edge, in-place title editing,
completed tasks sorted below open ones, and a pending-sync dot column.

Touches `components/web_client` only.

---

## Data Model

**None required, because** completion is the existing `completed_at` column and editing a title is the
existing task update path. Sort order is derived at render time by `sortTasks`, not persisted.

**If in-place editing turns out to need something the current update path cannot express**, stop and
bring the operator a proposal before implementing.

## API

**No API surface, because** complete, reopen, and title update all already exist and are reached
through `useTasks`.

---

## Implementation Components

### `components/web_client/`

- `src/components/TaskList/TaskList.tsx` — rewritten. Renders through `sortTasks`; a failed load stays
  **silent** while the device has tasks to show.
- `src/components/TaskList/sortTasks.ts` (new) — open tasks by `created_at` ascending, completed by
  `completed_at` descending, completed always after open.
- `src/components/TaskList/TaskRow/` (new, nested — single consumer) — checkbox, title, inline edit,
  pending dot.
- `src/components/TaskList/task-list.css`, `TaskRow/task-row.css` (new) — token-driven; no inline
  styles, no hardcoded hex.

**Fixes that must survive the port:**

- Wrapped titles align the checkbox and the pending dot to the **first line** (`align-items: start`,
  the dot at `align-self: start`), not the block centre.
- The pending dot sits in a column mirroring the header's trailing columns, so it hangs directly under
  the sync control.
- Checkbox column is 36px to match the title inset; the 44px hit target is achieved without pushing
  the column into the page gutter.

---

## Test Plan

### Unit tests

| File                                                              | What it asserts                                                                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/TaskList/__tests__/sortTasks.unit.test.ts`        | open before completed; open ascending by creation; completed descending by completion; ties and nulls                                  |
| `src/components/TaskList/TaskRow/__tests__/TaskRow.unit.test.tsx` | toggle fires with the row's id; edit commits on Return and on blur; Escape abandons an edit; the pending dot appears only while queued |

### Component tests (Storybook + play functions + MSW)

| File                                                     | What it asserts                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/TaskList/__tests__/TaskList.stories.tsx` | complete → the row settles below the open group; reopen → it returns; a long title wraps; empty state; MSW-backed, `resetStore()`, no IndexedDB writes |

### End-to-End tests

| File                        | Title                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `e2e/task_list.e2e.spec.ts` | a user completes a task and it settles below the open ones |
| `e2e/task_list.e2e.spec.ts` | a user reopens a completed task                            |
| `e2e/task_list.e2e.spec.ts` | a user edits a task title in place                         |
| `e2e/task_list.e2e.spec.ts` | a long task title wraps instead of truncating              |

**Existing E2E specs to update in the same PR:** `e2e/task_list.e2e.spec.ts`,
`e2e/task_list-offline-sync.e2e.spec.ts`, `e2e/offline_pressure.e2e.spec.ts` — all select rows and
the create form on the old surface.

### TDD order

1. `sortTasks` unit tests → implement → green
2. `TaskRow` unit tests → implement row → green
3. `TaskList` story → wire the list → green
4. Rewrite the affected E2E specs → green

---

## DevTasks

2 DevTasks off `spec/to-do-ui-s2-task-list-and-row`.

### DevTask 4: Ship the task row — checkbox, title, inline edit, pending dot

**Files:** ~5
**Branch:** `feat/to-do-ui-s2-dt4-task-row`

### DevTask 5: Rewrite the list — ordering, separators, empty state

**Files:** ~4
**Branch:** `feat/to-do-ui-s2-dt5-task-list`

---

## Verification (manual)

Walk acceptance checks **Complete**, **Row craft**, **Persistence** and **Dark mode** from
`docs/experiments/apple-reminders-ux/apple-reminders-ui/acceptance-checks.md` against `/`, at 390px and
1024px, light and dark.

## Open Questions / Risks

- Row craft is where "Reminders-grade" is won or lost; measure the metrics rather than eyeballing them.
- Completion animation must respect `prefers-reduced-motion` — and the reduced-motion block must
  contain **only** motion rules. Orphaning tokens there is the exact mistake review round 1 caught.

## Affected by / Depends on

Spec 1 (tokens, glyphs, shell container) must merge first.
