# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** `to-do-ui` — migrate the accepted `apple-reminders-ux` prototype into production. Design at [`docs/initiatives/to-do-ui/DESIGN.md`](initiatives/to-do-ui/DESIGN.md); milestone at [`MILESTONE.md`](initiatives/to-do-ui/MILESTONE.md).
**Initiative status:** 🟡 Active. Specs 1-5 are merged to `main` and released as **v0.5.0**; Spec 6 (retire the experiment, close out the initiative) remains outlined in [`docs/specs/to-do-ui/`](specs/to-do-ui/).
**Paused initiative:** `todo-experience` — Specs 1-2 shipped (below); **Specs 3-7 are paused pending a UI rebase onto the `to-do-ui` surface.** Their written specs in `docs/specs/todo-experience/` drive the surface `to-do-ui` replaces, so they are rebased after this initiative lands. [`todo-experience/DESIGN.md`](initiatives/todo-experience/DESIGN.md) stays APPROVED and unedited — its data-model decisions are inputs to `to-do-ui`, not subjects of it (`to-do-ui` DESIGN.md → Decision 2).
**Last completed initiative:** M2 — PWA CRUD + offline-first (merged PR [#66](https://github.com/jonpham/PSYKL-System/pull/66)). All M2 records live in [`docs/features/`](features/); no longer summarized here.
**Last completed spec:** `to-do-ui` Spec 5 — Sync, Recently Deleted, and Settings ([feature doc](features/%5B20260922%5DP5_to-do-ui-sync-recently-deleted-and-settings.md)).
**Active spec for execution:** N/A. The lightweight production parity change for [#122](https://github.com/jonpham/PSYKL-System/issues/122) is consolidated in its [feature doc](features/%5B20260922%5DGH122_to-do-ui-production-prototype-parity.md); [PR #130](https://github.com/jonpham/PSYKL-System/pull/130) is open for review.
**Current execution:** Parity implementation, verification, and documentation close-out are complete on the feature branch. `to-do-ui` Specs 1-5 are merged and released as v0.5.0.

**Next executable work:** Review and merge [PR #130](https://github.com/jonpham/PSYKL-System/pull/130) with operator approval; then `to-do-ui` Spec 6 — retire the experiment and close out the initiative ([outline](specs/to-do-ui/20260921-Spec6-retire-experiment-and-close-out.md)).
**Branch:** `feat/122-production-prototype-v0.5-parity`.
**Known blockers:** None blocking. [#117](https://github.com/jonpham/PSYKL-System/issues/117) is open and deferred to `multi-tenant-auth`: `DEFAULT_LIST_ID` is a shared constant while `lists.id` is a global primary key, so a second account cannot create its default list. Not user-facing while PSYKL is single-user, but it blocks per-user end-to-end isolation, which is why the suite resets server state between tests instead. The contrast question raised on 2026-09-21 is resolved — the app ships **Standard** (default) and **Increased** contrast as a device-local Settings choice. See [`docs/DESIGN.md`](DESIGN.md) → Contrast — Standard and Increased, and `to-do-ui` DESIGN.md → Decision 5.
**Workflows:** Production (Initiative → Spec → DevTask) per [`docs/workflows/production-dev-workflow.md`](workflows/production-dev-workflow.md); Lightweight per [`docs/workflows/lightweight-feature-workflow.md`](workflows/lightweight-feature-workflow.md), with `target = prototype` (UI/UX prototyping at `/exp/{slug}`) and `target = production` (small decided changes to shipped surfaces, artifacts under `docs/specs/`). Routing table in [`AGENTS.md`](../AGENTS.md) → Workflow Routing. **Active experiment:** none. `apple-reminders-ux` is **accepted and promoted** — all three iterations (`sidebar-navigation`, `sync-status`, `apple-reminders-ui`) are absorbed by the `to-do-ui` initiative, which retires the experiment in its Spec 6.

**Homelab deploy** (k3s cluster **robin**, LAN-only at `psykl.lan.witty-m.com`, GitOps via `PSYKL-GitOps`): live, deployed via ArgoCD, semver-pinned image tags. Full runbook at [`README.md` → Deploy to k3s](../README.md#deploy-to-k3s-homelab--robin); architecture at [ADR-M2-010](ARCHITECTURE.md). Not tied to any active Spec — update `PSYKL-GitOps/apps/psykl/values-robin.yaml` and merge to redeploy.

**Roadmap:** Apple-native client work is deferred in favor of maturing the PWA first. `to-do-ui` runs now; `todo-experience` Specs 3-7 resume after it; `psykl-loop` follows, seeded at [`docs/initiatives/psykl-loop/MILESTONE.md`](initiatives/psykl-loop/MILESTONE.md). Milestones from `psykl-loop` onward are tagged (not ordinal-numbered) since the remaining roadmap is a set of candidates, not a sequence — see [`docs/PRODUCT.md`](PRODUCT.md) → Milestone Roadmap.

## How to Pick Up This Project (for any AI agent)

1. **Read in this order:** [`README.md`](../README.md) (quickstart) → [`CLAUDE.md`](../CLAUDE.md)/[`AGENTS.md`](../AGENTS.md) (working agreement, vocabulary, Test Discipline, Git Conventions, Workflow Routing) → [`docs/workflows/`](workflows/) (the lane you are working in) → [`docs/PRODUCT.md`](PRODUCT.md) (product brief, Sync and Sharing Model) → [`docs/STACK.md`](STACK.md) (shipped stack) → [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) (ADRs) → this file → [`docs/features/`](features/) (completed-feature records) → the active initiative's `DESIGN.md`/`MILESTONE.md` under `docs/initiatives/to-do-ui/`, plus its Spec outlines in `docs/specs/to-do-ui/`.
2. **Vocabulary:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity. Unrelated.
3. **The Decisions appendix in any `APPROVED` design doc is normative.** Surface for discussion, don't silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** each DevTask gets its own PR, merged before the next starts ([`docs/workflows/production-dev-workflow.md`](workflows/production-dev-workflow.md) → Subagent-Driven Development Discipline); stack only on a real dependency; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Initiative Summary

| Initiative                    | Theme                                                               | Status                                               | Initiative Doc                                         |
| ----------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| M2 — PWA CRUD + offline-first | Complete Task Create/Read/Update/Delete + offline-first sync        | 🟢 Done — merged via PR #66                          | [`docs/features/`](features/)                          |
| `to-do-ui`                    | Migrate the accepted `apple-reminders-ux` prototype into production | 🟡 Active — Specs 1-5 shipped; Spec 6 next           | [`to-do-ui/`](initiatives/to-do-ui/)                   |
| `todo-experience`             | Apple Reminders-grade task management on the PWA                    | ⏸️ Paused — Specs 1-2 shipped; 3-7 await a UI rebase | [`todo-experience/`](initiatives/todo-experience/)     |
| `psykl-loop`                  | PSYKL execution, boundary behavior, retrospectives                  | ⚪ Next — sketched                                   | [`psykl-loop/`](initiatives/psykl-loop/)               |
| `apple-native`                | iOS, iPadOS, macOS SwiftUI clients                                  | 🔵 Deferred — unsequenced                            | [`apple-native/`](initiatives/apple-native/)           |
| `multi-tenant-auth`           | Real authentication, multi-tenant data isolation                    | 🔵 Deferred — unsequenced                            | [`multi-tenant-auth/`](initiatives/multi-tenant-auth/) |

Legend: 🟢 Done · 🟡 In progress · ⏸️ Paused (sequenced, waiting on another initiative) · ⚪ Sketched / Not started · 🔵 Deferred (no date, no ordering claim)

## Open Design Surfaces

Not blocking anything today; documented so they don't get lost.

| Surface                                                                        | Parked at                                            | Owning milestone    |
| ------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------- |
| Server-side vs client-side retrospective aggregation                           | `/office-hours` parked                               | `psykl-loop`+       |
| Configurable UI theme — term-map half (renaming PSYKL/Earth/Moon/HelioArc/Sun) | [`docs/DESIGN.md`](DESIGN.md) → Theming Architecture | unassigned          |
| Multi-user auth scheme (OAuth provider vs magic-link vs password+session)      | `/office-hours`                                      | `multi-tenant-auth` |
| Homelab multi-instance deployment guide                                        | `/office-hours`                                      | `multi-tenant-auth` |
| Apple Watch integration (movement detection for fatigue / distraction signals) | `docs/PRODUCT.md` future features                    | Unassigned          |
| iCloud / Google Calendar sync                                                  | `docs/PRODUCT.md` future features                    | Unassigned          |
| Apple Reminders import / two-way sync                                          | `docs/PRODUCT.md` future features                    | Unassigned          |

## Backlog ideas (not on the milestone roadmap)

See [`docs/BACKLOG_IDEAS.md`](BACKLOG_IDEAS.md) for someday/maybe items. Currently tracked: **gRPC learning side-quest** (add one gRPC model to NestJS for personal learning; not architecturally needed).
