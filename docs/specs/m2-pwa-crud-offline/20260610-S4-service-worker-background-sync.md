---
status: IN-PROGRESS
issue: P4
pr:
completed_at:
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec_number: 4
devtasks_total: 2
devtasks_complete: 1
branch: spec/m2-s4-sw-bg-sync
step_gating: false
honors_decisions: [36, 49, 51, 52, 55]
---

# Service Worker + Background Sync — Implementation Spec

> Generated using `superpowers:writing-plans`.
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement one DevTask at a time.

**Goal:** Own the PWA Service Worker with `injectManifest`, cache the app shell and task reads, and replay queued writes through Background Sync when Chromium permits it.

**Architecture:** `vite-plugin-pwa` switches to `injectManifest`; `src/sw.ts` is source-controlled and imports Workbox helpers plus the shared replay module. The page registers `psykl-sync` after enqueue, while the Service Worker handles `sync` events and respects the IDB replay lock.

**Tech Stack:** Vite, `vite-plugin-pwa`, Workbox, Playwright Chromium component tests, React.

---

## Overview

As a user, the app shell loads offline and writes can sync even after the tab closes. This spec touches `components/web_client` only and depends on the shared replay module from Spec 3.

## Data Model

No schema changes. Reuses `sync_queue` and `sync_meta.replay_lock`.

## API

No new API. Service Worker caches `GET /tasks` with stale-while-revalidate and replays POST/PATCH/DELETE through the existing service-task endpoints.

## Implementation Components

- Modify `components/web_client/vite.config.ts` to use `injectManifest`.
- Create `components/web_client/src/sw.ts`.
- Create `components/web_client/src/sw-registration.ts`.
- Create Playwright-backed component tests for Service Worker lifecycle and fetch strategy.
- Modify sync enqueue path to register Background Sync.

## Test Plan

Unit:

| File                                                                  | Assertion                                                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `components/web_client/src/sw/__tests__/sw-registration.unit.test.ts` | safely no-ops when `registration.sync` is unavailable and registers `psykl-sync` when available |

Component:

| File                                                | Assertion                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `e2e/m2-service-worker-lifecycle.e2e.spec.ts`       | real Chromium installs and activates the Service Worker             |
| `e2e/m2-service-worker-cache.e2e.spec.ts`           | cached app shell and stale-while-revalidate task reads work offline |
| `e2e/m2-service-worker-background-sync.e2e.spec.ts` | synthetic sync event runs replay and respects existing lock         |

End-to-End: Service Worker browser coverage lands in this spec because the behavior requires real Chromium; multi-device offline sync remains deferred to Spec 6.

## DevTasks

Spec integration branch: `spec/m2-s4-sw-bg-sync`.

### DevTask M2-9: Switch to injectManifest and own src/sw.ts

**Branch:** `feat/m2-s4-dt9-injectmanifest-sw`
**Affected:** `components/web_client/vite.config.ts`, `components/web_client/src/sw.ts`, `e2e/m2-service-worker-lifecycle.e2e.spec.ts`, `e2e/m2-service-worker-cache.e2e.spec.ts`, `components/web_client/package.json`, lockfile.

- [x] Step 1: Write failing Playwright component test proving a built PWA registers a Service Worker from `src/sw.ts`.
- [x] Step 2: Write failing cache test proving app shell navigation works offline after first load.
- [x] Step 3: Write failing cache test proving `GET /tasks` uses stale-while-revalidate.
- [x] Step 4: Configure `vite-plugin-pwa` `injectManifest`, add Workbox dependencies if needed, and implement `src/sw.ts` without `skipWaiting()` so sessions stay coherent.
- [x] Step 5: Run `pnpm --filter @psykl/web-client test:component`.
- [x] Step 6: Commit with `feat: own the pwa service worker`.

### DevTask M2-10: Register Background Sync and handle sync events

**Branch:** `feat/m2-s4-dt10-background-sync`
**Affected:** `components/web_client/src/sw/sw-registration.ts`, `components/web_client/src/sw/__tests__/sw-registration.unit.test.ts`, `components/web_client/src/sw.ts`, `e2e/m2-service-worker-background-sync.e2e.spec.ts`, `components/web_client/src/sync/replay.ts`.

- [ ] Step 1: Write failing unit tests for `registerPsyklSync()` success, unsupported API no-op, and registration rejection logging.
- [ ] Step 2: Write failing component test that dispatches a `sync` event with tag `psykl-sync` and proves `replay()` drains one queued op.
- [ ] Step 3: Write failing lock test where page and Service Worker both try replay; only one owner drains.
- [ ] Step 4: Implement page-side Background Sync registration after enqueue.
- [ ] Step 5: Implement Service Worker `sync` listener and import the shared replay module.
- [ ] Step 6: Add final Spec close-out docs in the Spec integration PR: feature doc, `CHANGELOG.md`, architecture note for SW update policy, and delete the P4 issue brief plus this spec at close-out.
- [ ] Step 7: Run `pnpm --filter @psykl/web-client test:unit` and `pnpm --filter @psykl/web-client test:component`.
- [ ] Step 8: Commit with `feat: replay pwa writes in background sync`.

## Verification

1. `pnpm verify:static`
2. `pnpm --filter @psykl/web-client test:unit`
3. `pnpm --filter @psykl/web-client test:component`

## Decisions made during spec drafting

- Firefox fallback is the page-side online/focus replay path from Spec 3; no Firefox-specific Service Worker testing is added in M2.

## Open Questions / Risks

- Browser Background Sync scheduling is heuristic-driven; component tests should dispatch synthetic sync events for deterministic coverage.

## Affected by / Depends on

- Depends on Spec 3.
- Blocks Spec 6.
