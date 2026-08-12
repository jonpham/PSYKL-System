# Milestone `psykl-loop` — PSYKL Execution + Retrospectives on the PWA

**Status:** Open (sketch — design doc to be drafted via `/office-hours`)
**Design doc:** _not yet drafted_
**Effort:** TBD (likely L — first new domain entity since M1, plus four product surfaces)
**Opened:** 2026-08-12

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md) → Design Doc Discipline):
>
> - PSYKL = a self-defined period of focused work, user-tunable, defaulting to 25 minutes.
> - PWA = Progressive Web App.
> - CRUD = Create, Read, Update, Delete.
> - MVP = Minimum Viable Product.
> - LWW = Last-Write-Wins (the M2 conflict-resolution rule).

## Description

Close the MVP planning loop on the PWA — turn the synced todo list M2 shipped into an actual PSYKL tool.

After M2, `components/web_client` is a well-built offline-first todo list: `TaskCreateForm`, `TaskList`, `Toast`, `VersionFooter`. Every feature that makes PSYKL-System distinct from the dozens of existing pomodoro timers and todo apps — cycle execution, boundary coaching, energy retrospectives — is still unbuilt. This milestone builds them.

These features were originally bundled with the Apple-native clients. They do not depend on a native client: [`docs/PRODUCT.md`](../../PRODUCT.md) names the PWA a **permanent** first-class surface (not a stepping stone), and it has been offline-first since M2. Delivering the product loop on the PWA first also produces the dogfooding signal that the deferred [`apple-native`](../apple-native/MILESTONE.md) milestone lists as its own prerequisite — a native client is a much better bet once the product shape is known.

## Scope

Traces to [`docs/PRODUCT.md`](../../PRODUCT.md) → Minimum Viable Product. Items 1–4 are the four remaining MVP loop steps; item 5 is the enabler they share.

1. **PSYKL execution loop** — start a cycle against a task; countdown timer (default 25 minutes, tunable per cycle and as a user default); terminate by user-completion, user-paused-for-fatigue, or timer expiry. All three terminal points are first-class and distinguishable in the stored record — the retrospective and the coaching rules both depend on knowing _how_ a cycle ended.
2. **PSYKL-boundary coaching prompt** — at each terminal point, suggest one of: take a break, move to the next task, do a recharge activity, pick a known-higher-energy task. Ships rule-based; history-informed suggestions follow once there is history to inform them.
3. **Daily plan** — compile a plan from the backlog on first pickup of the day. Per the product's selective time-independence stance, this is an ordered set of intentions, **not** clock-time scheduling — no "9am: write report" entries.
4. **Retrospective view** — calendar-grid visualization of completed cycles and tasks: what got done, and when.
5. **`cycle` entity + task-model expansion** — the persistence and sync substrate for the above, plus only as much task-model growth as items 1–4 actually require (e.g. an energy/effort signal the retrospective can aggregate). Not the full tag / estimate / dependency / notes set from Future Features.

## Architectural risk to settle during design

**The `cycle` entity is the first new domain entity since M1's `Task`.** It crosses three boundaries at once:

- `components/service-task` — Drizzle schema, generated migration, endpoints, contract tests
- `components/web_client` — the IndexedDB store (M2 Spec 2)
- the sync queue and LWW reconciliation (M2 Specs 3–4)

M2 established working patterns for all three; `cycle` should extend them rather than invent new ones. But cycles differ from tasks in a way worth thinking about before any spec is written: a cycle is an **append-mostly, time-stamped event record**, whereas `Task` is a mutable row. Whether LWW is even the right reconciliation rule for an event-shaped entity — and whether cycles are ever edited after they close — are the questions the design pass exists to answer.

Per [`AGENTS.md`](../../../AGENTS.md) → API Decision Discipline, any new endpoint shape resolves paradigm → spec discipline → framework in that order, inheriting M1's decisions unless there is a reason to re-open them.

## Success Criteria (preliminary — refine during design)

- A user can pick a task, run a full PSYKL against it, end it by any of the three terminal paths, and see a coaching suggestion appropriate to how it ended.
- Completed cycles appear in the retrospective view, and survive a reload, an offline period, and a second device — the M2 offline + multi-device guarantees are not regressed.
- A user can complete a full workday using only the PWA: open it, get a daily plan from the backlog, execute cycles against it, and review the day.
- Every user-visible behavior above ships with an End-to-End test whose title reads as a user story (per [`AGENTS.md`](../../../AGENTS.md) → Test Discipline).

## What is deferred

- **Apple-native clients** — see [`apple-native`](../apple-native/MILESTONE.md).
- **Multi-user authentication + tenant isolation** — see [`multi-tenant-auth`](../multi-tenant-auth/MILESTONE.md).
- **Energy-pattern analytics** beyond the basic retrospective surface. The server-side-vs-client-side aggregation question stays parked in [`docs/PROJECT_STATUS.md`](../../PROJECT_STATUS.md) → Open Design Surfaces.
- **Configurable term-map / UI theme architecture** (the celestial PSYKL / Earth / Moon / HelioArc / Sun naming). Fun, not load-bearing — still parked.
- **Recurring tasks and Daily Goals**, and the rest of the task-model expansion from `docs/PRODUCT.md` → Future Features.

## Prerequisites

None. This is the next executable initiative and starts from `main`.
