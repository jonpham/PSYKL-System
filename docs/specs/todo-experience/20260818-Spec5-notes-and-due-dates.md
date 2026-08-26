---
status: TODO
issue: P5
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 5
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - premise-p2-dates-are-facts
---

# Notes and Optional Due Dates — Implementation Spec

> **Outline.** Per-Step TDD detail is written when this Spec starts.

**Date:** 2026-08-18
**Initiative:** `todo-experience`
**Spec:** 5/7
**Spec User Story:** _As the operator, I attach a note and an optional deadline to a task and edit its title without leaving the list, so that a task can hold real detail._
**Time-box:** ~2 days human / ~1 Claude Code session

---

## Overview

The cheapest Spec structurally — three nullable columns and a sheet. Premise P2 governs: a due date is a _fact about a task_, never a schedule. No notifications, no alerts, no repeat rules.

The design review restored **inline title editing** alongside the detail sheet, reversing the earlier plan that moved editing into the sheet. The row has two targets: tap the title to edit in place (M2 Spec 5 behavior, preserved), tap the trailing detail button for the sheet.

---

## Data Model

`tasks` gains three nullable columns:

```ts
notes: text('notes'),
dueAt: timestamp('due_at', { withTimezone: true }),
dueHasTime: boolean('due_has_time').notNull().default(false),
```

`due_has_time` distinguishes "due Friday" from "due Friday at 17:00". Without it a date-only deadline renders as midnight, which reads as a time the user never set.

---

## DevTasks

| #   | Title                                 | Branch                                             | Files | Depends on |
| --- | ------------------------------------- | -------------------------------------------------- | ----- | ---------- |
| 17  | Notes + due date columns and API      | `feat/todo-experience-s5-dt17-task-detail-columns` | ~5    | Spec 1     |
| 18  | Task detail sheet                     | `feat/todo-experience-s5-dt18-detail-sheet`        | ~5    | DevTask 17 |
| 19  | Row metadata line + overdue rendering | `feat/todo-experience-s5-dt19-row-metadata`        | ~4    | DevTask 18 |

### DevTask 19 — row rendering

Three metrics validated in the 2026-08-13 prototype against 44 real tasks, all now normative in `docs/DESIGN.md`:

- The title wraps to **two lines** then truncates. Single-line truncation cut more than half of real titles at phone width.
- The due date sits on the **title's first line**, always, whether or not a metadata line exists. Letting it drop to the second line made the date column alternate between two vertical offsets and stop reading as a column.
- A past due date renders in `--destructive`. Overdue styling was reinstated at the 2026-08-14 re-scope.

The detail sheet leaves its **primary button position empty** — reserved for `Start PSYKL` in the next initiative. Nothing may claim it.

---

## Test Plan

- **Unit:** due-date formatting with and without a time; overdue predicate at the day boundary.
- **Integration:** notes and due date round-trip; a null `due_at` with `due_has_time` true is rejected.
- **Component:** sheet contract; Storybook play functions for inline title edit and for sheet editing.
- **E2E:** `e2e/task_detail.e2e.spec.ts` covering the six Spec 4 stories in `UX.md` § 5.

## Open Questions / Risks

- **Timezones.** `due_at` is `timestamptz`, but a date-only deadline is timezone-ambiguous. Store the date at UTC midnight and render in local time when `due_has_time` is false.

## Affected by / Depends on

- **Depends on:** Spec 1.
- **Blocks:** nothing.
