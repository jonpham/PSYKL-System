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

## Verified

_Filled after the slice runs on device._
