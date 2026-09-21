---
status: TODO
issue:
pr:
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 1
devtasks_total: 3
devtasks_complete: 0
honors_decisions:
  - 1
  - 2
---

# Shell, Navigation, and List Management — Implementation Spec

> **Outline fidelity.** Frontmatter, user story, components touched, DevTask list and test plan are
> fixed here; `superpowers:writing-plans` expands Steps, file lists, and assertions when this Spec
> starts. Do not expand it early.

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 1/6
**Spec User Story:** _As someone keeping tasks on my phone, I open a navigation drawer to move between my lists and the app's other destinations, and I manage my lists — create, rename, reorder, delete — from a Lists page, so that the app is organised the way a to-do app I would actually keep is organised._
**Status:** see frontmatter
**Time-box:** ~3 days
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md) Decisions appendix.
**UI reference:** `docs/experiments/apple-reminders-ux/apple-reminders-ui/visual-artifact.md` + `screenshots/390-sidebar.png`, `390-lists-page.png`, `1024-loaded-light.png`.

---

## Overview

Replaces the M1 bootstrap shell's chrome with the prototype's. Ships the token sheet and glyph set
that every later Spec consumes, the header (title, sync control, overflow affordance), the navigation
drawer with its destinations, and a Lists page carrying create / rename / reorder / delete.

Touches `components/web_client` only.

**This Spec is deliberately the largest.** `components/ListSwitcher/` owns list create, rename and
delete today; the drawer alone does not replace it, so retiring `ListSwitcher` requires the Lists page
to land in the same Spec. It is split into three DevTasks rather than bent into one oversized PR.

> Vocabulary reminder: `DevTask` is the workflow term for a PR-sized unit of work. `Task` is the PSYKL
> data-model entity. They share no semantics.

---

## Data Model

**None required, because** every list operation this Spec surfaces — create, rename, reorder, delete —
already exists end-to-end and is already exposed by `useLists`. Reorder uses the
`fractional-indexing` positions locked in `todo-experience/DESIGN.md`. Delete is a move to Recently
Deleted, shipped in `todo-experience` Spec 2.

**If that turns out to be wrong** — for example if reorder needs a position the current write path
cannot express — stop and bring the operator a proposal before implementing. Do not invent a schema
change and do not bend the UI to avoid one.

## API

**No API surface, because** the endpoints backing the above already exist in `components/service-task`
and are consumed through the `Service Client` → `Sync Client` → `API Client` path. Same escalation
rule as above applies.

---

## Implementation Components

### `components/web_client/`

- `src/styles/tokens.css` (new) — ported from the experiment's `tokens.css`. **Every token at
  `:root`**; the media blocks redefine values only. Five tokens were silently orphaned inside a
  `@media` block during the experiment's review round 1.
- `src/components/AppShell/` (new) — header, drawer, layout. Consumes `usePathname` / `useActiveList`.
- `src/components/AppShell/Glyphs/` (new) — `DestinationGlyph`, `HeaderGlyph`, `ChevronGlyph`,
  `PlusGlyph`, one tile size.
- `src/components/AppShell/SidebarNav/` (new) — destinations, collapsible Lists section with Recently
  Deleted inside it.
- `src/components/SyncStatus/` (new) — the header sync control, ported from the experiment's
  `SyncStatus/`, reading `useSyncDiscrepancy` and `useFailedSyncCount`.
- `src/components/ListsPage/` (new) — create, rename, reorder, delete.
- `src/App.tsx` — rewritten as the shell. `<h1>PSYKL</h1>`, the "M1 bootstrap shell" line, the three
  bordered buttons and every inline `style={{…}}` object go.
- `src/components/ListSwitcher/` — **deleted** in DevTask 3.

Layout carries the fixes earned in review: `display: flow-root` on the layout to stop margin collapse,
the drawer `position: absolute` not `fixed`, and the header glyph at x=24 / cy=38 in both open and
closed states.

