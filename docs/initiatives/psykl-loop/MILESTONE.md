# Milestone `psykl-loop` — PSYKL Execution + Retrospectives on the PWA

**Status:** Next (sketch — starts after `todo-experience`)
**Design doc:** _not yet drafted_
**Effort:** TBD (likely M-L — sessions are append-only, but the loop spans UX, persistence, and retrospectives)
**Opened:** 2026-08-12

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes.
> - PWA = Progressive Web App.
> - CRUD = Create, Read, Update, Delete.
> - MVP = Minimum Viable Product.
> - LWW = Last-Write-Wins (the M2 conflict-resolution rule).

## Description

Close the MVP planning loop on the PWA after the task-management substrate is mature enough to carry it.

The approved [`todo-experience`](../todo-experience/DESIGN.md) design split task-management quality from PSYKL execution. That milestone comes first so users have Lists, Sections, ordering, details, tags, search, and UX polish before PSYKL sessions attach to tasks.

## Scope

Traces to [`docs/PRODUCT.md`](../../PRODUCT.md) → Minimum Viable Product and to the Appendix in [`todo-experience/DESIGN.md`](../todo-experience/DESIGN.md).

1. **PSYKL execution loop** — start a fixed-period work session against a task; show a focused countdown; terminate by completion, pause, or elapsed time.
2. **Break loop** — after time elapses, enter a fixed break and then ask whether to continue or do something else.
3. **Session records** — persist a `Task` to `PSYKL session` one-to-many relationship. A session is one start/stop event; pausing ends the session, and a task can accumulate many sessions.
4. **Rule-based boundary behavior** — v1 is deterministic rather than adaptive. "Take a fixed break" is a rule; history-informed coaching waits until there is history.
5. **Retrospective views** — sequence views by data honesty: time-on-task after one session, today's timeline after one day, cross-day patterns after several weeks.

## Architectural risk to settle during design

**The session entity differs from mutable Tasks.** Sessions are immutable append-only events, not mutable rows. Two devices appending sessions do not conflict in the same way two devices patching one Task can conflict. The design pass should avoid dragging M2's LWW machinery into sessions unless a real mutable-session use case appears.

The generalized sync queue from `todo-experience` should already exist by this milestone. `psykl-loop` should reuse that substrate rather than paying for entity-agnostic sync here.

Per [`AGENTS.md`](../../../AGENTS.md) → API Decision Discipline, any new endpoint shape resolves paradigm → spec discipline → framework in that order, inheriting M1's decisions unless there is a reason to re-open them.

## Success Criteria (preliminary — refine during design)

- A user can pick a task, run a full PSYKL against it, end it by completion, pause, or elapsed time, and see the next loop state.
- Completed sessions appear in the appropriate retrospective view and survive reload, offline use, and a second device.
- A user can complete a workday using only the PWA: choose work from the task list, execute sessions, and review what happened.
- Every user-visible behavior above ships with an End-to-End test whose title reads as a user story (per [`AGENTS.md`](../../../AGENTS.md) → Test Discipline).

## What is deferred

- **Apple-native clients** — see [`apple-native`](../apple-native/MILESTONE.md).
- **Multi-user authentication + tenant isolation** — see [`multi-tenant-auth`](../multi-tenant-auth/MILESTONE.md).
- **Energy-pattern analytics** beyond the basic retrospective surface. The server-side-vs-client-side aggregation question stays parked in [`docs/PROJECT_STATUS.md`](../../PROJECT_STATUS.md) → Open Design Surfaces.
- **Configurable term-map / UI theme architecture** (the celestial PSYKL / Earth / Moon / HelioArc / Sun naming). Fun, not load-bearing — still parked.
- **Todo management structure and polish** — owned by [`todo-experience`](../todo-experience/MILESTONE.md).

## Prerequisites

Complete `todo-experience` enough that tasks have the structure and UX needed for sessions to attach to them.
