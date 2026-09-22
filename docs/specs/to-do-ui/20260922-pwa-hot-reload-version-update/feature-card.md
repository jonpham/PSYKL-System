# PWA Update from App — hot-reload to the latest deployment

> Lightweight feature workflow — `docs/workflows/lightweight-feature-workflow.md`. Target: `production`. Lane: Standard.
> Tracks [#124](https://github.com/jonpham/PSYKL-System/issues/124) (under [#121](https://github.com/jonpham/PSYKL-System/issues/121), v0.5 polish).

## User

An iOS Safari user running PSYKL as an installed home-screen PWA, who opens Settings after a new version has been deployed.

## Problem

Today Settings → About → Version shows two build commits (`web <sha> · api <sha>`) and the word `in sync` / `version mismatch` — which describes web-vs-API deploy skew, not "your app is stale". When a new web bundle deploys, the installed service worker keeps serving the cached bundle and the replacement worker sits in `waiting` forever, because the app never calls `skipWaiting()` and an installed iOS PWA is rarely fully closed. The only escape today is deleting the home-screen bookmark or clearing website data.

## Outcome

From Settings → About the user can see which web version is loaded, which one is available, and press one button to hot-reload onto the new version — landing back on Settings, now reading "Up to date".

## Scope

Settings → About → Version block rewritten: plain-language **Current** / **Available** rows, an update check on mount, an **Update to latest version** button shown only when they differ, and the skip-waiting + reload handshake. The API commit row stays, demoted to a provenance detail.

## Not now

No background "update available" banner outside Settings, no automatic update-on-launch, no release notes, no version history, no change to the service-task API.

## Done when

On an iPhone home-screen PWA running an older build, opening Settings shows a different Available version, tapping the button reloads within a few seconds, and the reopened Settings view reports "Up to date" with both rows equal — with no bookmark deletion or website-data clear.

## Verdict

{Filled at close-out.}
