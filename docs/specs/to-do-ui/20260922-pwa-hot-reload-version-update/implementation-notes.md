# Implementation Notes — PWA Update from App

## First slice

- Publish a build-stamped `version.json` next to the bundle, read it from the About section as **Available**, and render the three-state version block (Checking / Up to date / Update available).
- Wire the button to the service-worker skip-waiting + reload handshake, with a timeout fallback to a plain reload.

## Why today's app can't do this

`vite.config.ts` sets `registerType: 'autoUpdate'` but also `injectRegister: false`, and registration is hand-rolled in `main.tsx` — so `virtual:pwa-register`'s auto-update path never runs. `src/sw.ts` calls `clientsClaim()` but never `skipWaiting()`, so a replacement worker stays in `waiting` until every client closes. On an installed iOS PWA that effectively never happens.

## Files

- `components/web_client/vite.config.ts` — small plugin: emit `version.json` (`{ commit, builtAt }`) into `dist/`, plus a dev-server middleware serving the `dev` sentinel. `injectManifest.globPatterns` already excludes `.json`, so it is **not** precached.
- `components/web_client/nginx.conf` — `location = /version.json` with `Cache-Control: no-store`.
- `components/web_client/src/api/version.ts` — add `fetchAvailableWebVersion()` (`cache: 'no-store'`, rejects non-JSON so the SPA `try_files` fallback reads as failure, not as a version).
- `components/web_client/src/hooks/useAppUpdate.ts` — new: runs `registration.update()`, fetches the available version, exposes `{ status, currentCommit, availableCommit, applyUpdate, recheck }`.
- `components/web_client/src/sw.ts` — handle `{ type: 'PSYKL_SKIP_WAITING' }` → `self.skipWaiting()`.
- `components/web_client/src/components/AppVersion/` — **renamed from `VersionFooter/`** (operator decision): `AppVersion.tsx`, `app-version.css`, `index.ts`, and the `__tests__/` files renamed with it. Presentation rewritten per the visual artifact; API commit demoted to a detail row. Commit hash only — no build date (operator decision).
- `components/web_client/src/components/SettingsView/SettingsView.tsx` — one import/JSX line updated to `<AppVersion />`.

Six production source files (the rename counts as one moved component) — inside the ≤10 per-PR limit.

## Data / API concerns — **raise before implementing**

- **No service-task, schema, or shared-model change.** `GET /version` is used exactly as today.
- **One build-pipeline addition:** `version.json` emitted at build time from `VITE_GIT_SHA`. CI already passes `--build-arg VITE_GIT_SHA=${{ github.sha }}` (`components/web_client/Dockerfile`), so no CI change is expected — but the file is new deploy surface and one nginx caching rule, so it is declared here per the workflow.
- **Consequence for the first update:** a client running the _current_ production bundle has no update UI. It must be refreshed once by hand to pick up this feature; every deploy after that is updatable from within the app.
- Considered and rejected: asking the waiting worker for its own baked version over a `MessageChannel` (no extra file, but relies on messaging a worker in `installed` state — weaker on iOS and untestable in unit tests).

## Tests — reduced floor, by operator instruction

Operator directive for this change (token-cost control during iteration): **no E2E and no Storybook/component play tests until after manual verification and UX approval.** This is a deliberate, time-boxed deviation from the `target = production` test floor in `docs/workflows/lightweight-feature-workflow.md`.

- **During implementation:** TDD with Unit tests only — `version.ts` (available-version parse, non-JSON rejection), `useAppUpdate` (up-to-date / update-available / failed / timeout-fallback transitions), `AppVersion` (the five states render per the storyboard).
- **After approval, in the same PR before merge:** add the E2E spec (`e2e/settings.e2e.spec.ts`, titles taken from the acceptance checks) and update `AppVersion.stories.tsx` / `SettingsView.stories.tsx` to the new UX. Static analysis (lint, format, typecheck) is **not** reduced at any point.

## Evidence

Screenshots into a local gitignored `screenshots/` folder: Up to date, Update available, Updating, Offline — desktop and ~390px — plus one iPhone home-screen PWA capture of the real update. Deleted at close-out; findings preserved as text.

## Resolved by operator review (2026-09-22)

- Component renamed `VersionFooter` → `AppVersion`; it is no longer a footer.
- Commit hash only — no `builtAt` date in the UI.
- Row label reads **Current**, not "Currently loaded".
