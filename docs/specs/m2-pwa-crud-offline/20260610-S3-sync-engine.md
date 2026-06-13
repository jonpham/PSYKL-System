---
status: IN_PROGRESS
issue: P3
pr: https://github.com/jonpham/PSYKL-System/pull/56
completed_at:
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec_number: 3
devtasks_total: 2
devtasks_complete: 1
branch: spec/m2-s3-sync-engine
step_gating: false
honors_decisions: [40, 41, 42, 43, 47, 48, 52, 55]
---

# Sync Engine — Implementation Spec

> Generated using `superpowers:writing-plans`.
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement one DevTask at a time.

**Goal:** Queue offline mutations in IDB and replay them through the same module from the page bundle and the Service Worker.

**Architecture:** `src/sync/replay.ts` owns enqueue, replay, idempotency key use, backoff, and reconciliation. `sync_meta.replay_lock` prevents concurrent replay between page and Service Worker contexts. Page-side triggers run replay after writes, on online, and on focus.

**Tech Stack:** React, `idb`, MSW, `uuid` v7, browser events, Vitest, Storybook test-runner.

---

## Overview

As a user, online writes sync quickly and offline writes queue locally until connectivity returns. This spec touches `components/web_client` and depends on Spec 1 API semantics plus Spec 2 IDB stores.

## Data Model

No server schema changes. IDB operational rows:

```ts
type SyncQueueRow = {
  id: string;
  task_id: string;
  op: 'create' | 'patch' | 'delete';
  body: unknown;
  idempotency_key: string;
  attempts: number;
  next_attempt_at: string;
  created_at: string;
};
```

`sync_meta.replay_lock` stores `{ owner: string, heartbeat_at: string }`; lock is stale after 30 seconds.

`failed_ops` retains at most 100 rows and warns at 50 rows per Decision #42.

## API

No new endpoint. Replay calls existing POST/PATCH/DELETE with `Idempotency-Key`.

## Implementation Components

- Create `components/web_client/src/sync/replay.ts`.
- Create `components/web_client/src/sync/__tests__/replay.unit.test.ts`.
- Create `components/web_client/tests/integration/replay.integration.test.ts`.
- Create `components/web_client/src/sync/page-triggers.ts`.
- Create `components/web_client/src/components/Toast/Toast.tsx`, tests, stories, and `index.ts`.
- Modify task list/create components to use `enqueue()` and render pending affordances.

## Test Plan

Unit:

| File                                                                      | Assertion                                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `components/web_client/src/sync/__tests__/replay-lock.unit.test.ts`       | Lock acquisition, fresh-lock yielding, stale-lock stealing |
| `components/web_client/src/sync/__tests__/replay.unit.test.ts`            | FIFO ordering, UUID v7 idempotency key generation, backoff |
| `components/web_client/src/sync/__tests__/replay-failed-ops.unit.test.ts` | Permanent-fail routing and failed-op warning/cap behavior  |

Integration:

| File                                                                 | Assertion                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `components/web_client/tests/integration/replay.integration.test.ts` | IDB queue + MSW network replay writes server response back to `tasks` |

Component:

| File                                                                           | Assertion                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx` | queued task row renders opacity + dot and clears after replay |
| `components/web_client/src/components/Toast/__tests__/Toast.stories.tsx`       | permanent-fail event renders toast                            |

End-to-End: deferred to Spec 6.

## DevTasks

Spec integration branch: `spec/m2-s3-sync-engine`.

### DevTask M2-7: Add shared replay module and IDB lock

**Branch:** `feat/m2-s3-dt7-sync-replay-module`
**Affected:** `components/web_client/src/sync/replay.ts`, `components/web_client/src/sync/__tests__/replay.unit.test.ts`, `components/web_client/tests/integration/replay.integration.test.ts`, `components/web_client/src/db/idb.ts`, `components/web_client/src/test/msw-handlers.ts`.

- [x] Step 1: Write failing lock tests: first caller acquires, second caller yields, stale lock after 30 seconds can be stolen.
- [x] Step 2: Write failing queue tests for FIFO replay, generated idempotency key, 5xx backoff, network error backoff, and 4xx permanent fail.
- [x] Step 3: Implement `enqueue()`, `replay()`, `acquireReplayLock()`, `releaseReplayLock()`, and failed-op cap behavior.
- [x] Step 4: Add MSW integration test proving replay sends `Idempotency-Key`, stores server response into `tasks`, and deletes queue row.
- [x] Step 5: Run `pnpm --filter @psykl/web-client test:unit`.
- [x] Step 6: Commit with `feat: add shared sync replay module`.

### DevTask M2-8: Add page triggers, pending affordances, and permanent-fail toast

**Branch:** `feat/m2-s3-dt8-sync-page-triggers`
**Affected:** `components/web_client/src/sync/page-triggers.ts`, `components/web_client/src/main.tsx`, `components/web_client/src/components/TaskList/TaskList.tsx`, `components/web_client/src/components/TaskList/__tests__/TaskList.stories.tsx`, `components/web_client/src/components/TaskCreateForm/TaskCreateForm.tsx`, `components/web_client/src/components/Toast/Toast.tsx`, `components/web_client/src/components/Toast/__tests__/Toast.stories.tsx`, `components/web_client/src/components/Toast/index.ts`.

- [ ] Step 1: Write failing tests for replay on `online`, replay on `visibilitychange` to visible, and replay after enqueue.
- [ ] Step 2: Write failing Storybook play tests for pending opacity/dot and permanent-fail toast.
- [ ] Step 3: Implement page trigger registration and call it from `main.tsx`.
- [ ] Step 4: Route create form writes through `enqueue()` while keeping local IDB state optimistic.
- [ ] Step 5: Add pending-row selector and render 60% opacity plus a dot for tasks with matching `sync_queue` rows.
- [ ] Step 6: Add final Spec close-out docs in the Spec integration PR: feature doc, `CHANGELOG.md`, architecture note for FIFO shared replay, and delete the P3 issue brief plus this spec at close-out.
- [ ] Step 7: Run `pnpm --filter @psykl/web-client test:unit` and `pnpm --filter @psykl/web-client test:component`.
- [ ] Step 8: Commit with `feat: trigger sync replay from the pwa`.

## Verification

1. `pnpm verify:static`
2. `pnpm --filter @psykl/web-client test:unit`
3. `pnpm --filter @psykl/web-client test:component`

## Decisions made during spec drafting

- Create operations also go through `enqueue()` after this spec so all mutation paths use the same idempotent replay model.

## Open Questions / Risks

- Shared module must avoid page-only globals so Spec 4 can import it from `src/sw.ts`.

## Affected by / Depends on

- Depends on Spec 1 and Spec 2.
- Blocks Specs 4, 5, and 6.
