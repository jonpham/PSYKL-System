# Milestone M2 — Complete Task CRUD + Offline-first PWA

**Status:** Open (sketch — design doc to be drafted via `/office-hours` once M1 ships)
**Design doc:** _not yet drafted_
**Effort:** TBD (estimate during design phase)

## Description

Close the Create / Read / Update / Delete loop on `Task` and turn the PWA into a real offline-first application that survives a flaky network. Add `completed_at` so a task can be marked done. Layer the user-experience polish that M1 deliberately deferred — loading states, empty states, optimistic updates, decent error handling. Stand up the local-first sync engine (PWA caches data locally, queues writes when offline, syncs to `service-task` when online).

M2 starts the dogfood phase. Once it ships, the user runs PSYKL daily on the PWA for a month before M3 begins; that month is where real product-discovery signal comes from.

## Tentative Scope

- API: `PATCH /tasks/:id`, `DELETE /tasks/:id`, `completed_at` column + migration
- PWA UI: edit task title in place, mark complete, delete with confirmation
- PWA UX: loading skeletons, empty state, optimistic create/update with rollback on failure
- PWA offline: service worker, app-shell caching, IndexedDB for task data, sync engine with last-write-wins conflict resolution (per `/office-hours` premise; full Conflict-free Replicated Data Type approach deferred to a later milestone)
- Tests: extend the test pyramid established in M1 to cover Update/Delete/offline-sync paths

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

- M1 complete and tagged `v0.1.0`.
- M1 retrospective documented and any AGENTS.md updates committed.
- `/office-hours` design doc for M2 written and APPROVED.
