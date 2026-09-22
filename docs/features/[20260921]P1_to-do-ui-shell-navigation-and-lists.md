---
status: IN-PROGRESS
issue: P1
branches:
  - feat/to-do-ui-s1-dt1-foundation
  - feat/to-do-ui-s1-dt2-app-shell
  - feat/to-do-ui-s1-dt3-sync-control
  - feat/to-do-ui-s1-dt4-lists-page
prs:
  - https://github.com/jonpham/PSYKL-System/pull/100
  - https://github.com/jonpham/PSYKL-System/pull/101
  - https://github.com/jonpham/PSYKL-System/pull/103
  - https://github.com/jonpham/PSYKL-System/pull/104
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260921-Spec1-shell-navigation-and-lists.md (deleted at Spec close-out; see git history)
---

# Shell, Navigation, and List Management

## User Story

As someone keeping several lists, I want one navigation surface that reaches every part of the app and
a page where my lists live, so that moving between my work is a matter of navigating rather than
hunting through overlays.

## Features

1. A responsive app shell — a dismissible drawer at phone width, a permanent sidebar at desktop width.
2. URL-backed destinations: list, Lists, Sync, Recently Deleted, Settings. Each is linkable, and the
   browser's back button returns the user to their list.
3. A navigation sidebar whose Lists section folds away, with Recently Deleted inside it.
4. A header sync control reading clear or needs attention, counting both queued and permanently failed
   changes.
5. A Lists page for creating, re-ordering and opening lists, replacing the modal list switcher.
6. A production token sheet carrying Standard and Increased contrast in light and dark.

## Verification Steps

**Associated E2E tests:** `e2e/navigation.e2e.spec.ts`, `e2e/lists.e2e.spec.ts`,
`e2e/recently_deleted.e2e.spec.ts`, `e2e/task_list.e2e.spec.ts`

**Manual verification**

_Setup / Preconditions_ — `pnpm install && pnpm dev`, with a browser at both 390px and 1024px.

_Steps_

1. At 390px, open the drawer and reach each destination in turn; press Escape.
2. At 1024px, confirm the sidebar is permanent and the content column is capped.
3. Paste `/lists` into a fresh tab; create a list, re-order it, open it.
4. Press the browser back button from Settings.
5. Toggle the OS between light and dark.

_Expectation_ — every destination is reachable from the navigation and by URL; the drawer returns
focus to its trigger on Escape; list order survives a reload.

## Affected Components

- `components/web_client/src/components/AppShell/` — shell, sidebar navigation, glyphs
- `components/web_client/src/components/SyncStatus/` — header sync control
- `components/web_client/src/components/ListsPage/` — list creation, re-ordering, selection
- `components/web_client/src/hooks/useDestination.ts` — URL ↔ destination mapping
- `components/web_client/src/styles/tokens.css` — production token sheet
- `components/web_client/src/components/ListSwitcher/` — **deleted**

## Design Decisions

- **A — Destinations are URL-backed.** Every destination is a path, not component state, so each is
  linkable and the browser's history is the navigation history.
- **B — Rename a list is out of scope.** The accepted prototype never designed it, and `ListSwitcher`
  (which carried it) is deleted here. **Tracked regression**, to be addressed after `to-do-ui` Spec 6
  with the other prototype-vs-production gaps.
- **C — Delete a list is out of scope.** It belongs to the list options menu, which `to-do-ui`
  DESIGN.md assigns to Spec 4. **Tracked regression** between this Spec and Spec 4.
- **D — Four DevTasks, not three.** The shell and the destinations it serves are separable; splitting
  them kept each PR inside the ten-file limit.
- **Contrast ships as a user choice.** Standard is the default and Increased is a device-local
  setting, rather than choosing between Apple's grays and WCAG AA. The Settings control that selects
  between them lands in Spec 5.
- **The new-list input focuses in `useLayoutEffect`, not via `autoFocus`.** `autoFocus` landed after
  paint and silently dropped the first characters typed — "Book dentist" arrived as "k dentist".

## Architecture Decisions (ADR)

- None. No schema, API, or sync-protocol change; this Spec is the client's presentation layer.

## Change Log

| Date       | PR                                                       | Summary                                            |
| ---------- | -------------------------------------------------------- | -------------------------------------------------- |
| 2026-09-21 | [#100](https://github.com/jonpham/PSYKL-System/pull/100) | Token sheet, URL-backed destinations, glyphs       |
| 2026-09-21 | [#101](https://github.com/jonpham/PSYKL-System/pull/101) | App shell and sidebar navigation                   |
| 2026-09-21 | [#103](https://github.com/jonpham/PSYKL-System/pull/103) | Header sync control and the remaining destinations |
| 2026-09-22 | [#104](https://github.com/jonpham/PSYKL-System/pull/104) | Lists page; `ListSwitcher` retired                 |
