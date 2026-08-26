---
status: TODO
issue: P7
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 7
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - offline-posture-no-foreign-keys
  - premise-p5-do-not-make-sessions-harder
---

# Tags and Search — Implementation Spec

> **Outline.** Per-Step TDD detail is written when this Spec starts.

**Date:** 2026-08-18
**Initiative:** `todo-experience`
**Spec:** 7/7 — closes the initiative
**Spec User Story:** _As the operator, I tag tasks across lists and find any of them by word or tag, offline, so that structure I created stays reachable._
**Time-box:** ~3 days human / ~1 Claude Code session

---

## Overview

Tags ship last and ship **visible**. They are the dimension the future retrospective is computed over — productivity is eventually classified by tag and by parent-list tag — so they are a first-class row citizen, not a detail-sheet-only field (Premise P5).

Search is client-side over IndexedDB. It must work offline, which rules out a server query as the primary path.

---

## Data Model

Two tables, same no-foreign-key rule:

```ts
export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: ..., updatedAt: ..., serverUpdatedAt: ..., deletedAt: ...,
});

export const taskTags = pgTable('task_tags', {
  id: text('id').primaryKey(),      // own id so the join row syncs like any entity
  userId: text('user_id').notNull(),
  taskId: text('task_id').notNull(), // no FK
  tagId: text('tag_id').notNull(),   // no FK
  createdAt: ..., deletedAt: ...,
});
```

The join row carries **its own id and its own tombstone** so applying and removing a tag are ordinary syncable operations rather than a rewrite of the task row. Without this, tagging a task on two devices at once loses one tag under Last-Write-Wins.

IndexedDB gains `tags` and `task_tags` stores at schema **v5**.

---

## DevTasks

| #   | Title                                     | Branch                                      | Files | Depends on |
| --- | ----------------------------------------- | ------------------------------------------- | ----- | ---------- |
| 24  | Tag + task_tag entities and endpoints     | `feat/todo-experience-s7-dt24-tag-entities` | ~9    | Spec 1     |
| 25  | Tag editing in the sheet, tags on the row | `feat/todo-experience-s7-dt25-tag-ui`       | ~5    | DevTask 24 |
| 26  | Search overlay across all lists           | `feat/todo-experience-s7-dt26-search`       | ~5    | DevTask 25 |

### DevTask 26 — search

Pull down at the top of the list to reveal search, the convention in all three reference apps. Matching runs against the IndexedDB stores, so results are identical online and offline. Matches by title substring and by tag name. No fuzzy matching, no suggestions, no "did you mean" — `UX.md` § 6 specifies `No tasks match "<query>".` and nothing else.

---

## Test Plan

- **Unit:** search matching over a fixture set, including tag matches and the empty-result case.
- **Integration:** applying the same tag to tasks in different lists; removing a tag on one device while renaming it on another.
- **Component:** tag route contract incl. default-deny; Storybook play function for tag entry.
- **E2E:** `e2e/tags_and_search.e2e.spec.ts` covering the five Spec 6 stories, including `a user searches while offline and still gets results`.

## Initiative close-out (this Spec owns it)

Per `AGENTS.md` → Initiative close-out checklist, the final DevTask of this Spec:

1. Confirms every DESIGN.md decision is covered by a feature doc or an ADR.
2. Deletes `docs/initiatives/todo-experience/{DESIGN.md, MILESTONE.md, UX.md}`.
3. Writes `docs/retrospectives/2026-XX-XX-todo-experience.md`.
4. Updates `docs/PROJECT_STATUS.md` to name `psykl-loop` as next.
5. Cuts the release tag per `README.md` → Release.
6. Creates the `feat/plan-psykl-loop` parking branch.

## Open Questions / Risks

- **Search performance at scale is untested.** A linear scan over IndexedDB is fine at hundreds of tasks and unknown at tens of thousands. Measure before optimising.
- **Tag rename semantics.** Renaming a tag is a single-row write, so it is conflict-safe — but the row-level display must read through to the tag row rather than caching the name on the task.

## Affected by / Depends on

- **Depends on:** Spec 1, Spec 5 (the sheet hosts tag editing).
- **Blocks:** nothing. Closes the initiative.
