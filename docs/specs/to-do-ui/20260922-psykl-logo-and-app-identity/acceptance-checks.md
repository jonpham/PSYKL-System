# Acceptance Checks — PSYKL Logo & App Identity

> Target: production. These are the source for the E2E test titles this change ships — see the deferral in `implementation-notes.md` → Tests.

- [ ] **Favicon** — loading the app in a desktop browser shows the PSYKL mark in the tab, and `/favicon.ico` returns 200 (no 404 for `/pwa-icon.png`).
- [ ] **iOS install** — adding the app to the iPhone home screen from Safari shows the PSYKL mark, opaque, uncropped by the iOS mask.
- [ ] **Android install** — installing from Chrome shows the PSYKL mark inside the launcher's mask with no edge clipping (maskable safe zone respected).
- [ ] **Mobile header** — at ~390 px the header shows the PSYKL mark next to "PSYKL"; tapping it opens the sidebar.
- [ ] **Sidebar close on mobile** — with the sidebar open at ~390 px, the header shows the mark and tapping it closes the sidebar; Escape and the backdrop still close it.
- [ ] **No close control on desktop** — at ≥768 px the sidebar header is a heading, not a button: it is not focusable by Tab and clicking it does nothing.
- [ ] **Theme & contrast** — the mark is legible in light, dark, and Increased-contrast appearance, following the same colour as the "PSYKL" text beside it.
- [ ] **Keyboard & focus** — on mobile, opening the sidebar still moves focus to the sidebar header control and closing returns focus to the trigger.

## Added 2026-09-22 — app icon follows the appearance setting

Scope extension agreed with the operator after the first device review. iOS bakes the home-screen icon at _Add to Home Screen_ time from the `apple-touch-icon` link in the live document, and offers no dark variant of its own; the app therefore chooses which tile the next install gets.

- [ ] **Explicit choice wins** — with Settings → Appearance on Dark, removing and re-adding the home-screen icon installs the dark tile; on Light it installs the light tile, whatever the device appearance is.
- [ ] **System follows the device** — with Appearance on System, the tile installed matches the device's current light/dark setting.
- [ ] **Correct from startup** — the choice applies on a cold load without opening Settings first, so an install at any moment gets the right tile.
- [ ] **Saved appearance survives a reload** — a saved Dark appearance themes the app immediately on load (this did not work before: `data-theme` was only stamped when Settings mounted).
- [ ] **Already-installed icons do not change** — documented, not a defect: the user must delete and re-add the home-screen icon for a new choice to take.

## Verified

**2026-09-22, Chromium via Playwright** — the four icon-selection behaviours above pass against the built app: light system → light tile; choosing Dark → dark tile; reload with no Settings visit → dark tile (startup path); choosing System under a light device → light tile; fresh profile under a dark device → dark tile.

_Device verification on the iPhone still outstanding, and it is the one that matters — only a real Add to Home Screen proves Safari reads the rewritten link._
