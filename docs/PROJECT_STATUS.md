# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** M2 — PWA CRUD + offline-first (`docs/initiatives/m2-pwa-crud-offline/`).
**Initiative status:** 🟡 DRAFT design. [`DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md) was drafted via `/office-hours` (adapted) and reviewed via scoped `/plan-eng-review`; architectural decisions #34-#56 are closed. M2 is pending user design review/approval before promotion to APPROVED.
**Active spec for execution:** N/A.
**Next executable step:** User reviews the M2 design. If accepted, promote `DESIGN.md` from DRAFT to APPROVED, land the durable `docs/PRODUCT.md` Surface Areas update required by Decision #54, then invoke `superpowers:writing-plans` to create execution specs under `docs/specs/m2-pwa-crud-offline/`.
**Active skill:** M2 planning branch maintenance (`/office-hours` + `/plan-eng-review` artifacts already exist).
**Branch:** Initiative planning branch `feat/plan-m2-pwa-crud-offline` (doc changes only; rebased onto current `origin/main`).
**Known blockers:** None.

## How to Pick Up This Project (for any AI agent, mid-2026 or later)

1. **Read in this order:**
   - [`README.md`](../README.md) — developer quickstart (install, scripts, verification, deploy)
   - [`CLAUDE.md`](../CLAUDE.md) → sources [`AGENTS.md`](../AGENTS.md)
   - [`AGENTS.md`](../AGENTS.md) — working agreement, vocabulary (Project / Initiative / Spec / DevTask / Step / Feature), Test Discipline (5-layer pyramid, TDD mandatory), Git Conventions (sibling-default DevTask branches; stacking only on real dependency; rebase-before-PR), naming conventions, skill routing
   - [`docs/PRODUCT.md`](PRODUCT.md) — product brief; the Sync and Sharing Model (single-user multi-device, no collaboration ever)
   - [`docs/STACK.md`](STACK.md) — what's shipped (tech stack table per milestone)
   - [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — durable architectural decisions (ADRs) and component descriptions for everything that's shipped
   - [`docs/PROJECT_STATUS.md`](PROJECT_STATUS.md) — this file
   - [`docs/features/`](features/) — completed-feature records (one per shipped Spec)
   - [`docs/initiatives/m2-pwa-crud-offline/DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md) — active M2 design, currently DRAFT pending user review/approval
   - [`docs/initiatives/m2-pwa-crud-offline/issues/`](initiatives/m2-pwa-crud-offline/issues/) — issue-shaped M2 Spec briefs P1-P6 for `superpowers:writing-plans`
2. **Vocabulary to memorize:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity (the `id, user_id, title, created_at` record). They are unrelated.
3. **The Decisions appendix is normative.** If a decision looks wrong, surface it for user discussion — do not silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** siblings off the Spec integration branch unless K+1 depends on K's unmerged work; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md). M2 planned architecture lives in [`docs/initiatives/m2-pwa-crud-offline/DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md) until implementation ships and durable docs are refreshed.

## Initiative Summary

| Initiative                            | Theme                                                             | Status                                                                            | Initiative Doc                                                                         |
| ------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| M2 — PWA CRUD + offline-first         | Complete Task Create/Read/Update/Delete + offline-first sync      | 🟡 DRAFT design — pending user review/approval before `superpowers:writing-plans` | [`m2-pwa-crud-offline/`](initiatives/m2-pwa-crud-offline/)                             |
| M3 — Apple-native + product discovery | iOS, iPadOS, macOS clients + PSYKL execution + retrospectives     | ⚪ Sketched                                                                       | [`m3-apple-native-product-discovery/`](initiatives/m3-apple-native-product-discovery/) |
| M4 — Multi-user auth + homelab        | Real authentication, multi-user data isolation, homelab self-host | ⚪ Sketched                                                                       | [`m4-multi-user-auth-homelab/`](initiatives/m4-multi-user-auth-homelab/)               |

Legend: 🟢 Done · 🟡 In progress · ⚪ Sketched / Not started

## M2 Draft Specs

The M2 design currently breaks down into these issue-shaped Spec briefs. These are planning inputs for `superpowers:writing-plans`, not execution specs yet.

