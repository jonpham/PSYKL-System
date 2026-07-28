---
status: DONE
issue: P6 (local plan; supersedes GH#43 brief)
branches:
  - feat/m2-s6-dt13-multi-device-e2e
prs:
  - pending DevTask PR targeting spec/m2-pwa
spec_pr: [#66](https://github.com/jonpham/PSYKL-System/pull/66)
completed_at: 2026-07-28
created_at: 2026-07-28
initiative: m2-pwa-crud-offline
spec: consolidated-into-this-doc
---

# M2 Spec 6: Multi-Device E2E Harness

> Generated from `superpowers:writing-plans` artifacts and completed using `superpowers:executing-plans` with `superpowers:test-driven-development`.

## User Story

As a developer, I can run one End-to-End suite that proves PSYKL's offline-first Task behavior against the real Docker Compose stack, including two simulated devices for the same user, Last-Write-Wins reconciliation, tombstone propagation, idempotent retries, and the pending-sync affordance.

## Features

1. `e2e/task_list-offline-sync.e2e.spec.ts` is active and covers six user-story-style E2E cases:
   - two browser contexts share one backend account while keeping isolated browser storage;
   - an offline-created Task renders locally, queues, syncs when online returns, survives reload, and drains the queue;
   - two devices editing the same Task converge on the newer client `updated_at`;
   - a delete tombstone from one device hydrates into another device and hides the Task from the default list;
   - a dropped `PATCH` response retries with the same `Idempotency-Key`, receives the cached response, and rejects same-key/different-body reuse with `409`;
   - a queued offline change shows the pending-sync dot after the two-second threshold.
2. `e2e/helpers/multi-device.ts` opens one or two Playwright browser contexts against the same Compose stack, injects per-test `X-User-Id` headers, drives Task create/edit/complete/delete controls through accessible roles, polls server state, and explicitly triggers queued replay after retry backoff.
3. `e2e/helpers/idb-storage.ts` reads each browser context's IndexedDB stores from inside the page, letting E2E assert local storage isolation and queue drain without adding product-only test endpoints.
4. `enqueueWithReplay()` now notifies the UI immediately after enqueue and before Background Sync registration. This fixes the offline-create path where `navigator.serviceWorker.ready` could keep the form submitting and prevent the optimistic row from rendering while offline.
5. The retry E2E forwards the same per-test `X-User-Id` through `route.fetch()` when simulating a dropped response, so server idempotency assertions exercise the same account as the browser context.

## Design Decisions

- **Two contexts, one browser.** The harness follows Decision #50: two `browser.newContext()` instances simulate two devices without starting two browser processes.
- **Accessible selectors first.** No new `data-testid` selectors were needed. The helper uses exact accessible names such as `Title`, `Edit title`, `Edit <title>`, and `Confirm delete <title>`, which also fixes the latent strict-mode collision between the create input (`title`) and edit input (`Edit title`).
- **Retry proof includes key-conflict validation.** A repeated `PATCH` with the same idempotency key and same body proves cached response replay; an immediate same-key/different-body `PATCH` returning `409` proves the idempotency record exists and is not merely masked by Last-Write-Wins no-op behavior.
- **Background Sync registration cannot block optimistic UI.** The page must update IndexedDB subscribers after enqueue even if Service Worker readiness or Background Sync registration is slow/offline. Registration remains best-effort; page replay still handles online/focus/retry triggers.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m2-pwa-crud-offline/DESIGN.md`.
- Original issue brief: `docs/initiatives/m2-pwa-crud-offline/issues/[20260522]P6_m2-multi-device-e2e-harness.md` (deleted by this PR).
- Execution spec: `docs/specs/m2-pwa-crud-offline/20260610-S6-multi-device-e2e-harness.md` (deleted by this PR).

## DevTasks

| DevTask | Branch                             | Summary                                                         |
| ------- | ---------------------------------- | --------------------------------------------------------------- |
| M2-13   | `feat/m2-s6-dt13-multi-device-e2e` | Multi-device Playwright harness, E2E activation, Spec close-out |

## Verification Steps

Setup / Preconditions:

- Docker is available locally.
- Dependencies are installed with `pnpm install`.
- Generated artifacts are refreshed with `pnpm verify:prepare`.

Steps:

1. Run `pnpm verify:e2e:up`.
2. Run `pnpm verify:e2e:wait`.
3. Run `pnpm test:e2e -- task_list-offline-sync.e2e.spec.ts`.
4. Sabotage Last-Write-Wins by inverting the `PATCH` timestamp comparison in `components/service-task/src/task/task.service.ts`; rebuild the E2E stack and confirm the `newer client edit wins when two devices edit the same Task` test fails; revert.
5. Sabotage idempotency by allowing same-key/different-body reuse in `components/service-task/src/idempotency/idempotency.service.ts`; rebuild the E2E stack and confirm the `network drop during PATCH retries with one idempotent server write` test fails; revert.
6. Run the full project verification suite: `pnpm verify:prepare`, `pnpm verify:static`, `pnpm verify:unit`, `pnpm verify:integration`, `pnpm verify:component`, `pnpm verify:e2e`.

## Affected Components

- `e2e`: multi-device Playwright helper, IndexedDB inspection helper, active offline sync E2E suite.
- `components/web_client`: page enqueue trigger ordering and regression Unit coverage.
- Durable docs: `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/STACK.md`, `docs/PROJECT_STATUS.md`.

## Architecture Decisions (ADR)

- **ADR-M2-018:** Multi-device E2E uses two isolated Playwright browser contexts in one browser process.
- **ADR-M2-019:** E2E local storage assertions inspect IndexedDB from the browser context instead of adding reset/debug API endpoints.
- **ADR-M2-020:** Optimistic UI notification happens before Background Sync registration so offline enqueue never waits on Service Worker readiness.

## Change Log

| Date       | PR         | Summary                                                                    |
| ---------- | ---------- | -------------------------------------------------------------------------- |
| 2026-07-28 | pending PR | M2-13: activated multi-device offline sync E2E and completed M2 close-out. |
