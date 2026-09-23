---
status: DONE
issue: GH124
branches:
  - feat/124-pwa-hot-reload-version-update
prs:
  - https://github.com/jonpham/PSYKL-System/pull/131
completed_at: 2026-09-22
created_at: 2026-09-22
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260922-pwa-hot-reload-version-update/ (deleted at close-out; see git history)
---

# In-app PWA update from Settings

## User Story

As someone running PSYKL as an installed iOS home-screen PWA, I want to see which web version I am
running and move to the newly deployed one from inside the app, so that a new release reaches me
without deleting my home-screen bookmark or clearing website data.

## Features

1. Settings → About reads `Current Version: <commit>` in plain language, with no section heading of
   its own — [#124](https://github.com/jonpham/PSYKL-System/issues/124).
2. One button carries the whole interaction: **Check for updates** → **Checking…** → **Update to
   Latest** when a newer bundle is found → **Updating…** while the swap runs.
3. The check runs on mount and again on demand, so a user sitting on Settings never has to navigate
   away and back to find out whether a deploy landed.
4. The available version is shown only while it differs from the loaded one; when it matches, the
   status line reads `Last checked: <date, time>` instead.
5. Pressing **Update to Latest** activates the waiting service worker and reloads onto the new
   bundle, returning to `/settings` because every destination is URL-backed.
6. A failed check reads _Couldn't check for updates_ and keeps the button live for a retry.
7. The service-task build commit remains below as an `API build` provenance detail.

## Verification Steps

**Associated E2E test:** `e2e/settings.e2e.spec.ts` (four active tests; one committed skipped — see
Design Decisions).

**Manual verification**

_Setup / Preconditions_ — the compose stack built at one commit and installed on a device as a
home-screen PWA; `docker-compose.override.yml` pointing the bundle at the workstation's LAN IP.

_Steps_

1. `VITE_GIT_SHA=v1 docker compose up --build -d`, open `/settings` on the phone, add to Home Screen.
2. Confirm `Current Version: v1`, a **Check for updates** button, and a `Last checked:` stamp.
3. `VITE_GIT_SHA=v2 docker compose up --build -d web-client` — a deploy, with the PWA still open.
4. In the PWA's Settings, press **Check for updates**.
5. Press **Update to Latest**.

_Expectation_ — step 4 reveals `Available: v2` and turns the button into **Update to Latest**; step 5
reloads within a few seconds and returns to Settings reading `Current Version: v2` with no available
row and a fresh `Last checked:` stamp. No bookmark deletion and no website-data clear at any point.

Verified on 2026-09-22 across four deploys (`v1-before` → `v4-spacing`) on an iPhone home-screen PWA
and a desktop browser; the UX was accepted on the fourth.

## Affected Components

- `components/web_client/src/components/AppVersion/` — new; renamed from `VersionFooter/`, which no
  longer described a component that is not a footer and does more than report.
- `components/web_client/src/hooks/useAppUpdate.ts` — new; owns checking, the skip-waiting handshake,
  and the reload.
- `components/web_client/src/api/version.ts` — `fetchAvailableWebVersion()`.
- `components/web_client/src/sw.ts` — handles `PSYKL_SKIP_WAITING`.
- `components/web_client/vite.config.ts` — emits `version.json`; dev-server middleware serves the
  `dev` sentinel.
- `components/web_client/nginx.conf` — `no-store` for `/version.json`, `no-cache` for `/sw.js`.
- `components/web_client/src/components/SettingsView/`, `src/experiment/apple-reminders-ux/SettingsView/`
  — follow the rename.

## Design Decisions

1. **The stale-PWA trap was two bugs, not one.** `src/sw.ts` claims clients but never calls
   `skipWaiting()`, so a replacement worker waited for every client to close — which an installed iOS
   PWA effectively never does. Separately, nginx's `\.(js|css|…)$` rule was serving `sw.js` with
   `expires 1y; immutable`, so the browser had no reason to re-fetch the worker script at all. Both
   are fixed here; fixing only the first would have left the feature unable to see a new deploy.
2. **Available version comes from a build-stamped `/version.json`, not from the waiting worker.**
   Asking the waiting worker for its own baked commit over a `MessageChannel` needs no extra file,
   but relies on messaging a worker in `installed` state — weaker on iOS and not unit-testable. The
   manifest is emitted outside the precache (`injectManifest.globPatterns` covers no `.json`) and
   served `no-store`, and a non-JSON response is rejected so nginx's SPA fallback reads as a failed
   check rather than as a version.
3. **Update reload is unconditional.** The handshake races `controllerchange` against a 5s timeout
   and reloads either way, so a worker that never takes control cannot strand the user on
   _Updating…_.
4. **Available is hidden while it matches Current** (operator review): an available version equal to
   the loaded one is noise, and the `Last checked:` stamp carries the same news more usefully.
5. **First-update caveat, accepted.** A client already running an older bundle has no update UI and
   must be refreshed once by hand to pick this up. Every deploy after that is updatable in-app.
6. **The skip-waiting handshake ships with a skipped E2E test.** Driving it needs two genuinely
   different bundles served in sequence, which the single-image compose stack cannot do. The button's
   check → update → reload path is covered by active tests; the handshake itself is covered by the
   `useAppUpdate` unit tests.
7. **Test floor was reduced during implementation only.** On operator direction, TDD ran with unit
   tests alone while the UX iterated; the Storybook stories and E2E specs were written before merge,
   in this same PR. Static analysis was never reduced.

8. **CI retries the component command, not the individual test.** A Storybook play test that waits on
   a deliberately delayed affordance has far less slack on a contended runner, and `PendingQueuedTask`
   was failing there intermittently; its `waitFor` budget is raised from 3s to 8s. `jest.retryTimes`
   inside `.storybook/test-runner.ts` was tried as a second line of defence and rejected — a story
   rigged to throw on every run was reported as **passed** on its retry, so that mechanism can turn
   real breakage green. The CI step retries the whole command instead, where a genuine failure still
   fails every attempt.

## Architecture Decisions (ADR)

- None. No schema, API, or shared-model change; `GET /version` is used exactly as before. The one
  addition to deploy surface is the build-stamped `version.json` and its two caching rules.

## Change Log

| Date       | PR                                                       | Summary                                                                                               |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 2026-09-22 | [#131](https://github.com/jonpham/PSYKL-System/pull/131) | In-app update from Settings → About; `VersionFooter` renamed `AppVersion`                             |
| 2026-09-22 | [#131](https://github.com/jonpham/PSYKL-System/pull/131) | CI component job retries at the command level; `PendingQueuedTask`'s wait budget raised from 3s to 8s |
