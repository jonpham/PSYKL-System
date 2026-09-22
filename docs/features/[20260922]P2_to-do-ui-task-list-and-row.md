---
status: IN-PROGRESS
issue: P2
branches:
  - feat/to-do-ui-s2-dt4-task-row
  - feat/to-do-ui-s2-dt5-task-list
prs:
  - https://github.com/jonpham/PSYKL-System/pull/105
  - https://github.com/jonpham/PSYKL-System/pull/106
completed_at:
created_at: 2026-09-22
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260921-Spec2-task-list-and-row.md (deleted at Spec close-out; see git history)
---

# Task List and Row

## User Story

As someone working a list daily, I complete a task by tapping a circle that fills, watch the row
settle below the tasks still open, and edit a title in place, so that the list reads and behaves like
a to-do app I would keep using.

## Features

1. A 22px circle checkbox that fills with the tint and strikes the title, honouring
   `prefers-reduced-motion`.
2. 17px titles that wrap rather than truncate, with the checkbox and pending dot pinned to the first
   line.
3. Hairline separators, and none under the last row.
4. Open tasks ordered oldest-first so a new task lands next to where the user is typing; completed
   tasks sink below them, most recently completed first.
5. A failed refresh stays silent while the device still has tasks to show.

## Verification Steps

**Associated E2E tests:** `e2e/task_list.e2e.spec.ts` — capture order, complete-and-settle, reopen,
inline edit, wrapping title.

**Manual verification**

_Setup / Preconditions_ — `pnpm dev`, at 390px and 1024px, light and dark.

_Steps_

1. Complete a task and watch it settle below the open ones; reopen it.
2. Capture a task with a very long title.
3. Set `data-contrast="increased"` on `<html>` and re-read the unchecked circle.

_Expectation_ — the row reads correctly at Standard and Increased contrast; long titles wrap; order
survives a reload.

## Affected Components

- `components/web_client/src/components/TaskList/TaskRow/` — circle checkbox, inline edit, pending dot
- `components/web_client/src/components/TaskList/sortTasks.ts` — ordering, derived at render
- `components/web_client/src/components/TaskList/TaskList.tsx` — ordering wiring, silent failed refresh

## Design Decisions

- **The row keeps its delete affordance, which the prototype does not have.** No `to-do-ui` Spec
  reintroduces one, so porting the prototype literally would drop a shipped user story and the only
  route into Recently Deleted for tasks. Raised for the operator rather than decided quietly.
- **The created-at timestamp is gone from the row**, matching the prototype. Nothing asserted on it.
- **Ordering is derived at render, never persisted.** `sortTasks` re-sorts what the hook hands back.
- **A failed refresh over a non-empty list is silent.** The banner only reports that the network is
  down, over a list that is perfectly usable.

## Architecture Decisions (ADR)

- None. No schema, API, or sync-protocol change.

## Known Issues

- **A completion can be lost across a reload while it is still queued.** `e2e/task_list.e2e.spec.ts`
  → "a user marks a task complete and it stays complete after reload" fails intermittently: the row
  returns open and marked pending sync, so server hydration appears to win over a locally-queued
  change. Predates this Spec; documented, not masked.
- **A list re-order is occasionally a no-op** (~1 run in 24) in `e2e/lists.e2e.spec.ts`. Suspected to
  be the same reload-staleness family fixed for tasks in `todo-experience` Spec 2.

## Change Log

| Date       | PR                                                       | Summary                                                  |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------- |
| 2026-09-22 | [#105](https://github.com/jonpham/PSYKL-System/pull/105) | Task row — circle checkbox, wrapping titles, pending dot |
| 2026-09-22 | [#106](https://github.com/jonpham/PSYKL-System/pull/106) | List ordering, separators, silent failed refresh         |
