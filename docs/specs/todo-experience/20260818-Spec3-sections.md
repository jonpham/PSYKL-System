---
status: TODO
issue: P3
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 3
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - offline-posture-section-representation
  - offline-posture-no-foreign-keys
---

# Sections — Implementation Spec

> **Outline.** Per-Step TDD detail is written when this Spec starts.

**Date:** 2026-08-18
**Initiative:** `todo-experience`
**Spec:** 3/7
**Spec User Story:** _As the operator, I group tasks under named headings inside a list, so that a long list has structure without needing a second list._
**Time-box:** ~3 days human / ~1 Claude Code session

---

## Overview

Sections are **a real table**, decided at engineering review (resolves initiative Risk 3). A section is one row; renaming or reordering it is a single-row write that cannot collide with an edit to a different section under Last-Write-Wins. The alternatives — a grouping string on the task, or an array embedded in the list row — both make a rename a multi-row write, which is the problem fractional positions were adopted to avoid.

---

## Data Model

```ts
export const sections = pgTable('sections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  listId: text('list_id').notNull(), // nullable-style reference, NO foreign key
  title: text('title').notNull(),
  position: text('position').notNull(), // COLLATE "C" in the migration
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  serverUpdatedAt: timestamp('server_updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
```

`tasks` gains `section_id text` — nullable, no foreign key, same rule as `list_id`.

IndexedDB gains a `sections` store at schema **v3**.

---

## API

`POST /sections`, `GET /sections?list_id=`, `PATCH /sections/{id}`, `DELETE /sections/{id}` — same shapes as `/lists`.

**Deleting a section does not delete its tasks.** They return to the list's unsectioned area, per `UX.md` § 6. This is a `section_id` clear, not a cascade.

---

## DevTasks

| #   | Title                                | Branch                                                | Files | Depends on |
| --- | ------------------------------------ | ----------------------------------------------------- | ----- | ---------- |
| 11  | Section entity + endpoints           | `feat/todo-experience-s3-dt11-section-endpoints`      | ~8    | Spec 1     |
| 12  | `section_id` on tasks + IndexedDB v3 | `feat/todo-experience-s3-dt12-task-section-reference` | ~4    | DevTask 11 |
| 13  | Section headers, create, collapse    | `feat/todo-experience-s3-dt13-section-ui`             | ~6    | DevTask 12 |

DevTask 13 delivers the `New Section` entry in the list overflow menu — the affordance the design review found missing — plus collapse/expand with the count staying visible, and empty sections that are never auto-removed.

**Collapse state is device-local**, stored in `sync_meta` keyed by section id. It never enqueues.

---

## Test Plan

- **Unit:** section position generation; collapse-state persistence.
- **Integration:** section CRUD against pglite; deleting a section clears `section_id` on its tasks without deleting them; sections order by `position` under `COLLATE "C"`.
- **Component:** section route contract incl. default-deny; Storybook play function for create/rename/collapse.
- **E2E:** `e2e/sections.e2e.spec.ts` covering the five Spec 2 stories plus `a user collapses a section on one device and it stays expanded on another`.

## Open Questions / Risks

- **IndexedDB v3 is the second migration.** Reuse the v1→v2 fixture pattern from Spec 1.
- A section belongs to exactly one list. Moving a section between lists is out of scope.

## Affected by / Depends on

- **Depends on:** Spec 1.
- **Blocks:** Spec 4 (dragging a task across sections needs sections to exist).