| Draft Spec | Title                                         | Brief                                                                                                                                                           |
| ---------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2-1       | service-task PATCH/DELETE + LWW + Idempotency | [`P1_m2-service-task-patch-delete-lww-idempotency.md`](initiatives/m2-pwa-crud-offline/issues/%5B20260522%5DP1_m2-service-task-patch-delete-lww-idempotency.md) |
| M2-2       | PWA IndexedDB store + useSyncExternalStore    | [`P2_m2-pwa-indexeddb-store.md`](initiatives/m2-pwa-crud-offline/issues/%5B20260522%5DP2_m2-pwa-indexeddb-store.md)                                             |
| M2-3       | Sync engine                                   | [`P3_m2-sync-engine.md`](initiatives/m2-pwa-crud-offline/issues/%5B20260522%5DP3_m2-sync-engine.md)                                                             |
| M2-4       | Service Worker + Background Sync              | [`P4_m2-service-worker-background-sync.md`](initiatives/m2-pwa-crud-offline/issues/%5B20260522%5DP4_m2-service-worker-background-sync.md)                       |
| M2-5       | PWA CRUD UI polish                            | [`P5_m2-pwa-crud-ui-polish.md`](initiatives/m2-pwa-crud-offline/issues/%5B20260522%5DP5_m2-pwa-crud-ui-polish.md)                                               |
| M2-6       | Multi-device E2E + offline harness            | [`P6_m2-multi-device-e2e-harness.md`](initiatives/m2-pwa-crud-offline/issues/%5B20260522%5DP6_m2-multi-device-e2e-harness.md)                                   |

## Remaining Planning Gates

| Gate                         | Status                     | Required action                                                                                                                                             |
| ---------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M2 design user review        | Open                       | User reviews [`DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md), requests changes or approves it.                                                     |
| Durable product-doc refresh  | Open                       | If M2-P10 is accepted, update `docs/PRODUCT.md` Surface Areas to record the PWA as a permanent non-Apple client before execution begins.                    |
| Code style + linting routing | Open                       | `superpowers:writing-plans` must route M2-P11 into a concrete DevTask or explicitly defer specific linting/TypeScript/formatting candidates with rationale. |
| M2 execution spec generation | Blocked on design approval | Invoke `superpowers:writing-plans` after approval to generate `docs/specs/m2-pwa-crud-offline/*.md`.                                                        |

## Open Design Surfaces

Not blocking anything today; documented so they don't get lost.

| Surface                                                                                                                                                                                                                                                                                   | Parked at                          | Owning milestone |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------- |
| ~~Offline-first sync engine architecture~~ — **ADDRESSED** in [M2 DESIGN.md](initiatives/m2-pwa-crud-offline/DESIGN.md): IndexedDB source-of-truth, sync queue, Service Worker scope, Background Sync, last-write-wins implementation all decided.                                        | M2 DESIGN.md                       | M2 (resolved)    |
| ~~Conflict resolution via CRDT~~ — **CLOSED, out of scope.** Per the single-user-multi-device sync model (PRODUCT.md → Sync and Sharing Model, DESIGN.md Premise 8), last-write-wins is sufficient for the lifetime of the project; CRDTs solve a multi-actor problem PSYKL doesn't have. | Permanently closed 2026-05-20      | —                |
| Server-side vs client-side retrospective aggregation                                                                                                                                                                                                                                      | `/office-hours` parked for post-M3 | M3 or M4         |
| Configurable term-map / UI theme architecture (default celestial: PSYKL/Earth/Moon/HelioArc/Sun)                                                                                                                                                                                          | `/office-hours`                    | M3+              |
| Multi-user auth scheme (OAuth provider vs magic-link vs password+session)                                                                                                                                                                                                                 | `/office-hours`                    | M4               |
| Homelab multi-instance deployment guide                                                                                                                                                                                                                                                   | `/office-hours`                    | M4               |
| Apple Watch integration (movement detection for fatigue / distraction signals)                                                                                                                                                                                                            | `docs/PRODUCT.md` future features  | M5+              |
| iCloud / Google Calendar sync                                                                                                                                                                                                                                                             | `docs/PRODUCT.md` future features  | M5+              |
| Apple Reminders import / two-way sync                                                                                                                                                                                                                                                     | `docs/PRODUCT.md` future features  | M5+              |

## Backlog ideas (not on the milestone roadmap)

See [`docs/BACKLOG_IDEAS.md`](BACKLOG_IDEAS.md) for someday/maybe items. Currently tracked: **gRPC learning side-quest** (add one gRPC model to NestJS for personal learning; not architecturally needed).
