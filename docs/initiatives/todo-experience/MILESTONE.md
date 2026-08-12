# Milestone `todo-experience` — Apple Reminders-grade task management on the PWA

**Status:** Open (design approved — UX planning next)
**Design doc:** [`DESIGN.md`](DESIGN.md)
**Effort:** L — structural data-model work plus UX-first PWA polish
**Opened:** 2026-08-12

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PWA = Progressive Web App.
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes.
> - CRUD = Create, Read, Update, Delete.
> - LWW = Last-Write-Wins — M2's conflict-resolution rule: on conflict, the most recent write wins.
> - UX = User Experience.
> - UI = User Interface.

## Description

Turn M2's offline-first but rudimentary task list into a task manager the operator would prefer over Apple Reminders for daily capture and organization.

This milestone intentionally comes before `psykl-loop`: PSYKL sessions attach to tasks, and a title-only flat list is too weak a substrate for lists, tags, due constraints, future retrospectives, and daily planning.

## Scope

1. **Generalized sync queue + Lists** — make the PWA sync queue entity-agnostic, then add Lists as the first new syncable structural entity.
2. **Sections** — add sections within a list after choosing the representation during design/engineering review.
3. **Manual ordering** — add drag-to-reorder with fractional positions rather than integer indexes; decide the concrete representation during `/plan-eng-review`.
4. **Task details** — add notes and optional due date, with optional time only when the deadline has a real time.
5. **Interaction polish** — add swipe to complete/delete, row density work, animation, and native-feeling task interactions.
6. **Tags and search** — add late because tags feed future retrospective dimensions and search becomes valuable once structure exists.

Visible priority/flag, notifications, alerts, repeat rules, shared lists, assignees, and subtasks are out of scope for this milestone. Subtasks remain deferred until lists and sections have been used in real life.

## Planning Gates

The approved design adds explicit UX-first planning before engineering lock-in:

1. `/design-consultation` — define user stories, UX expectations, screen behavior, dense-list behavior, empty states, and the Apple Reminders comparison bar.
2. `/plan-design-review` — challenge whether the UX plan is specific enough to test and still feels like PSYKL.
3. `/plan-eng-review` — lock the data model, sync queue generalization, section representation, ordering scheme, migrations, and test strategy.
4. `superpowers:writing-plans` — write Specs and DevTasks only after the gstack design/review sequence is complete.

## Architectural Risks to Settle

- **Sync queue generalization.** `SyncQueueEntry`, replay dispatch, failed operations, and response handling are currently task-shaped.
- **Ordering representation.** Fractional positions are approved over integer indexes, but the exact representation remains open. A LexoRank-style lexicographic fractional-index key is a leading candidate to compare against numeric and fixed-width decimal alternatives.
- **Section representation.** Candidate shapes are a real `sections` table, a grouping value on the task, or ordered embedded descriptors on the List model.
- **Upgrade path.** Existing offline queued entries must either migrate safely or drain before the generalized queue lands.
- **Default list.** Existing flat-list tasks need a home during migration.

## Success Criteria

- The operator prefers PSYKL to Apple Reminders for daily task capture.
- A hand-arranged list survives concurrent offline reorders on two devices with no lost arrangement, tested rather than assumed.
- Every shipped feature is used for real before the next feature starts.
- Every user-visible behavior carries an End-to-End test whose title reads as a user story.

## What Is Deferred

- PSYKL execution, boundary coaching, daily planning, and retrospectives — see [`psykl-loop`](../psykl-loop/MILESTONE.md).
- Apple-native clients — see [`apple-native`](../apple-native/MILESTONE.md).
- Multi-user authentication + tenant isolation — see [`multi-tenant-auth`](../multi-tenant-auth/MILESTONE.md).
