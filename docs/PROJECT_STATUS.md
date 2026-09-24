# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** none. `to-do-ui` closed with the merge of [PR #142](https://github.com/jonpham/PSYKL-System/pull/142); `todo-experience` is next.
**Last completed initiative:** `to-do-ui` — the accepted `apple-reminders-ux` prototype is now the production surface, and the prototype itself has been deleted. Released as **v0.5.0** plus the lightweight changes since; closed out 2026-09-24 by Spec 6 ([feature doc](features/%5B20260924%5DP6_to-do-ui-retire-experiment-and-close-out.md), [retrospective](retrospectives/2026-09-24-to-do-ui.md)). Its initiative docs are **deleted** per the initiative close-out checklist — their five decisions all live on durably: the two normative ones in [`docs/DESIGN.md`](DESIGN.md) (device-local preferences in `sync_meta`; Standard and Increased contrast), and the rest in the six `to-do-ui` feature docs. The experiment behind it is summarised at [`docs/experiments/apple-reminders-ux.md`](experiments/apple-reminders-ux.md).
**Next initiative:** `todo-experience` — **unpaused.** Specs 1-2 shipped; **Specs 3-7 are ready to rebase onto the `to-do-ui` surface** and resume. Their written specs live in [`docs/specs/todo-experience/`](specs/todo-experience/) and describe the surface `to-do-ui` replaced, so each needs rebasing onto the shipped chrome before execution. [`todo-experience/DESIGN.md`](initiatives/todo-experience/DESIGN.md) stays APPROVED and unedited. `psykl-loop` follows.
**Last completed spec:** `to-do-ui` Spec 6 — retire the experiment and close out the initiative ([feature doc](features/%5B20260924%5DP6_to-do-ui-retire-experiment-and-close-out.md)).
**Active spec for execution:** N/A.
**Current execution:** None. The lightweight `target = production` change for [#128](https://github.com/jonpham/PSYKL-System/issues/128) — swipe a task for Details and Delete, swipe across to delete, a focus frame on the row being acted on, tap the empty space to start a task, and an installed iOS app that draws under its status bar — is operator-approved on device and consolidated in its [feature doc](features/%5B20260924%5DGH128_task-swipe-actions-and-touch-polish.md); its artifact folder was deleted at close-out. It is the first change filed under `docs/specs/fast-feature/`, the root for lightweight work that belongs to no initiative. All `to-do-ui` work — six Specs plus seven lightweight `target = production` changes ([#122](https://github.com/jonpham/PSYKL-System/issues/122)-[#127](https://github.com/jonpham/PSYKL-System/issues/127), [#138](https://github.com/jonpham/PSYKL-System/issues/138)) — is merged and consolidated in [`docs/features/`](features/). **Active experiment: none, and the registry is empty.** `apple-reminders-ux` was promoted and deleted, planning artifacts included — the durable record is [`docs/experiments/apple-reminders-ux.md`](experiments/apple-reminders-ux.md), which links each iteration to the feature doc it became. `/exp` and its tools stay for the next experiment.
**Next executable work:** rebase `todo-experience` Spec 3 onto the `to-do-ui` surface ([`docs/specs/todo-experience/`](specs/todo-experience/)). Open and unscheduled: [#137](https://github.com/jonpham/PSYKL-System/issues/137) (a bulk-edit contract across both client paradigms), [#136](https://github.com/jonpham/PSYKL-System/issues/136) (persist hand order as `Task.position`, mirroring List ordering's fractional index), and the tokens-in-stories gap — stories that render `<App />` do not import `styles/tokens.css` (only `main.tsx` does), so any such story runs with no design tokens; fixed in the files #138 and #127 touched, still open elsewhere. **Six post-experiment refactor proposals** for the client's hooks and components are recorded in the [initiative retrospective](retrospectives/2026-09-24-to-do-ui.md) → Post-experiment refactor proposals; none is implemented and none blocks `todo-experience`. Proposals 1 (one factory for device-local preferences) and 2 (invert the `SettingsView` → `src/experiment` import) are the two worth taking before Specs 3-7 add more preferences.
**Branch:** `feat/128-list-item-and-sidebar-gestures` ([PR #141](https://github.com/jonpham/PSYKL-System/pull/141), awaiting operator merge).
**Known blockers:** None blocking. [#117](https://github.com/jonpham/PSYKL-System/issues/117) is open and deferred to `multi-tenant-auth`: `DEFAULT_LIST_ID` is a shared constant while `lists.id` is a global primary key, so a second account cannot create its default list. Not user-facing while PSYKL is single-user, but it blocks per-user end-to-end isolation, which is why the suite resets server state between tests instead. The contrast question raised on 2026-09-21 is resolved — the app ships **Standard** (default) and **Increased** contrast as a device-local Settings choice. See [`docs/DESIGN.md`](DESIGN.md) → Contrast — Standard and Increased.
**Workflows:** Production (Initiative → Spec → DevTask) per [`docs/workflows/production-dev-workflow.md`](workflows/production-dev-workflow.md); Lightweight per [`docs/workflows/lightweight-feature-workflow.md`](workflows/lightweight-feature-workflow.md), with `target = prototype` (UI/UX prototyping at `/exp/{slug}`) and `target = production` (small decided changes to shipped surfaces, artifacts under `docs/specs/`). Routing table in [`AGENTS.md`](../AGENTS.md) → Workflow Routing. **Active experiment:** none, and the registry is empty. `apple-reminders-ux` was **promoted and retired** — all three iterations (`sidebar-navigation`, `sync-status`, `apple-reminders-ui`) were absorbed by `to-do-ui`, whose Spec 6 deleted the experiment's code and archived its artifacts. `/exp` and the 🧪 tools stay for the next experiment; registering one is a folder plus a line in `src/experiment/registry.ts`.

**Homelab deploy** (k3s cluster **robin**, LAN-only at `psykl.lan.witty-m.com`, GitOps via `PSYKL-GitOps`): live, deployed via ArgoCD, semver-pinned image tags. Full runbook at [`README.md` → Deploy to k3s](../README.md#deploy-to-k3s-homelab--robin); architecture at [ADR-M2-010](ARCHITECTURE.md). Not tied to any active Spec — update `PSYKL-GitOps/apps/psykl/values-robin.yaml` and merge to redeploy.

**Roadmap:** Apple-native client work is deferred in favor of maturing the PWA first. `to-do-ui` is done; `todo-experience` Specs 3-7 resume next; `psykl-loop` follows, seeded at [`docs/initiatives/psykl-loop/MILESTONE.md`](initiatives/psykl-loop/MILESTONE.md). Milestones from `psykl-loop` onward are tagged (not ordinal-numbered) since the remaining roadmap is a set of candidates, not a sequence — see [`docs/PRODUCT.md`](PRODUCT.md) → Milestone Roadmap.

## How to Pick Up This Project (for any AI agent)

1. **Read in this order:** [`README.md`](../README.md) (quickstart) → [`CLAUDE.md`](../CLAUDE.md)/[`AGENTS.md`](../AGENTS.md) (working agreement, vocabulary, Test Discipline, Git Conventions, Workflow Routing) → [`docs/workflows/`](workflows/) (the lane you are working in) → [`docs/PRODUCT.md`](PRODUCT.md) (product brief, Sync and Sharing Model) → [`docs/STACK.md`](STACK.md) (shipped stack) → [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) (ADRs) → this file → [`docs/features/`](features/) (completed-feature records) → the next initiative's `DESIGN.md` under `docs/initiatives/todo-experience/`, plus its Spec docs in `docs/specs/todo-experience/`. The shipped surface is described by [`docs/DESIGN.md`](DESIGN.md) and the `to-do-ui` feature docs.
2. **Vocabulary:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity. Unrelated.
3. **The Decisions appendix in any `APPROVED` design doc is normative.** Surface for discussion, don't silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** each DevTask gets its own PR, merged before the next starts ([`docs/workflows/production-dev-workflow.md`](workflows/production-dev-workflow.md) → Subagent-Driven Development Discipline); stack only on a real dependency; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Initiative Summary

| Initiative                    | Theme                                                               | Status                                             | Initiative Doc                                         |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| M2 — PWA CRUD + offline-first | Complete Task Create/Read/Update/Delete + offline-first sync        | 🟢 Done — merged via PR #66                        | [`docs/features/`](features/)                          |
| `to-do-ui`                    | Migrate the accepted `apple-reminders-ux` prototype into production | 🟢 Done — all 6 Specs shipped; experiment retired  | [`docs/features/`](features/)                          |
| `todo-experience`             | Apple Reminders-grade task management on the PWA                    | 🟡 Next — Specs 1-2 shipped; 3-7 rebase and resume | [`todo-experience/`](initiatives/todo-experience/)     |
| `psykl-loop`                  | PSYKL execution, boundary behavior, retrospectives                  | ⚪ Next — sketched                                 | [`psykl-loop/`](initiatives/psykl-loop/)               |
| `apple-native`                | iOS, iPadOS, macOS SwiftUI clients                                  | 🔵 Deferred — unsequenced                          | [`apple-native/`](initiatives/apple-native/)           |
| `multi-tenant-auth`           | Real authentication, multi-tenant data isolation                    | 🔵 Deferred — unsequenced                          | [`multi-tenant-auth/`](initiatives/multi-tenant-auth/) |

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
