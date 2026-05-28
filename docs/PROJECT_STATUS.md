# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Last completed spec:** M1 Spec 3 — web_client Minimal PWA. Feature doc: [`[20260520]GH4_m1-web-client-minimal-pwa.md`](features/%5B20260520%5DGH4_m1-web-client-minimal-pwa.md). Spec integration PR [#21](https://github.com/jonpham/PSYKL-System/pull/21) is merged to `main`.
**Active initiative:** M1 Bootstrap (`docs/initiatives/m1-bootstrap/`) — APPROVED + 3 of 6 specs shipped (S1, S2, S3); 3 remaining (S4, S5, S6).
**Active spec for execution:** N/A.
**Next executable spec:** M1 Spec 4 — local dev stack (`docs/specs/m1-bootstrap/20260520-S4-local-dev-stack.md`); start with a fresh session and `superpowers:subagent-driven-development` against that plan.
**Active skill:** Idle.
**Branch:** `main` is current through Spec 3 close-out plus follow-up docs/tooling fixes. Next work should branch from `main`.
**Current step:** N/A — between Specs.
**Next action:** Start a fresh Spec 4 execution session with `superpowers:subagent-driven-development` against `docs/specs/m1-bootstrap/20260520-S4-local-dev-stack.md`. Do NOT merge any Pull Request without explicit user approval in the current session.
**Known blockers:** None for planning. For execution: (1) Per AGENTS.md Decision #16, the subtree mirror repos `jonpham/psykl-web_client` and `jonpham/psykl-service-task` must be created (empty, public) and the `SUBTREE_PUSH_TOKEN` GitHub Actions secret set before Spec 6's DevTask 10 runs. (2) GitHub branch protection on `main` (Decision #17) is a manual repo-settings change that should happen after Spec 5's CI lands green.

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
   - [`docs/initiatives/m1-bootstrap/DESIGN.md`](initiatives/m1-bootstrap/DESIGN.md) — the M1 design and 34-entry Decisions appendix
   - [`docs/initiatives/m1-bootstrap/issues/`](initiatives/m1-bootstrap/issues/) — issue briefs for pending Specs (S4, S5, S6); shipped Specs are consolidated into `docs/features/`
   - [`docs/specs/m1-bootstrap/`](specs/m1-bootstrap/) — execution plans for pending Specs (S4, S5, S6); shipped Specs' plans are deleted at Spec close-out per AGENTS.md doc-sprawl rule
2. **Vocabulary to memorize:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity (the `id, user_id, title, created_at` record). They are unrelated.
3. **The Decisions appendix is normative.** If a decision looks wrong, surface it for user discussion — do not silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** siblings off the Spec integration branch unless K+1 depends on K's unmerged work; rebase onto `origin/<target>` before opening any PR.

## M1 Stack

See [`docs/STACK.md`](STACK.md) for the canonical M1 stack table (what's shipped vs what's pending). Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Initiative Summary

| Initiative                            | Theme                                                                                | Status                                                  | Initiative Doc                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| M1 — Bootstrap                        | Vertical slice + test pyramid + Continuous Integration / Continuous Deployment infra | 🟡 In progress — S1, S2, S3 shipped; S4, S5, S6 pending | [`m1-bootstrap/`](initiatives/m1-bootstrap/)                                           |
| M2 — PWA CRUD + offline-first         | Complete Task Create/Read/Update/Delete + offline-first sync                         | ⚪ Sketched                                             | [`m2-pwa-crud-offline/`](initiatives/m2-pwa-crud-offline/)                             |
| M3 — Apple-native + product discovery | iOS, iPadOS, macOS clients + PSYKL execution + retrospectives                        | ⚪ Sketched                                             | [`m3-apple-native-product-discovery/`](initiatives/m3-apple-native-product-discovery/) |
| M4 — Multi-user auth + homelab        | Real authentication, multi-user data isolation, homelab self-host                    | ⚪ Sketched                                             | [`m4-multi-user-auth-homelab/`](initiatives/m4-multi-user-auth-homelab/)               |

Legend: 🟢 Done · 🟡 In progress · ⚪ Sketched / Not started

## M1 Specs

| Spec | Title                    | Status                                      | Feature doc                                                                                                 |
| ---- | ------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| S1   | Workspace Bootstrap      | 🟢 Shipped                                  | [`[20260520]GH2_m1-workspace-bootstrap.md`](features/%5B20260520%5DGH2_m1-workspace-bootstrap.md)           |
| S2   | service-task Minimal API | 🟢 Shipped                                  | [`[20260520]GH3_m1-service-task-minimal-api.md`](features/%5B20260520%5DGH3_m1-service-task-minimal-api.md) |
| S3   | web_client Minimal PWA   | 🟢 Shipped                                  | [`[20260520]GH4_m1-web-client-minimal-pwa.md`](features/%5B20260520%5DGH4_m1-web-client-minimal-pwa.md)     |
| S4   | Local Dev Stack          | ⚪ Pending — execution plan ready           | _written at close-out_                                                                                      |
| S5   | CI Test Pipeline         | ⚪ Pending — execution plan ready           | _written at close-out_                                                                                      |
| S6   | CD Release Pipeline      | ⚪ Pending — execution plan ready           | _written at close-out_                                                                                      |

## Remaining Design Areas That Require `/plan-eng-review`

The current M1 design has had its architectural Open Questions closed. These are the **future** review surfaces — none active right now.

| When                                                      | Artifact                                                                                            | Review needed                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| After each Spec is written by `superpowers:writing-plans` | `docs/specs/m1-bootstrap/{spec}.md`                                                                 | Per-Spec `/plan-eng-review` IF the Spec introduces architectural choices not already decided in the M1 DESIGN.md (e.g., Spec 6's container-registry choice between GitHub Container Registry vs Docker Hub vs Harbor). Most M1 Specs will not need this because decisions are pre-locked.                               |
| Before M2 specs are written                               | `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` (does not exist yet — produced by `/office-hours`) | M2 design will introduce real architectural decisions: offline-first sync engine (last-write-wins implementation details, IndexedDB schema, queue durability, conflict resolution UI), Service Worker scope, optimistic-update strategy. `/plan-eng-review` against the M2 design doc.                                  |
| Before M3 specs are written                               | `docs/initiatives/m3-apple-native-product-discovery/DESIGN.md`                                      | M3 will be the heaviest review: SwiftUI multiplatform vs Mac Catalyst, sync architecture between iOS and `service-task`, energy-retrospective aggregation (client-side vs server-side decision finally landing), PSYKL-boundary coaching algorithm shape, push notification strategy, App Store submission constraints. |
| Before M4 specs are written                               | `docs/initiatives/m4-multi-user-auth-homelab/DESIGN.md`                                             | M4: authentication mechanism (OAuth provider vs magic-link email vs password+session), session-state storage, multi-tenancy enforcement at the Drizzle layer, homelab deployment guide validation.                                                                                                                      |
| Periodically as M2+ are exercised                         | `docs/PRODUCT.md` and AGENTS.md                                                                     | If the dogfood retrospectives change PSYKL's product direction or working-agreement principles, re-review affected docs.                                                                                                                                                                                                |

## Open Design Surfaces (parked, will resurface in later milestones)

Not blocking anything today; documented so they don't get lost.

| Surface                                                                                                                                                                                                                                                                                   | Parked at                          | Owning milestone |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------- |
| Offline-first sync engine architecture (Service Worker scope, IndexedDB shape, sync queue, last-write-wins implementation)                                                                                                                                                                | `/office-hours`                    | M2               |
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
