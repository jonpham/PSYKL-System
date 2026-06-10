# Milestone M2 — Complete Task CRUD + Offline-first PWA

**Status:** DRAFT — DESIGN.md drafted via `/office-hours` (adapted) on 2026-05-22; M1 close-out has landed on `origin/main`, so this promotes to APPROVED after user review accepts the design premises and durable product-doc updates.
**Design doc:** [`DESIGN.md`](./DESIGN.md)
**Effort:** M (human: ~2-3 weeks / Claude Code: ~3-5 days of focused work). Source: M2 DESIGN.md → "Recommended Approach → Approach C".

## Description

Close the Create / Read / Update / Delete loop on `Task` and turn the PWA into a real offline-first application that survives a flaky network. Add `completed_at` so a task can be marked done. Layer the user-experience polish that M1 deliberately deferred — loading states, empty states, optimistic updates, decent error handling. Stand up the local-first sync engine (PWA caches data locally, queues writes when offline, syncs to `service-task` when online).

M2 starts the dogfood phase. Once it ships, the user runs PSYKL daily on the PWA for a month before M3 begins; that month is where real product-discovery signal comes from.

## Tentative Scope

- API: `PATCH /tasks/:id`, `DELETE /tasks/:id`, `completed_at` column + migration
- PWA UI: edit task title in place, mark complete, delete with confirmation
- PWA UX: loading skeletons, empty state, optimistic create/update with rollback on failure
- PWA offline: service worker, app-shell caching, IndexedDB for task data, sync engine with last-write-wins conflict resolution (per M2 DESIGN.md; Conflict-free Replicated Data Type frameworks remain out of scope for the project's lifetime)
- Tests: extend the test pyramid established in M1 to cover Update/Delete/offline-sync paths
- Code style + linting tightening: route the M1 retrospective's deferred linting/TypeScript/formatting/commit-style candidates into M2 execution planning, or explicitly defer specific candidates with rationale.

## Success Criteria (preliminary, refine during design)

- Full CRUD on Task works via the PWA against the API.
- A user can mark a task complete and the `completed_at` value persists and renders.
- The PWA continues to work when network is dropped: cached tasks remain visible, new tasks queue locally and sync when the network returns.
- A conflict from a stale-client write is resolved deterministically (last-write-wins for M2; documented).
- A 30-day dogfood retrospective produces written notes on which patterns surfaced as worth keeping vs. cutting before M3.

## What gets deferred to M3+

- Apple-native clients (iOS, iPadOS, macOS)
- Energy retrospectives and PSYKL-boundary coaching (the real product differentiator)
- Configurable term-map / UI themes
- Multi-user authentication, login, homelab multi-instance support

## Prerequisites

- M1 complete and tagged `v0.1.0` (satisfied on `origin/main`).
- M1 retrospective documented and any AGENTS.md updates committed (satisfied on `origin/main`).
- `/office-hours` design doc for M2 written and APPROVED (written here; pending user approval).
