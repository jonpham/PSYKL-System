---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: # GH#N once a GitHub Issue is manually created from this brief
branches: # one entry per DevTask (each branches off spec/m2-s4-... per revised workflow)
  -
prs: # one entry per DevTask PR (each targets the Spec branch)
  -
spec_branch: # spec/m2-s4-service-worker-background-sync once cut
spec_pr: # PR URL for spec/m2-s4-... → main
completed_at:
created_at: 2026-05-22
initiative: m2-pwa-crud-offline
spec: 4
devtasks_total: 2 # M2-9 + M2-10
devtasks_complete: 0
---

# 20260522 - M2 Spec 4: Service Worker via injectManifest + Background Sync registration

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge into the Spec branch, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **user**, I want **the app shell to load when I'm offline and have my queued writes sync in the background after I've closed the tab** so that **opening the PWA on a flaky network feels instant, and edits I made yesterday don't sit waiting because I forgot to reopen the app today**.

## Features (DevTasks composing this Spec)

1. **DevTask M2-9 — `src/sw.ts` via `vite-plugin-pwa` `injectManifest`.** Switch `vite.config.ts` from M1's manifest-only `generateSW` minimal mode to `injectManifest` strategy (Decision #36). Write `src/sw.ts` using Workbox helpers: `precacheAndRoute(self.__WB_MANIFEST)` for the app shell, `registerRoute` with a `StaleWhileRevalidate` strategy for `GET /tasks` (network), navigation fallback to `index.html` for client-side SPA routes. `vite-plugin-pwa` configured with `registerType: 'autoUpdate'` (the SW silently swaps when a new version is ready; tab-close-then-reopen activates it). Component-layer tests using real Playwright Chromium (per Decision #49) drive SW install / activate / `skipWaiting` / `clients.claim` and assert the SWR cache works for `GET /tasks`. ~5 production behavior source files.
2. **DevTask M2-10 — Background Sync registration + SW 'sync' event handler.** Page-side: after each `replay.enqueue(op)` call (added in Spec 3), call `navigator.serviceWorker.ready.then(r => r.sync.register('psykl-sync'))`. SW-side: `self.addEventListener('sync', (event) => { if (event.tag === 'psykl-sync') { event.waitUntil(replay()); } })`. The SW imports `src/sync/replay.ts` from Spec 3 — same module, two contexts, IDB lock prevents concurrent execution. Component-layer test: tab-closed + connectivity-returns scenario simulated via Playwright `serviceWorker.dispatchEvent('sync')`. Concurrent-replay-lock contract test: both contexts attempt `acquireReplayLock()` simultaneously; only one wins; the loser observes the lock and yields. ~4 production behavior source files.

## Verification Steps

**Associated E2E test:** none directly in this Spec — Spec 6 (M2-13) covers the full offline-app-shell-load and tab-closed-background-sync E2Es with two Playwright contexts. This Spec ships Component-layer tests driving the real SW.

**Manual verification:**

_Setup / Preconditions_

- Specs 1, 2, and 3 merged into `main`. (Or DevTasks present in dev stack.)
- Spec branch `spec/m2-s4-service-worker-background-sync` cut from `main`; draft PR opened against `main`.
- `service-task` running on `:3000`. `web_client` running on `:5173`.
- A Chromium-family browser (Chrome / Edge / Brave). Background Sync API is required; Firefox and Safari fall back to page-side replay (Spec 3) but won't exercise the SW path.

_Steps_

1. Run `pnpm --filter web_client test:component` — Component-layer tests pass: SW install/activate lifecycle, SWR cache hit on second `GET /tasks`, `sync` event triggers `replay()`, page+SW concurrent-lock contract.
2. Open PWA at `:5173`. DevTools → Application → Service Workers: confirm a SW is registered and activated (`activated and is running`).
3. Application → Cache Storage: confirm a precache bucket exists with the app shell entries (HTML, JS, CSS bundles, manifest, icons).
4. Network → reload. The HTML response comes from `(ServiceWorker)`, not the network. Bundle assets also from cache.
5. Stop `service-task` (kill the dev server). Reload PWA. App shell still loads (from SW precache). Task list shows IDB-hydrated data (from Spec 2). No "Could not connect" UI.
6. Start `service-task` back up. Trigger a new task creation via PWA UI. `sync_queue` row created, Background Sync registered (DevTools → Application → Background Services → Background Sync shows a registered tag `psykl-sync`).
7. Toggle Network "Offline" ON. Create another task offline. Confirm queue grows.
8. Close the PWA tab entirely (not just background — close).
9. Toggle Network "Offline" OFF (or rejoin network at the OS level).
10. Re-open `:5173`. New task arrives synced on the server (verified via `curl http://localhost:3000/tasks -H 'X-User-Id: local'`). The SW fired its `sync` event in the background while the tab was closed.
11. Concurrent-replay test: open two PWA tabs. Make rapid edits in both. Confirm exactly ONE replay context is active at a time (DevTools console logs from `acquireReplayLock`). No duplicate POSTs (verified by checking the `idempotency` table on the server — same `Idempotency-Key` appears once).

