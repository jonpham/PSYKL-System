# PSYKL Logo & App Identity

> Lightweight feature workflow — `docs/workflows/lightweight-feature-workflow.md`. Target: **production**. Lane: **Standard**.
> Issue: [#125](https://github.com/jonpham/PSYKL-System/issues/125). Asset pack: `assets/logo/` (`README.md` documents the set).

## User

Every PWA user — on a phone home screen, an Android launcher, and a desktop browser tab.

## Problem

Today the app has no identity. `index.html` points `rel="icon"` at `/pwa-icon.png`, **a file that does not exist** (`public/` only has `pwa-icon-192.png` and `pwa-icon-512.png`), so browser tabs fall back to a blank glyph. The two placeholder PNGs are 547 B / 1.9 KB generic marks, and the manifest declares the 512 as `purpose: 'any maskable'` without a maskable-safe variant, so Android crops it. In the shell, the mobile trigger reads as a bare hamburger and the sidebar header carries an ✕ that is rendered at every width — including ≥768 px where the sidebar is permanent and cannot be closed.

## Outcome

PSYKL is recognizable everywhere it appears: tab favicon, installed iOS/Android icon, and the in-app header — and the sidebar header stops offering a close affordance on desktop, where it does nothing.

## Scope

- `public/` favicon set + maskable + apple-touch icons from `assets/logo/web/`, and the `index.html` / VitePWA manifest wiring for them.
- New `BrandMark` UI Component: the icon mark inlined as SVG at `currentColor`.
- Mobile trigger button and sidebar header both lead with the mark instead of the hamburger / ✕ glyph.
- Sidebar header is a close **button** only below 768 px; at ≥768 px it renders as a static brand heading.
- **Added 2026-09-22:** the `apple-touch-icon` link tracks Settings → Appearance, so _Add to Home Screen_ installs the light or dark tile the app is currently set to (System defers to the device). Carries a startup fix: stored appearance now applies on load rather than waiting for Settings to be opened.

## Not now

Wordmark/lockup SVGs (`source/psykl-wordmark.svg`, `psykl-lockup.svg`) — the header keeps live text "PSYKL" so it stays theme- and contrast-aware. No splash screens, no iOS `AppIcon.appiconset` wiring (`components/ios_client` is out of scope), no Settings→About branding, no theme-color change.

## Done when

Favicon renders in a desktop tab; an installed PWA on iOS and Android shows the PSYKL mark (uncropped on Android); the mobile header and the open sidebar both show the mark; at ≥768 px no close control exists in the sidebar.

## Verdict

_Filled at close-out._