---

## Test Plan

### Static Analysis

No new tooling. `tokens.css` enters the Vite graph; confirm `pnpm -r format:check` covers it.

### Unit tests

| File                                                                    | What it asserts                                                                                             |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/components/AppShell/SidebarNav/__tests__/SidebarNav.unit.test.tsx` | destinations render; the Lists section collapses and expands; the active list is marked                     |
| `src/components/ListsPage/__tests__/ListsPage.unit.test.tsx`            | rename commits on blur and on Return; reorder produces a position between its neighbours; delete asks first |
| `src/components/SyncStatus/__tests__/SyncStatus.unit.test.tsx`          | the control reflects idle / queued / failed / unreachable without a network call                            |

### Integration tests

None — `web_client` has no service-level concerns at this layer.

### Component tests (Storybook + play functions + MSW)

| File                                                       | What it asserts                                                                           |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/components/AppShell/__tests__/AppShell.stories.tsx`   | drawer opens and closes; the header glyph does not shift between states; 390px and 1024px |
| `src/components/ListsPage/__tests__/ListsPage.stories.tsx` | create → rename → reorder → delete against MSW handlers                                   |

**Stories must not write persistent state.** Use MSW and `resetStore()`; the experiment's stories
wrote real rows to IndexedDB and reddened `main` twice.

### End-to-End tests

New, titled as user stories:

| File                         | Title                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `e2e/navigation.e2e.spec.ts` | a user opens the navigation and switches between lists |
| `e2e/lists.e2e.spec.ts`      | a user creates a list and it appears in the navigation |
| `e2e/lists.e2e.spec.ts`      | a user renames a list                                  |
| `e2e/lists.e2e.spec.ts`      | a user re-orders their lists                           |

**Existing E2E specs this Spec must update in the same PR** — all of them select against the chrome
being replaced: `e2e/lists.e2e.spec.ts`, `e2e/task_list.e2e.spec.ts`,
`e2e/recently_deleted.e2e.spec.ts`, `e2e/offline_pressure.e2e.spec.ts`,
`e2e/task_list-offline-sync.e2e.spec.ts`. A slice that leaves one red or skipped has not landed.

### TDD order

1. Unit tests for `SidebarNav` → implement → green
2. Storybook story for the shell → implement header/drawer/layout → green
3. Unit + story for `ListsPage` → implement → green
4. Rewrite the affected E2E specs against the new selectors → green
5. Delete `ListSwitcher/` and prove nothing imports it

---

## DevTasks

3 DevTasks. Each branches off `spec/to-do-ui-s1-shell-navigation-and-lists` and PRs into it.

### DevTask 1: Land the token sheet, glyph set, and app shell

**Files:** ~6
**Branch:** `feat/to-do-ui-s1-dt1-shell-and-tokens`
**PR:** _filled once opened_

### DevTask 2: Wire the sidebar to destinations and the header sync control

**Files:** ~5
**Branch:** `feat/to-do-ui-s1-dt2-sidebar-destinations`
**PR:** _filled once opened_

### DevTask 3: Ship the Lists page and delete `ListSwitcher`

**Files:** ~6
**Branch:** `feat/to-do-ui-s1-dt3-lists-page`
**PR:** _filled once opened_

---

## Verification (manual)

1. `pnpm install && pnpm dev`
2. At 390px: the drawer opens over the list, destinations reach every surface, the header glyph does
   not move between open and closed.
3. At 1024px: the sidebar is persistent and the content column is ≤680px.
4. Compare against `screenshots/390-sidebar.png` and `1024-loaded-light.png` in light and dark.

---

## Open Questions / Risks

- The largest selector churn in the initiative lands here; budget for E2E rework, not just new tests.
- Mixed styling on `/` is at its most visible after this Spec (new chrome, old list). Accepted in
  Decision 1; Spec 2 closes it.

## Affected by / Depends on

Nothing. This Spec is the foundation the other five build on.
