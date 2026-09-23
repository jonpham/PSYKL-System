# Implementation Notes — PSYKL Logo & App Identity

## First slice

One slice, two halves, both needed before the outcome is observable on a phone:

1. **Icons** — real asset set in `public/`, correct `index.html` + manifest wiring (this is what the iOS/Android/tab checks depend on).
2. **Shell** — `BrandMark` component, used by the mobile trigger and the sidebar header; sidebar header becomes a heading at ≥768 px.

## Files

**Assets copied from `assets/logo/web/` → `components/web_client/public/`** (binary, not counted as behavior source):
`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `maskable-192x192.png`, `maskable-512x512.png`, `safari-pinned-tab.svg`. Delete `public/pwa-icon-192.png` and `public/pwa-icon-512.png`.

**Production behavior source files (5 of the ≤10 budget):**

- `components/web_client/index.html` — replace the broken `/pwa-icon.png` link with the real favicon/apple-touch/mask links.
- `components/web_client/vite.config.ts` — VitePWA `manifest.icons` point at the new files; split `any` and `maskable` purposes onto the right assets; `includeAssets` covers the favicon set.
- `components/web_client/src/components/AppShell/BrandMark/BrandMark.tsx` (+ `brand-mark.css`, `index.ts`) — **new**. Inlines the `assets/logo/source/psykl-icon.svg` path set with `fill="currentColor"`, `aria-hidden`, sized from a CSS custom property.
- `components/web_client/src/components/AppShell/AppShell.tsx` — trigger renders `<BrandMark />` instead of `<HeaderGlyph name="menu" />`.
- `components/web_client/src/components/AppShell/SidebarNav/SidebarNav.tsx` — header renders the close **button** (mark + "PSYKL") plus a sibling static `<h1>` brand heading; CSS shows exactly one.

**CSS (not behavior source):** `AppShell/app-shell.css`, `SidebarNav/sidebar-nav.css` — the `@container psykl-shell (min-width: 768px)` block gains the button/heading swap.

`HeaderGlyph` keeps its `menu` / `close` paths for now; remove them only if nothing else consumes them after the swap.

## Data / API concerns

**None.** No schema, no endpoint, no shared model, no `service-task` change. The only non-UI edit is build configuration (`vite.config.ts` manifest + `index.html`), which changes what the PWA installs as its icon — nothing server-side. Per the workflow's _Backend changes_ rule this line is declared empty and needs no escalation.

## Tests

**Operator-granted deviation from the `target = production` test floor, for this change only.** Per the operator's instruction on 2026-09-22, E2E specs and Storybook Component play tests are **excluded from TDD ordering and from the implementation commits**, to cut iteration cost while the header treatment is still being judged by eye. This is a deliberate, time-boxed reduction of the floor in `AGENTS.md` → Test Discipline, not a reinterpretation of it.

| Layer                     | Now                                                                                                                            | After UX approval                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Static analysis           | **Full, unreduced** — lint, format, typecheck                                                                                  | unchanged                                                                                                                 |
| Unit (`*.unit.test.tsx`)  | **TDD as normal** — `BrandMark` renders the mark at `currentColor`; `SidebarNav` renders both the close button and the heading | unchanged                                                                                                                 |
| Component (Storybook)     | Deferred                                                                                                                       | `AppShell` / `SidebarNav` stories updated; new `BrandMark` story; narrow + wide container states pinned                   |
| Integration               | n/a — no service-level concern                                                                                                 | n/a                                                                                                                       |
| E2E (`e2e/*.e2e.spec.ts`) | Deferred                                                                                                                       | Titles taken from `acceptance-checks.md` — mobile open/close via the brand control, and no close control at desktop width |

**The deferral is not the exit.** Close-out for this change is blocked until the Component and E2E layers are restored and green — that is an explicit step in the sequence below, not a follow-up ticket.

## Sequence

1. Assets into `public/`, stale placeholders deleted, `index.html` + `vite.config.ts` wired.
2. Failing unit test → `BrandMark` → green.
3. Failing unit test for the sidebar header structure → `SidebarNav` + `AppShell` + CSS swap → green.
4. Lint / format / typecheck clean; run the app locally on the LAN for operator review on device.
5. **Operator UX review and approval**, iterating on step 3 as needed.
6. Restore the floor: update Storybook stories and E2E specs to the approved UX; full suite green.
7. Close out — `CHANGELOG.md` under `## Unreleased`, `docs/PROJECT_STATUS.md` refreshed, screenshots deleted, feature doc consolidated if requested, PR opened.

## Evidence

Local screenshots into a gitignored directory, deleted at close-out: mobile 390 px closed + sidebar open, desktop ≥768 px sidebar, light / dark / Increased contrast, iOS home-screen icon, Android launcher icon, desktop tab favicon.

## Open questions

- **Mobile trigger glyph** (non-blocking; slice 3 can flip in one line): mark replaces ☰, per issue #125. If it reads as decoration rather than a control on device, the fallback is ☰ on the trigger and the mark in the sidebar header only.
- `components/ios_client` has an `AppIcon.appiconset` waiting in `assets/logo/ios/` — out of scope here, worth its own change when that client is next touched.
