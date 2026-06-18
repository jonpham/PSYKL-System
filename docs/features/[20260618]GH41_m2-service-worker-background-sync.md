---
status: DONE
issue: [GH#41](https://github.com/jonpham/PSYKL-System/issues/41)
branches:
  - feat/m2-s4-dt9-injectmanifest-sw
  - feat/m2-s4-dt10-background-sync
prs:
  - pending
  - pending
completed_at: 2026-06-18
created_at: 2026-06-18
initiative: m2-pwa-crud-offline
spec: consolidated-into-this-doc
---

# M2 Spec 4: Service Worker + Background Sync

> Generated from `superpowers:writing-plans` artifacts and completed using `superpowers:executing-plans` with `superpowers:test-driven-development`.

## User Story

As a user, I want the Progressive Web App (PWA) shell to load offline and queued writes to replay from the Service Worker when Chromium permits Background Sync so that flaky-network use does not depend on keeping a tab open.

## Features

1. `components/web_client` now uses `vite-plugin-pwa` `injectManifest` with an owned `src/sw.ts`.
2. The Service Worker precaches the app shell, serves single-page-app navigations from cached `index.html`, and uses stale-while-revalidate for default `GET /tasks` reads.
3. The PWA entrypoint registers `/sw.js` without calling `skipWaiting()`, preserving one Service Worker version per live session.
4. `registerPsyklSync()` registers the literal `psykl-sync` Background Sync tag after queue enqueue when the browser supports `registration.sync`.
5. The Service Worker handles `sync` events with tag `psykl-sync` and runs the shared `src/sync/replay.ts` module as owner `service-worker`.
6. Existing IndexedDB replay locking prevents page and Service Worker contexts from draining the queue concurrently.
7. Component coverage now includes real Playwright Chromium tests for Service Worker registration, offline app-shell navigation, stale-while-revalidate Task reads, Background Sync replay, and lock-yield behavior.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m2-pwa-crud-offline/DESIGN.md`.
- Original issue brief: `docs/initiatives/m2-pwa-crud-offline/issues/[20260522]P4_m2-service-worker-background-sync.md` (deleted by this PR).
- Execution spec: `docs/specs/m2-pwa-crud-offline/20260610-S4-service-worker-background-sync.md` (deleted by this PR).
- GitHub issue: [#41](https://github.com/jonpham/PSYKL-System/issues/41).

## Verification Steps

**Associated End-to-End test:** none in this Spec. M2 Spec 6 covers full multi-device offline flows.

**Manual verification**

Setup / Preconditions:

- Node 24 LTS is active.
- Dependencies are installed with `pnpm install`.
- Generated artifacts are refreshed with `pnpm verify:prepare`.

Steps:

1. Run `pnpm verify:static`.
2. Run `pnpm --filter @psykl/web-client test:unit`.
3. Run `pnpm --filter @psykl/web-client test:component`.
4. Build and preview the PWA with `pnpm --filter @psykl/web-client build && pnpm --filter @psykl/web-client preview`.
5. Open `http://localhost:4173` in Chromium and confirm DevTools Application shows an active `/sw.js`.
6. Reload once, toggle the browser offline, and navigate to a client route such as `/offline-shell-check`.
7. Confirm the app shell still renders.
8. Queue a Task write, then confirm Background Services shows the `psykl-sync` tag in Chromium when available.

Expectation: The PWA shell survives offline navigation, default Task reads use the Service Worker runtime cache, and queued writes can replay from either the page or Service Worker without concurrent drains.

## Affected Components

- `components/web_client`: Vite PWA config, Service Worker entrypoint, Background Sync registration helper, page enqueue trigger, Playwright Component tests, Workbox dependencies.
- Durable docs: `README.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/STACK.md`, `docs/PROJECT_STATUS.md`.

## Design Decisions

- **Decision #36:** Service Worker strategy uses `vite-plugin-pwa` `injectManifest` and owned `src/sw.ts`.
- **Decision #49:** Service Worker behavior is tested in real Playwright Chromium at the Component layer.
- **Decision #51:** Offline tests use browser offline controls and Playwright browser APIs rather than new network infrastructure.
- **Decision #52:** Sync replay is shared between page and Service Worker contexts, guarded by the IndexedDB replay lock.
- **Decision #55:** Spec and DevTask branch workflow follows the project branching model.

## Architecture Decisions (ADR)

- **ADR-M2-014:** `web_client` owns its Service Worker through `vite-plugin-pwa` `injectManifest`.
- **ADR-M2-015:** Service Worker upgrades do not call `skipWaiting()`; live sessions stay on one Service Worker version.
- **ADR-M2-016:** The Background Sync tag is the literal string `psykl-sync`.
- **ADR-M2-017:** Service Worker replay uses the same `src/sync/replay.ts` module and IndexedDB lock as page replay.

## Change Log

| Date       | PR      | Summary                                                                   |
| ---------- | ------- | ------------------------------------------------------------------------- |
| 2026-06-18 | pending | M2-9: owned Service Worker, app-shell cache, and Task-read runtime cache. |
| 2026-06-18 | pending | M2-10: Background Sync registration, Service Worker sync event replay.    |
