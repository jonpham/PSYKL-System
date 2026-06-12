# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** M2 — PWA CRUD + offline-first (`docs/initiatives/m2-pwa-crud-offline/`).
**Initiative status:** 🟡 In execution. [`DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md) was drafted via `/office-hours` (adapted), reviewed via scoped `/plan-eng-review`, and promoted during `superpowers:writing-plans` on 2026-06-10. Architectural decisions #34-#56 are closed. Specs 1-2 are complete.
**Last completed spec:** M2 Spec 2 — PWA IndexedDB store + `useSyncExternalStore` ([`[20260612]GH39_m2-pwa-indexeddb-store.md`](features/%5B20260612%5DGH39_m2-pwa-indexeddb-store.md)).
**Active spec for execution:** N/A — Spec 2 close-out is in final DevTask review.
**Next executable spec:** M2 Spec 3 — Sync engine ([`20260610-S3-sync-engine.md`](specs/m2-pwa-crud-offline/20260610-S3-sync-engine.md)).
**Active skill:** `superpowers:executing-plans` completing M2 Spec 2 close-out.
**Branch:** `feat/m2-s2-dt6-use-tasks-store`, branched from `spec/m2-s2-pwa-indexeddb-store`.
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
   - [`docs/initiatives/m2-pwa-crud-offline/DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md) — approved M2 design for spec planning
   - [`docs/features/[20260610]GH38_m2-service-task-patch-delete-lww-idempotency.md`](features/%5B20260610%5DGH38_m2-service-task-patch-delete-lww-idempotency.md) — completed M2 Spec 1 record
   - [`docs/features/[20260612]GH39_m2-pwa-indexeddb-store.md`](features/%5B20260612%5DGH39_m2-pwa-indexeddb-store.md) — completed M2 Spec 2 record
   - [`docs/specs/m2-pwa-crud-offline/`](specs/m2-pwa-crud-offline/) — generated M2 execution specs P3-P6
   - [`docs/initiatives/m2-pwa-crud-offline/issues/`](initiatives/m2-pwa-crud-offline/issues/) — issue-shaped M2 Spec briefs P3-P6 used as planning inputs
2. **Vocabulary to memorize:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity (the `id, user_id, title, created_at` record). They are unrelated.
3. **The Decisions appendix is normative.** If a decision looks wrong, surface it for user discussion — do not silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** siblings off the Spec integration branch unless K+1 depends on K's unmerged work; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md). M2 planned architecture lives in [`docs/initiatives/m2-pwa-crud-offline/DESIGN.md`](initiatives/m2-pwa-crud-offline/DESIGN.md) until implementation ships and durable docs are refreshed.

## Initiative Summary

| Initiative                            | Theme                                                             | Status                               | Initiative Doc                                                                         |
| ------------------------------------- | ----------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| M2 — PWA CRUD + offline-first         | Complete Task Create/Read/Update/Delete + offline-first sync      | 🟡 In execution — Specs 1-2 complete | [`m2-pwa-crud-offline/`](initiatives/m2-pwa-crud-offline/)                             |
| M3 — Apple-native + product discovery | iOS, iPadOS, macOS clients + PSYKL execution + retrospectives     | ⚪ Sketched                          | [`m3-apple-native-product-discovery/`](initiatives/m3-apple-native-product-discovery/) |
| M4 — Multi-user auth + homelab        | Real authentication, multi-user data isolation, homelab self-host | ⚪ Sketched                          | [`m4-multi-user-auth-homelab/`](initiatives/m4-multi-user-auth-homelab/)               |

Legend: 🟢 Done · 🟡 In progress · ⚪ Sketched / Not started

## M2 Specs

Generated by `superpowers:writing-plans` on 2026-06-10 from the M2 design, milestone doc, and issue briefs.

| Spec | Title                                         | Execution spec                                                                                                                                  | DevTasks        |
| ---- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| M2-1 | service-task PATCH/DELETE + LWW + Idempotency | [`[20260610]GH38_m2-service-task-patch-delete-lww-idempotency.md`](features/%5B20260610%5DGH38_m2-service-task-patch-delete-lww-idempotency.md) | Complete        |
| M2-2 | PWA IndexedDB store + useSyncExternalStore    | [`[20260612]GH39_m2-pwa-indexeddb-store.md`](features/%5B20260612%5DGH39_m2-pwa-indexeddb-store.md)                                             | Complete        |
| M2-3 | Sync engine                                   | [`20260610-S3-sync-engine.md`](specs/m2-pwa-crud-offline/20260610-S3-sync-engine.md)                                                            | M2-7..M2-8 next |
| M2-4 | Service Worker + Background Sync              | [`20260610-S4-service-worker-background-sync.md`](specs/m2-pwa-crud-offline/20260610-S4-service-worker-background-sync.md)                      | M2-9..M2-10     |
| M2-5 | PWA CRUD UI polish                            | [`20260610-S5-pwa-crud-ui-polish.md`](specs/m2-pwa-crud-offline/20260610-S5-pwa-crud-ui-polish.md)                                              | M2-11..M2-12    |
| M2-6 | Multi-device E2E + offline harness            | [`20260610-S6-multi-device-e2e-harness.md`](specs/m2-pwa-crud-offline/20260610-S6-multi-device-e2e-harness.md)                                  | M2-13           |

## Remaining Planning Gates

| Gate                         | Status                      | Required action                                                                                                                 |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| M2 design user review        | Satisfied for spec planning | User requested `superpowers:writing-plans` on 2026-06-10, promoting the design into spec generation.                            |
| Durable product-doc refresh  | Done                        | `docs/PRODUCT.md` Surface Areas records the PWA as the permanent non-Apple client surface.                                      |
| Code style + linting routing | Done                        | Spec M2-1 explicitly defers broad linting/TypeScript/formatting/commit-style tightening until after M2 or a hygiene initiative. |
| M2 execution spec generation | Done                        | Specs live under [`docs/specs/m2-pwa-crud-offline/`](specs/m2-pwa-crud-offline/).                                               |

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
