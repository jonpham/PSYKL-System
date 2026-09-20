# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** `todo-experience` — Apple Reminders-grade task management on the PWA. Approved design at [`docs/initiatives/todo-experience/DESIGN.md`](initiatives/todo-experience/DESIGN.md); UX plan at [`UX.md`](initiatives/todo-experience/UX.md).
**Initiative status:** 🟡 Active. Specs 1-2 shipped (below). Specs 3-7 are outlined at DevTask fidelity in `docs/initiatives/todo-experience/DESIGN.md` and get expanded via `superpowers:writing-plans` when each starts.
**Last completed initiative:** M2 — PWA CRUD + offline-first (merged PR [#66](https://github.com/jonpham/PSYKL-System/pull/66)). All M2 records live in [`docs/features/`](features/); no longer summarized here.
**Last completed spec:** `todo-experience` Spec 2 — Recently Deleted + Offline Posture ([feature doc](features/%5B20260818%5DP2_todo-experience-recently-deleted-and-offline-posture.md)). Merged PRs [#76](https://github.com/jonpham/PSYKL-System/pull/76), [#77](https://github.com/jonpham/PSYKL-System/pull/77), [#78](https://github.com/jonpham/PSYKL-System/pull/78), [#79](https://github.com/jonpham/PSYKL-System/pull/79), [#80](https://github.com/jonpham/PSYKL-System/pull/80), [#82](https://github.com/jonpham/PSYKL-System/pull/82); Spec integration [#75](https://github.com/jonpham/PSYKL-System/pull/75). Recently Deleted (30-day restore window for Tasks/Lists), server-side purge, orphan-sweep healing, and an offline write-ceiling/nag banner all shipped. Two real concurrency races were found and fixed along the way — one via TDD/Storybook during implementation, a deeper module-level one (`useTasks.sync.ts`/`useLists.sync.ts` reload staleness) found post-merge via CI flakiness on the Spec PR itself; see the feature doc's Design Decisions for both. `useSyncPressure`/`SyncPressureBanner` were renamed to `useSyncDiscrepancy`/`OutOfSyncBanner` per PR #75 review.
**Active spec for execution:** N/A — Spec 2 closed out. Spec 3 (Sections, per `UX.md` § "Spec 3 — Sections") is next but not yet expanded via `superpowers:writing-plans`.
**Next executable spec:** `todo-experience` Spec 3 — Sections. Start with `superpowers:writing-plans` against `DESIGN.md`/`UX.md` § "Spec 3 — Sections", per the initiative's UI/UX-first DevTask ordering.
**Branch:** `feat/apple-reminders-prototype` — Experimental lane, `apple-reminders-ux` / `sidebar-navigation` iteration in implementation for operator review at `/exp/apple-reminders-ux`. No active Spec branch. Release `v0.4.0` cut from Spec 2's merge commit; deploy pin bump to `PSYKL-GitOps` in progress (see Homelab deploy section below).
**Known blockers:** None.
**Workflow lanes:** Production (Initiative → Spec → DevTask) per [`docs/workflows/production-dev-workflow.md`](workflows/production-dev-workflow.md); Experimental (UI/UX prototyping at `/exp/{slug}`) per [`docs/workflows/experimental-feature-workflow.md`](workflows/experimental-feature-workflow.md). Routing table in [`AGENTS.md`](../AGENTS.md) → Workflow Routing. **Active experiment:** `apple-reminders-ux`, iteration `sidebar-navigation`; next action is browser/iPhone validation after implementation checks pass.

**Homelab deploy** (k3s cluster **robin**, LAN-only at `psykl.lan.witty-m.com`, GitOps via `PSYKL-GitOps`): live, deployed via ArgoCD, semver-pinned image tags. Full runbook at [`README.md` → Deploy to k3s](../README.md#deploy-to-k3s-homelab--robin); architecture at [ADR-M2-010](ARCHITECTURE.md). Not tied to any active Spec — update `PSYKL-GitOps/apps/psykl/values-robin.yaml` and merge to redeploy.

**Roadmap:** Apple-native client work is deferred in favor of maturing the PWA first. `psykl-loop` is next after `todo-experience`, seeded at [`docs/initiatives/psykl-loop/MILESTONE.md`](initiatives/psykl-loop/MILESTONE.md). Milestones from `psykl-loop` onward are tagged (not ordinal-numbered) since the remaining roadmap is a set of candidates, not a sequence — see [`docs/PRODUCT.md`](PRODUCT.md) → Milestone Roadmap.

## How to Pick Up This Project (for any AI agent)

1. **Read in this order:** [`README.md`](../README.md) (quickstart) → [`CLAUDE.md`](../CLAUDE.md)/[`AGENTS.md`](../AGENTS.md) (working agreement, vocabulary, Test Discipline, Git Conventions, Workflow Routing) → [`docs/workflows/`](workflows/) (the lane you are working in) → [`docs/PRODUCT.md`](PRODUCT.md) (product brief, Sync and Sharing Model) → [`docs/STACK.md`](STACK.md) (shipped stack) → [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) (ADRs) → this file → [`docs/features/`](features/) (completed-feature records) → the active initiative's `DESIGN.md`/`UX.md`/`MILESTONE.md` under `docs/initiatives/todo-experience/`.
2. **Vocabulary:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity. Unrelated.
3. **The Decisions appendix in any `APPROVED` design doc is normative.** Surface for discussion, don't silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** each DevTask gets its own PR, merged before the next starts ([`docs/workflows/production-dev-workflow.md`](workflows/production-dev-workflow.md) → Subagent-Driven Development Discipline); stack only on a real dependency; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Initiative Summary

| Initiative                    | Theme                                                        | Status                        | Initiative Doc                                         |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------ |
| M2 — PWA CRUD + offline-first | Complete Task Create/Read/Update/Delete + offline-first sync | 🟢 Done — merged via PR #66   | [`docs/features/`](features/)                          |
| `todo-experience`             | Apple Reminders-grade task management on the PWA             | 🟡 Active — Specs 1-2 shipped | [`todo-experience/`](initiatives/todo-experience/)     |
| `psykl-loop`                  | PSYKL execution, boundary behavior, retrospectives           | ⚪ Next — sketched            | [`psykl-loop/`](initiatives/psykl-loop/)               |
| `apple-native`                | iOS, iPadOS, macOS SwiftUI clients                           | 🔵 Deferred — unsequenced     | [`apple-native/`](initiatives/apple-native/)           |
| `multi-tenant-auth`           | Real authentication, multi-tenant data isolation             | 🔵 Deferred — unsequenced     | [`multi-tenant-auth/`](initiatives/multi-tenant-auth/) |

Legend: 🟢 Done · 🟡 In progress · ⚪ Sketched / Not started · 🔵 Deferred (no date, no ordering claim)

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
