---
status: DONE
issue: [GH#40](https://github.com/jonpham/PSYKL-System/issues/40)
branches:
  - feat/m2-s3-dt7-sync-replay-module
  - feat/m2-s3-dt8-sync-page-triggers
prs:
  - https://github.com/jonpham/PSYKL-System/pull/57
  - https://github.com/jonpham/PSYKL-System/pull/58
completed_at: 2026-06-13
created_at: 2026-06-13
initiative: m2-pwa-crud-offline
spec: consolidated-into-this-doc
---

# M2 Spec 3: Sync Engine

> Generated from `superpowers:writing-plans` artifacts and completed using `superpowers:executing-plans` with `superpowers:test-driven-development`.

## User Story

As a user, I want the Progressive Web App (PWA) to queue edits locally and sync them when the network is available so that creating a Task never waits on a successful network round trip.

## Features

1. `components/web_client/src/sync/replay.ts` owns mutation enqueue, replay, retry backoff, idempotency-key reuse, and server response reconciliation.
2. Sync queue rows use First-In-First-Out (FIFO) replay order and stop after a transient retry so later operations cannot overtake an earlier failed operation.
3. Replay uses an IndexedDB `sync_meta.replay_lock` row with a 30-second stale timeout and 10-second heartbeat refresh so page and future Service Worker contexts do not drain the queue concurrently.
4. Permanent 4xx failures move queue rows into `failed_ops`, emit `sync:permanent-fail`, preserve structured error detail, warn at 50 failed rows, and cap the store at 100 rows.
5. `TaskCreateForm` now atomically writes an optimistic local Task with its create queue row and triggers replay instead of calling `POST /tasks` directly.
6. Page-side triggers call replay on `online`, on `visibilitychange` back to visible, and immediately after enqueue.
7. `TaskList` renders Tasks with queued operations at 60% opacity and adds a pending-sync dot.
8. `Toast` displays permanent sync failures surfaced by the replay module.
9. MSW Task mutation handlers require `Idempotency-Key` and support create, patch, and delete replay tests.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m2-pwa-crud-offline/DESIGN.md`.
- Original issue brief: `docs/initiatives/m2-pwa-crud-offline/issues/[20260522]P3_m2-sync-engine.md` (deleted by this PR).
- Execution spec: `docs/specs/m2-pwa-crud-offline/20260610-S3-sync-engine.md` (deleted by this PR).
- GitHub issue: [#40](https://github.com/jonpham/PSYKL-System/issues/40).
- Constituent DevTask PRs: [#57](https://github.com/jonpham/PSYKL-System/pull/57) and [#58](https://github.com/jonpham/PSYKL-System/pull/58).
- Spec integration PR: [#56](https://github.com/jonpham/PSYKL-System/pull/56).

## Implementation Notes

- **M2-7 (PR #57)** added the shared replay module, IndexedDB lock helpers, failed-op handling, replay transport, Unit coverage, and Integration coverage.
- **M2-8 (PR #58)** added page replay triggers, atomic optimistic create queueing, pending-row affordances, and the permanent-failure toast surface.
- Replay transports use the existing typed `openapi-fetch` client and the service contract from M2 Spec 1.
- Spec 4 imports the shared replay module from the Service Worker side and relies on the IDB lock added here.

## Verification Steps

**Associated End-to-End test:** none in this Spec. M2 Spec 6 covers the full offline and multi-device End-to-End flow.

**Manual verification**

Setup / Preconditions:

- Node 24 LTS is active.
- Dependencies are installed with `pnpm install`.
- Generated artifacts are refreshed with `pnpm verify:prepare`.

Steps:

1. Run `pnpm verify:static`.
2. Run `pnpm --filter @psykl/web-client test:unit`.
3. Run `pnpm --filter @psykl/web-client test:integration`.
4. Run `pnpm --filter @psykl/web-client test:component`.
5. Open the PWA and create a Task while offline.
6. Confirm the Task appears immediately from IndexedDB with a pending-sync dot and 60% opacity.
7. Return online and confirm replay drains the queue, sends `Idempotency-Key`, reconciles the server response into IndexedDB, and clears the pending affordance.
8. Force a 4xx replay response and confirm the operation moves to `failed_ops` and the toast appears.

Expectation: Task creates are local-first, durable in IndexedDB, replayed idempotently in FIFO order, and visibly marked while queued.

## Affected Components

- `components/web_client`: sync replay module, page triggers, Task create/list UI, Toast UI, MSW handlers, Unit/Integration/Storybook coverage.

## Design Decisions

- **Decision #40:** Sync queue model uses operation rows and FIFO replay.
- **Decision #41:** Mutating wire calls use `Idempotency-Key`.
- **Decision #42:** Permanent failures move to `failed_ops`, log, and surface a toast.
- **Decision #43:** Last-Write-Wins uses client `updated_at` as the comparison key.
- **Decision #47:** Pending Tasks render at 60% opacity with a small dot.
- **Decision #48:** Permanent failures preserve local state.
- **Decision #52:** Sync replay is shared between page and Service Worker contexts, guarded by an IndexedDB lock.

## Architecture Decisions (ADR)

- **ADR-M2-010:** The sync replay module is shared browser code, imported by page triggers now and by the Service Worker in Spec 4.
- **ADR-M2-011:** Replay coordination uses an IndexedDB row lock instead of `navigator.locks`.
- **ADR-M2-012:** FIFO replay stops after the first transient retry to preserve operation order.
- **ADR-M2-013:** Permanent failures are retained in IndexedDB and surfaced as a toast, without adding a full inspector UI in M2.

## Change Log

| Date       | PR                                                     | Summary                                                                    |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| 2026-06-13 | [#57](https://github.com/jonpham/PSYKL-System/pull/57) | M2-7: shared replay module, IDB lock, failed-op handling, replay tests.    |
| 2026-06-15 | [#58](https://github.com/jonpham/PSYKL-System/pull/58) | M2-8: page triggers, atomic optimistic create queueing, pending UI, toast. |
