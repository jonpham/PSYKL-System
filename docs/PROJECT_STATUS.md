# Project and Feature Status

> Updated by the active session at the start of each work block. Reflects the live state of the project — see [`AGENTS.md`](../AGENTS.md) for terminology (Initiative / Spec / Task / Step / Feature).

**Active initiative:** N/A — M2 close-out is complete on `spec/m2-pwa`; M3 planning starts after Spec PR [#66](https://github.com/jonpham/PSYKL-System/pull/66) merges to `main`.
**Initiative status:** 🟢 M2 — PWA CRUD + offline-first is complete pending PR #66 merge to `main`. Specs 1-2 shipped to `main` in `v0.2.0`; Specs 3-4 shipped via merged Spec PR [#56](https://github.com/jonpham/PSYKL-System/pull/56); Specs 5-6 and initiative close-out are carried by PR #66. Durable records now live in [`docs/features/`](features/), [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/STACK.md`](STACK.md), [`CHANGELOG.md`](../CHANGELOG.md), and [`docs/retrospectives/2026-07-29-m2-pwa-crud-offline.md`](retrospectives/2026-07-29-m2-pwa-crud-offline.md).
**Last completed initiative:** M2 — PWA CRUD + offline-first.
**Last completed spec:** M2 Spec 6 — Multi-device E2E + offline harness ([`[20260728]P6_m2-multi-device-e2e-harness.md`](features/%5B20260728%5DP6_m2-multi-device-e2e-harness.md)).
**Active spec for execution:** N/A.
**Next executable spec:** N/A — next work is M3 initiative planning from `main` after PR #66 merges.
**Active skill:** N/A.
**Branch:** `spec/m2-pwa` (Spec PR [#66](https://github.com/jonpham/PSYKL-System/pull/66) targets `main`).
**Known blockers:** None. After PR #66 merges, fast-forward local `main`, create `feat/plan-m3-apple-native-product-discovery` from updated `main`, and start M3 design/planning.

**Homelab deploy track (2026-07-23, out-of-Spec, concurrent with M2):** PSYKL is deployed to a k3s cluster (Proxmox VM **robin**, `10.0.1.206`, LAN-only at `psykl.lan.witty-m.com`) via ArgoCD from a separate GitOps repo (`PSYKL-GitOps`). The two 2026-06-29 helm-hardening commits on `main` (`feat(helm): support image pull secrets`, `fix(helm): support robin ingress api path`) were the undocumented start of this. This session validated the live deploy (all ArgoCD apps Synced/Healthy), documented the flow in [`README.md` → Deploy to k3s](../README.md#deploy-to-k3s-homelab--robin) + [ADR-M2-010](ARCHITECTURE.md), and adopted **semver** as the go-forward image-pin scheme (manual bump). **Completed 2026-07-24:** released `v0.2.0` and repinned `PSYKL-GitOps/apps/psykl/values-robin.yaml` to `0.2.0` (note: the image tag is the `v`-stripped semver — `cd-release.yml` strips the leading `v`); ArgoCD rolled robin to the `:0.2.0` images (`/version` → commit `854f6d8`, all 21 todos preserved on the pglite PVC, app `Synced`/`Healthy`). The in-app version footer ([#64](https://github.com/jonpham/PSYKL-System/pull/64)) now shows both components' build commits. Milestone **M4 was rescoped to auth + multi-tenant isolation only** — homelab deployment is now handled. Image-tag write-back automation is deferred ([`BACKLOG_IDEAS.md`](BACKLOG_IDEAS.md)).

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
   - [`docs/features/[20260610]GH38_m2-service-task-patch-delete-lww-idempotency.md`](features/%5B20260610%5DGH38_m2-service-task-patch-delete-lww-idempotency.md) — completed M2 Spec 1 record
   - [`docs/features/[20260612]GH39_m2-pwa-indexeddb-store.md`](features/%5B20260612%5DGH39_m2-pwa-indexeddb-store.md) — completed M2 Spec 2 record
   - [`docs/features/[20260613]GH40_m2-sync-engine.md`](features/%5B20260613%5DGH40_m2-sync-engine.md) — completed M2 Spec 3 record
   - [`docs/features/[20260618]GH41_m2-service-worker-background-sync.md`](features/%5B20260618%5DGH41_m2-service-worker-background-sync.md) — completed M2 Spec 4 record
   - [`docs/features/[20260724]P5_m2-pwa-crud-ui-polish.md`](features/%5B20260724%5DP5_m2-pwa-crud-ui-polish.md) — completed M2 Spec 5 record
   - [`docs/features/[20260728]P6_m2-multi-device-e2e-harness.md`](features/%5B20260728%5DP6_m2-multi-device-e2e-harness.md) — completed M2 Spec 6 record
   - [`docs/initiatives/m3-apple-native-product-discovery/MILESTONE.md`](initiatives/m3-apple-native-product-discovery/MILESTONE.md) — M3 sketch; draft the M3 design from updated `main`
2. **Vocabulary to memorize:** `DevTask` = workflow concept (PR-sized unit). `Task` = PSYKL data-model entity (the `id, user_id, title, created_at` record). They are unrelated.
3. **The Decisions appendix is normative.** If a decision looks wrong, surface it for user discussion — do not silently rework.
4. **TDD ordering is mandatory:** failing test → implementation → green → refactor → commit. Tests live in the same PR as the implementation.
5. **DevTask branching:** siblings off the Spec integration branch unless K+1 depends on K's unmerged work; rebase onto `origin/<target>` before opening any PR.

## Current Stack

See [`docs/STACK.md`](STACK.md) for the canonical shipped stack table. Architecture rationale lives in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

## Initiative Summary

| Initiative                            | Theme                                                             | Status                                    | Initiative Doc                                                                         |
| ------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| M2 — PWA CRUD + offline-first         | Complete Task Create/Read/Update/Delete + offline-first sync      | 🟢 Done — feature docs + PR #66 close-out | [`docs/features/`](features/)                                                          |
| M3 — Apple-native + product discovery | iOS, iPadOS, macOS clients + PSYKL execution + retrospectives     | ⚪ Sketched                               | [`m3-apple-native-product-discovery/`](initiatives/m3-apple-native-product-discovery/) |
| M4 — Multi-user auth + homelab        | Real authentication, multi-user data isolation, homelab self-host | ⚪ Sketched                               | [`m4-multi-user-auth-homelab/`](initiatives/m4-multi-user-auth-homelab/)               |

Legend: 🟢 Done · 🟡 In progress · ⚪ Sketched / Not started

## M2 Specs

Generated by `superpowers:writing-plans` on 2026-06-10 from the M2 design, milestone doc, and issue briefs.

| Spec | Title                                         | Execution spec                                                                                                                                  | DevTasks                 |
| ---- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| M2-1 | service-task PATCH/DELETE + LWW + Idempotency | [`[20260610]GH38_m2-service-task-patch-delete-lww-idempotency.md`](features/%5B20260610%5DGH38_m2-service-task-patch-delete-lww-idempotency.md) | Complete                 |
| M2-2 | PWA IndexedDB store + useSyncExternalStore    | [`[20260612]GH39_m2-pwa-indexeddb-store.md`](features/%5B20260612%5DGH39_m2-pwa-indexeddb-store.md)                                             | Complete                 |
| M2-3 | Sync engine                                   | [`[20260613]GH40_m2-sync-engine.md`](features/%5B20260613%5DGH40_m2-sync-engine.md)                                                             | Complete — shipped       |
| M2-4 | Service Worker + Background Sync              | [`[20260618]GH41_m2-service-worker-background-sync.md`](features/%5B20260618%5DGH41_m2-service-worker-background-sync.md)                       | Complete — shipped       |
| M2-5 | PWA CRUD UI polish                            | [`[20260724]P5_m2-pwa-crud-ui-polish.md`](features/%5B20260724%5DP5_m2-pwa-crud-ui-polish.md)                                                   | Complete — `spec/m2-pwa` |
| M2-6 | Multi-device E2E + offline harness            | [`[20260728]P6_m2-multi-device-e2e-harness.md`](features/%5B20260728%5DP6_m2-multi-device-e2e-harness.md)                                       | Complete — `spec/m2-pwa` |

## Remaining Planning Gates

| Gate                         | Status                      | Required action                                                                                                                 |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| M2 design user review        | Satisfied for spec planning | User requested `superpowers:writing-plans` on 2026-06-10, promoting the design into spec generation.                            |
| Durable product-doc refresh  | Done                        | `docs/PRODUCT.md` Surface Areas records the PWA as the permanent non-Apple client surface.                                      |
| Code style + linting routing | Done                        | Spec M2-1 explicitly defers broad linting/TypeScript/formatting/commit-style tightening until after M2 or a hygiene initiative. |
| M2 execution spec generation | Done                        | Completed Spec records live under [`docs/features/`](features/); obsolete per-Spec planning docs are deleted at Spec close-out. |

## Open Design Surfaces

Not blocking anything today; documented so they don't get lost.

| Surface                                                                                                                                                                                                                                                                                                    | Parked at                                 | Owning milestone |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------- |
| ~~Offline-first sync engine architecture~~ — **SHIPPED in M2.** IndexedDB source-of-truth, sync queue, Service Worker scope, Background Sync, Last-Write-Wins, and multi-device E2E are now durable architecture in [`docs/ARCHITECTURE.md`](ARCHITECTURE.md).                                             | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | M2 (resolved)    |
| ~~Conflict resolution via CRDT~~ — **CLOSED, out of scope.** Per the single-user multi-device sync model (`docs/PRODUCT.md` → Sync and Sharing Model), Last-Write-Wins is sufficient for the lifetime of the project; Conflict-free Replicated Data Types solve a multi-actor problem PSYKL does not have. | Permanently closed 2026-05-20             | —                |
| Server-side vs client-side retrospective aggregation                                                                                                                                                                                                                                                       | `/office-hours` parked for post-M3        | M3 or M4         |
| Configurable term-map / UI theme architecture (default celestial: PSYKL/Earth/Moon/HelioArc/Sun)                                                                                                                                                                                                           | `/office-hours`                           | M3+              |
| Multi-user auth scheme (OAuth provider vs magic-link vs password+session)                                                                                                                                                                                                                                  | `/office-hours`                           | M4               |
| Homelab multi-instance deployment guide                                                                                                                                                                                                                                                                    | `/office-hours`                           | M4               |
| Apple Watch integration (movement detection for fatigue / distraction signals)                                                                                                                                                                                                                             | `docs/PRODUCT.md` future features         | M5+              |
| iCloud / Google Calendar sync                                                                                                                                                                                                                                                                              | `docs/PRODUCT.md` future features         | M5+              |
| Apple Reminders import / two-way sync                                                                                                                                                                                                                                                                      | `docs/PRODUCT.md` future features         | M5+              |

## Backlog ideas (not on the milestone roadmap)

See [`docs/BACKLOG_IDEAS.md`](BACKLOG_IDEAS.md) for someday/maybe items. Currently tracked: **gRPC learning side-quest** (add one gRPC model to NestJS for personal learning; not architecturally needed).