_Expectation_
The PWA loads its shell instantly even with no network. Queued writes sync in the background even when the tab is closed (on Chromium). The IDB lock prevents the page-side replay and the SW-side replay from racing. Service-worker upgrade swaps silently in the background.

## Affected Components

- `components/web_client/` (extended):
  - `src/sw.ts` (new — Service Worker entry point via `injectManifest`).
  - `vite.config.ts` (extended — switch from `generateSW` minimal to `injectManifest`; configure `registerType: 'autoUpdate'`, precache globs, runtime SWR caching for `/tasks`).
  - `src/main.tsx` (extended — register the SW + register Background Sync after enqueue).
  - `src/sync/background-sync.ts` (new — Background Sync registration helper called by `replay.enqueue()`).
  - `src/sw.component.test.ts` (new — Playwright-driven Component-layer tests for SW lifecycle + sync event).
  - `package.json` (add `workbox-window` for the page-side registration helper if not already present).

## Design Decisions

From `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` → Decisions appendix:

- **#36** Service Worker strategy: `vite-plugin-pwa` `injectManifest`. Own `src/sw.ts`. M2 scope: precache app shell + SWR for `GET /tasks`.
- **#49** Service Worker testing: real Playwright Chromium at Component layer. SW lifecycle, fetch handler, `sync` event all driven against a real browser.
- **#52** Sync engine location: hybrid. SW imports `src/sync/replay.ts` (shared module from Spec 3). IDB lock prevents concurrent replay between page and SW.

## Architecture Decisions (ADR)

- **ADR-M2-013:** `registerType: 'autoUpdate'` is the SW update strategy. New SW silently installs and waits for all clients to close before activating. The user sees fresh code on next cold start. **Critical: no `skipWaiting()`.** The user-visible failure mode if we ever called it would be:

  ```
  User is mid-session. Old SW v1 is active and running replay() in
  the background.

  We ship v2 with a different replay.ts module shape (e.g., changed
  op_type semantics or new sync_queue field).

  New SW v2 installs in the background, calls skipWaiting(), and
  terminates old SW v1 immediately.

  Old SW v1's in-progress replay state is lost; new SW v2 picks up
  sync_queue with v2 expectations. If v1 had partially drained the
  queue, the IDB transaction that would have removed already-acked
  ops never completes; v2 may re-POST them (Idempotency-Key catches
  the server-side double-write but wastes requests and bandwidth).

  The page is now controlled by v2 with potentially-different fetch
  handler shapes; in-flight network calls from v1 may complete in
  unexpected ways. User sees weird optimistic state, possibly stale
  rows in the list, or a refresh that wipes their working view.
  ```

  By NOT calling `skipWaiting()`, sessions stay coherent within a SW version: the user always interacts with one consistent code path until they close all tabs. Users see new code only on next cold start (e.g., next morning after the daily phone reboot, or after a deliberate tab close-and-reopen). The cost is users see a one-session lag before new features arrive; the benefit is zero mid-session SW swap risk. See Decision #36 + ADR-M2-014. (Per the durable-docs principle, this ADR carries forward into the Spec M2-4 feature doc at M2 close, and `docs/ARCHITECTURE.md` cross-references it once the policy is shipped.)

- **ADR-M2-014:** Inter-version replay safety: the `Idempotency-Key` mechanism (Spec 1) is what makes SW upgrades safe even if the v1 SW completes a partial replay that the v2 SW would have done differently — the server dedupes. Replay code in `src/sync/replay.ts` is therefore versioned along with the bundle; the live SW always runs the code it was deployed with, never a hot-swapped version.
- **ADR-M2-015:** Background Sync tag is the literal string `'psykl-sync'`. One tag for the entire queue (FIFO replay drains it). Per-task tags or per-op tags were considered and rejected — they would require coordinating tag lifecycle with queue evolution and offer no benefit since the queue is already FIFO.
- **ADR-M2-016:** SW does NOT cache `GET /tasks?include_deleted=1` via SWR. That endpoint is a sync-engine-only path; UI never calls it directly, so it doesn't need the runtime cache. Restricting SWR to the default `GET /tasks` avoids stale tombstone visibility.

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
