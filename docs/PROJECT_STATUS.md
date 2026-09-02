# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** `todo-experience` — Apple Reminders-grade task management on the PWA. Approved design at [`docs/initiatives/todo-experience/DESIGN.md`](initiatives/todo-experience/DESIGN.md); UX plan at [`UX.md`](initiatives/todo-experience/UX.md).
**Initiative status:** 🟡 Active. Spec 1 shipped (below). Specs 2-7 are outlined at DevTask fidelity in `docs/specs/todo-experience/` and get expanded when each starts.
**Last completed initiative:** M2 — PWA CRUD + offline-first (merged PR [#66](https://github.com/jonpham/PSYKL-System/pull/66)). All M2 records live in [`docs/features/`](features/); no longer summarized here.
**Last completed spec:** `todo-experience` Spec 1 — Generalized Sync Queue + Lists ([feature doc](features/%5B20260818%5DP1_todo-experience-sync-queue-and-lists.md)). Merged PRs [#70](https://github.com/jonpham/PSYKL-System/pull/70), [#71](https://github.com/jonpham/PSYKL-System/pull/71), [#72](https://github.com/jonpham/PSYKL-System/pull/72) — DevTasks 7-8 were discovered via #70's code review (layered Service/Sync/API Client architecture), not in the original 6-DevTask breakdown.
**Active spec for execution:** `todo-experience` Spec 2 — Recently Deleted + offline posture ([`20260818-Spec2-recently-deleted-and-offline-posture.md`](specs/todo-experience/20260818-Spec2-recently-deleted-and-offline-posture.md)). DevTask 7/11 (Restore endpoints + `GET /deleted`) implemented, PR [#76](https://github.com/jonpham/PSYKL-System/pull/76) open against the Spec branch, awaiting review/merge. DevTask 7 was split from DESIGN.md's combined "restore + purge" DevTask per the AGENTS.md trilemma rule (11 files > ≤10 ceiling) — DevTasks renumbered 7-11, see spec doc's "Decisions made during spec drafting".
**Next executable spec:** N/A — mid-Spec 2. After DevTask 7 merges, DevTask 8 (30-day purge job) starts next.
**Branch:** `spec/todo-experience-s2-recently-deleted-and-offline-posture` (Spec integration, draft PR [#75](https://github.com/jonpham/PSYKL-System/pull/75)); active DevTask branch `feat/todo-experience-s2-dt7-restore-and-deleted`.
**Known blockers:** None. Next action: review + merge PR #76 into the Spec branch, then branch DevTask 8 off the updated Spec branch.

**Homelab deploy** (k3s cluster **robin**, LAN-only at `psykl.lan.witty-m.com`, GitOps via `PSYKL-GitOps`): live, deployed via ArgoCD, semver-pinned image tags. Full runbook at [`README.md` → Deploy to k3s](../README.md#deploy-to-k3s-homelab--robin); architecture at [ADR-M2-010](ARCHITECTURE.md). Not tied to any active Spec — update `PSYKL-GitOps/apps/psykl/values-robin.yaml` and merge to redeploy.

**Roadmap:** Apple-native client work is deferred in favor of maturing the PWA first. `psykl-loop` is next after `todo-experience`, seeded at [`docs/initiatives/psykl-loop/MILESTONE.md`](initiatives/psykl-loop/MILESTONE.md). Milestones from `psykl-loop` onward are tagged (not ordinal-numbered) since the remaining roadmap is a set of candidates, not a sequence — see [`docs/PRODUCT.md`](PRODUCT.md) → Milestone Roadmap.

## How to Pick Up This Project (for any AI agent)

1. **Read in this order:** [`README.md`](../README.md) (quickstart) → [`CLAUDE.md`](../CLAUDE.md)/[`AGENTS.md`](../AGENTS.md) (working agreement, vocabulary, Test Discipline, Git Conventions) → [`docs/PRODUCT.md`](PRODUCT.md) (product brief, Sync and Sharing Model) → [`docs/STACK.md`](STACK.md) (shipped stack) → [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) (ADRs) → this file → [`docs/features/`](features/) (completed-feature records) → the active initiative's `DESIGN.md`/`UX.md`/`MILESTONE.md` under `docs/initiatives/todo-experience/`.
2. **Vocabulary:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity. Unrelated.
3. **The Decisions appendix in any `APPROVED` design doc is normative.** Surface for discussion, don't silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** each DevTask gets its own PR, merged before the next starts (AGENTS.md → Subagent-Driven Development Discipline); stack only on a real dependency; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Initiative Summary

| Initiative                    | Theme                                                        | Status                      | Initiative Doc                                         |
| ----------------------------- | ------------------------------------------------------------ | --------------------------- | ------------------------------------------------------ |
| M2 — PWA CRUD + offline-first | Complete Task Create/Read/Update/Delete + offline-first sync | 🟢 Done — merged via PR #66 | [`docs/features/`](features/)                          |
| `todo-experience`             | Apple Reminders-grade task management on the PWA             | 🟡 Active — Spec 1 shipped  | [`todo-experience/`](initiatives/todo-experience/)     |
| `psykl-loop`                  | PSYKL execution, boundary behavior, retrospectives           | ⚪ Next — sketched          | [`psykl-loop/`](initiatives/psykl-loop/)               |
| `apple-native`                | iOS, iPadOS, macOS SwiftUI clients                           | 🔵 Deferred — unsequenced   | [`apple-native/`](initiatives/apple-native/)           |
| `multi-tenant-auth`           | Real authentication, multi-tenant data isolation             | 🔵 Deferred — unsequenced   | [`multi-tenant-auth/`](initiatives/multi-tenant-auth/) |

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
