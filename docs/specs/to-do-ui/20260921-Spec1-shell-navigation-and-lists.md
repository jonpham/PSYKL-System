---
status: IN-PROGRESS
issue:
pr: https://github.com/jonpham/PSYKL-System/pull/99
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 1
devtasks_total: 4
devtasks_complete: 0
honors_decisions:
  - 1
  - 2
  - 5
---

# Shell, Navigation, and List Management — Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended)
> or `superpowers:executing-plans` to implement this Spec DevTask-by-DevTask. Steps use checkbox
> (`- [ ]`) syntax for tracking. Written by `superpowers:writing-plans`, expanded from the outline
> committed 2026-09-21 after a `superpowers:brainstorming` research pass.

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 1/6
**Spec User Story:** _As someone keeping tasks on my phone, I open a navigation drawer to move between my lists and the app's other destinations, and I create and re-order my lists from a Lists page, so that the app is organised the way a to-do app I would actually keep is organised._
**Status:** see frontmatter
**Time-box:** ~3 days
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md) Decisions appendix (LOCKED — do not re-open), and [`docs/DESIGN.md`](../../DESIGN.md) → Theming Architecture, Contrast, Spacing and metrics, Chrome and Navigation.
**UI reference:** `docs/experiments/apple-reminders-ux/apple-reminders-ui/visual-artifact.md` + `screenshots/390-sidebar.png`, `390-lists-page.png`, `1024-loaded-light.png`.
**Port source:** `components/web_client/src/experiment/apple-reminders-ux/` — the accepted prototype. Every component below is a **port**, not a fresh design. Read the source before writing the target.

---

## Overview

Replaces the M1 bootstrap shell's chrome with the prototype's. Ships the production token sheet and
glyph set that every later Spec consumes, URL-backed destinations, the header (title, sync control),
the navigation drawer, and a Lists page carrying create and re-order.

Touches `components/web_client` only.

> Vocabulary reminder: `DevTask` is the workflow term for a PR-sized unit of work. `Task` is the PSYKL
> data-model entity (`id, user_id, title, created_at`). They share no semantics.

## Global Constraints

Copied verbatim from the design docs. Every DevTask's requirements implicitly include this section.

- **Every token is defined at the theme's root selector.** Media blocks (`prefers-color-scheme`,
  `prefers-reduced-motion`) may only _redefine_ values or set rules. A token whose sole definition
  sits inside a media block is dead everywhere else. (`docs/DESIGN.md` → Two token tiers.)
- **The reduced-motion block contains motion rules only — never a token definition.**
- **No inline `style={{…}}` objects and no raw hex literals in components.** Every value comes from a
  token. (`docs/DESIGN.md` → Anti-patterns; `docs/STYLE.md` → Styling.)
- **`--accent-session` is reserved for a live PSYKL session.** Never a link, button, selection, or
  focus ring. It is defined in the token sheet by this Spec and referenced by nothing.
- **Components reference semantic tokens only**, never primitives.
- **Row metrics are not themable:** `--row-min: 44px`, `--gutter: 1rem`, `--content-max: 680px`,
  `--icon-tile: 2.5rem`, `--icon-glyph: 1.25rem`.
- **Motion durations:** press 100ms · chevron rotate 150ms · sheet in/out 300ms. Easing: enter
  `ease-out` · exit `ease-in` · move `ease-in-out`.
- **UI Component folder layout:** every component gets its own directory with `<Name>.tsx`, a child
  `__tests__/`, and an `index.ts` re-export. Single-consumer components nest under their parent.
- **No milestone tokens** in filenames or identifiers.
- **No workflow identifiers, future-agent notes, or historical framing in code comments**, and no code
  comment referencing a markdown document. Comments describe current behaviour. Which test a DevTask
  activates is recorded in this doc's activation table, never in the test file. (`docs/STYLE.md` →
  Code Comments; established by the PR #99 review.)
- **≤10 production behaviour source files per DevTask PR.** Tests, config and docs are exempt from
  the count but never from the PR.
- **Storybook stories must not write persistent state.** Use MSW handlers and `resetStore()`; the
  experiment's stories wrote real rows to IndexedDB and reddened `main` twice.

---

## Data Model

**No schema changes.** Verified against source, not assumed:

- `src/hooks/useLists.ts:19-26` already exposes `createList`, `deleteList`, `moveList`, `renameList`
  and `canDelete`.
- `moveList` (`src/hooks/useLists.ts:73-87`) already computes a position with
  `generateKeyBetween(before?.position, after?.position)` from `fractional-indexing` and patches
  through `listServiceClient`. Re-order needs no new write path.
- Destinations are UI state expressed in the URL; nothing is persisted for them. Appearance and
  contrast persistence is **Spec 5's** work in `sync_meta`, not this Spec's.

**If that turns out to be wrong** — stop and bring the operator a proposal before implementing. Do not
invent a schema change and do not bend the UI to avoid one.

## API

**No API surface.** The list endpoints backing create / re-order already exist in
`components/service-task` and are consumed through the `Service Client` → `Sync Client` →
`API Client` path. Same escalation rule as above.

---

## Decisions made during spec drafting

Four decisions that were **not** in `to-do-ui/DESIGN.md` and were resolved with the operator on
2026-09-21 during the brainstorming pass. Research contradicted the outline on three of them.

### Drafting decision A — Destinations are URL-backed

The prototype holds the destination in `useState<Destination>`
(`src/experiment/apple-reminders-ux/AppleRemindersUxExperiment.tsx:27`). Production does not: a new
`useDestination` hook maps each destination to a path on top of the existing hand-rolled
`usePathname` / `navigate` (`src/hooks/usePathname.ts`).

| Destination      | Path                |
| ---------------- | ------------------- |
| active list      | `/`                 |
| Lists            | `/lists`            |
| Sync             | `/sync`             |
| Recently Deleted | `/recently-deleted` |
| Settings         | `/settings`         |

**Why:** no new dependency, one new file, deep links and the browser back button work, and E2E can
navigate by URL instead of clicking through the drawer on every test. **Accepted cost:** back-button
navigation between destinations is behaviour the prototype did not have.

**Not chosen:** `react-router` (a dependency out of proportion to this slice) and in-memory state
(makes every E2E drive the drawer and leaves the back button exiting the app from Settings).

### Drafting decision B — Rename a list is out of scope for this Spec

Research finding: **the prototype never renames a list.** `renameList` has zero call sites anywhere
under `src/experiment/`; `ListsView.tsx:13` claims "Renaming happens in the list itself" and it does
not happen anywhere. The outline's "rename commits on blur and on Return" test line was written
against a capability the accepted prototype does not contain.

Operator decision: this is a known prototype-vs-production gap, to be addressed **after `to-do-ui`
Spec 6** alongside the other gaps. This Spec does not design it, ship it, or write an E2E for it.

### Drafting decision C — Delete a list is out of scope for this Spec

The prototype's delete lives in `ListMenu` (`src/experiment/apple-reminders-ux/ListMenu/ListMenu.tsx:88`),
which `to-do-ui/DESIGN.md` assigns to **Spec 4**. `components/ListSwitcher/` — deleted by this Spec —
is the only delete surface on `/` today.

Operator decision: **accept a temporary capability gap.** Between this Spec and Spec 4, `/` has no
way to delete a list. Lists are soft-deleted and recoverable, and no data is at risk.

**Both gaps are recorded in Open Questions / Risks below so close-out cannot lose them.**

### Drafting decision D — Four DevTasks, not three

`to-do-ui/DESIGN.md` suggests ~3. The chrome does not fit: the app shell plus the sidebar plus the
sync control plus the Lists page is 15 production files. Per the trilemma rule
(`docs/workflows/production-dev-workflow.md` → Design Doc Discipline), the DevTask count is a target
and splitting is preferred over bending the ≤10 limit or deferring tests. Split at the seams a
reviewer could reject independently: foundation, shell, sync control, Lists page.

---

## Token mapping — what the port actually changes

`tokens.css` is a **rename and rehome**, not a copy. The experiment's `--r-*` names are scoped to
`.reminders-experiment` (`src/experiment/apple-reminders-ux/tokens.css:6`); production uses the
semantic contract from `docs/DESIGN.md` → Two token tiers, at `:root`.

| Experiment            | Production         | Light     | Dark      |
| --------------------- | ------------------ | --------- | --------- |
| `--r-bg`              | `--bg-app`         | `#fff`    | `#000`    |
| `--r-bg-grouped`      | `--bg-grouped`     | `#f2f2f7` | `#1c1c1e` |
| `--r-bg-elevated`     | `--bg-elevated`    | `#fff`    | `#1c1c1e` |
| `--r-fill-pressed`    | `--bg-pressed`     | `#d1d1d6` | `#2c2c2e` |
| `--r-fill-selected`   | `--bg-selected`    | `#e5e5ea` | `#2c2c2e` |
| `--r-label`           | `--text-primary`   | `#000`    | `#fff`    |
| `--r-label-secondary` | `--text-secondary` | `#8e8e93` | `#98989f` |
| `--r-label-tertiary`  | `--text-tertiary`  | `#c7c7cc` | `#48484a` |
| `--r-on-tint`         | `--text-on-accent` | `#fff`    | `#fff`    |
| `--r-separator`       | `--separator`      | `#c6c6c8` | `#38383a` |
| `--r-tint`            | `--accent`         | `#007aff` | `#0a84ff` |
| `--r-warn`            | `--status-warn`    | `#fc0`    | `#ffd60a` |
| `--r-good`            | `--status-good`    | `#34c759` | `#30d158` |
| `--r-destructive`     | `--destructive`    | `#ff3b30` | `#ff453a` |
| `--r-icon-tile`       | `--icon-tile`      | `2.5rem`  | —         |
| `--r-icon-glyph`      | `--icon-glyph`     | `1.25rem` | —         |
| `--r-font`            | `--font-ui`        | unchanged | —         |
| `--r-radius`          | `--radius-control` | `10px`    | —         |
| `--r-gutter`          | `--gutter`         | `1rem`    | —         |
| `--r-row-min`         | `--row-min`        | `44px`    | —         |
| `--r-content-max`     | `--content-max`    | `680px`   | —         |

**Tokens the experiment never defined.** These are **not invented here** — `docs/DESIGN.md` → Color
(lines 155-212) and → Typography (lines 137-140) already specify the complete Plain palette, light and
dark. **Copy that block verbatim.** The tables in this section exist only to prove the ported values
and the canonical ones agree, which they do.

| Token              | Light                                            | Dark      | Note                                                                  |
| ------------------ | ------------------------------------------------ | --------- | --------------------------------------------------------------------- |
| `--accent-session` | `#d8410a`                                        | `#ff6a1f` | **Reserved.** Defined here, referenced by nothing until `psykl-loop`. |
| `--focus-ring`     | `#007aff`                                        | `#0a84ff` | Keyboard focus. Equals `--accent` in Plain; another theme may differ. |
| `--font-numeric`   | `ui-monospace, sfmono-regular, menlo, monospace` | same      | Counts and identifiers.                                               |
| `--radius-field`   | `6px`                                            | —         | The inline title-edit field (consumed by Spec 2).                     |

**Increased contrast override block** — copy verbatim from `docs/DESIGN.md` → Contrast — Standard and
Increased. Three tokens in light, one in dark. This Spec ships the palette; **Spec 5 ships the
control that selects it.**

---

## Implementation Components

### `components/web_client/`

- `src/styles/tokens.css` (new) — the full semantic contract at `:root`, plus the
  `prefers-color-scheme: dark` redefinitions, plus `:root[data-contrast='increased']`. Imported once
  from `src/main.tsx` so it applies to the whole document, not to a component subtree.
- `src/hooks/useDestination.ts` (new) — URL-backed destination, built on `usePathname` / `navigate`.
- `src/components/AppShell/` (new) — header, drawer, backdrop, layout, content header.
- `src/components/AppShell/Glyphs/` (new) — `DestinationGlyph`, `HeaderGlyph`, `ChevronGlyph`,
  `PlusGlyph`. Ported from `src/experiment/apple-reminders-ux/glyphs.tsx`. Nested under `AppShell/`
  because `AppShell` and its children are the only consumers in this Spec; **promote to
  `src/components/Glyphs/` when Spec 2's `TaskRow` becomes a second external consumer.**
- `src/components/AppShell/SidebarNav/` (new) — destinations, collapsible Lists section with Recently
  Deleted inside it. Ported from `src/experiment/apple-reminders-ux/SidebarNav/`.
- `src/components/SyncStatus/` (new) — the header sync control plus `useFailedSyncCount`. Ported from
  `src/experiment/apple-reminders-ux/SyncStatus/`. **Not** nested under `AppShell/`: Spec 5's Sync
  destination is a second consumer.
- `src/components/ListsPage/` (new) — create and re-order. Ported from
  `src/experiment/apple-reminders-ux/ListsView/`, minus the rename it never had.
- `src/App.tsx` — rewritten as the shell. `<h1>PSYKL</h1>`, the "M1 bootstrap shell" line, the three
  bordered buttons and every inline `style={{…}}` object go.
- `src/components/ListSwitcher/` — **deleted** in DevTask 4.

**Layout fixes earned in the prototype's review rounds — they must survive the port:**

- `display: flow-root` on the layout, to stop margin collapse.
- The drawer is `position: absolute`, **not** `fixed`.
- The header glyph sits at x=24 / cy=38 in both the open and closed states, so it does not shift.
- Tokens at `:root` only (see Global Constraints).

---

## Test Plan

### Static Analysis

No new tooling. `tokens.css` enters the Vite graph through `src/main.tsx`; confirm
`pnpm -r format:check` covers it (Prettier formats CSS by default and `.prettierignore` does not
exclude `src/styles/`).

### Unit tests

| File                                                                    | What it asserts                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/__tests__/tokens.unit.test.ts`                              | every `--token` in the sheet has its first definition inside the `:root {…}` block; the reduced-motion block defines none |
| `src/hooks/__tests__/useDestination.unit.test.ts`                       | each destination maps to its path and back; an unknown path falls back to the list destination                            |
| `src/components/AppShell/SidebarNav/__tests__/SidebarNav.unit.test.tsx` | destinations render; the Lists section collapses and expands; the active list is marked `aria-current="page"`             |
| `src/components/SyncStatus/__tests__/SyncStatus.unit.test.tsx`          | the control reflects clear / attention from queued and failed counts without a network call                               |
| `src/components/ListsPage/__tests__/ListsPage.unit.test.tsx`            | create commits on Return and cancels on Escape; move-up on the first row and move-down on the last are disabled           |

### Integration tests

None — `web_client` has no service-level concerns at this layer.

### Component tests (Storybook + play functions + MSW)

| File                                                         | What it asserts                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/AppShell/__tests__/AppShell.stories.tsx`     | drawer opens and closes; Escape closes it and returns focus to the trigger; the header glyph does not shift between states; renders at 390px and at 1024px; an `IncreasedContrast` story asserts the computed `--text-secondary` changes under `data-contrast="increased"` |
| `src/components/SyncStatus/__tests__/SyncStatus.stories.tsx` | clear and attention states render distinctly against MSW-stubbed counts                                                                                                                                                                                                    |
| `src/components/ListsPage/__tests__/ListsPage.stories.tsx`   | create → re-order against MSW handlers, with `resetStore()` in `beforeEach`                                                                                                                                                                                                |

### End-to-End tests

> **This table is the only record of which DevTask activates which test.** The test files carry no
> activation comments — per PR #99 review, comments in code describe current behaviour and never
> transient workflow items. An executor picking up a DevTask reads its activation set from here.

Written on the Spec branch ahead of DevTask 1 and titled as user stories. Collapsed to their titles,
these are the plain-language record of what the shell lets a user do.

**Activation set — every skipped test in the repository that belongs to this Spec.** Titles are exact;
match on the full string.

| File                               | Title                                                                               | Activated in              |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ------------------------- |
| `e2e/navigation.e2e.spec.ts`       | a user opens the navigation and sees every place they can go                        | DevTask 2                 |
| `e2e/navigation.e2e.spec.ts`       | a user folds their lists away to see the rest of the navigation                     | DevTask 2                 |
| `e2e/navigation.e2e.spec.ts`       | a user dismisses the navigation with the keyboard and lands back on their list      | DevTask 2                 |
| `e2e/lists.e2e.spec.ts`            | a user's existing tasks from before lists existed appear in the default list        | DevTask 2                 |
| `e2e/navigation.e2e.spec.ts`       | a user reaches Recently Deleted and Settings from the navigation                    | DevTask 3                 |
| `e2e/navigation.e2e.spec.ts`       | a user returns to their list with the browser back button                           | DevTask 3                 |
| `e2e/navigation.e2e.spec.ts`       | a user opens a destination directly from a pasted link                              | DevTask 3                 |
| `e2e/navigation.e2e.spec.ts`       | a user sees at a glance whether their changes have synced                           | DevTask 3                 |
| `e2e/recently_deleted.e2e.spec.ts` | a user sees how many days remain before a deleted task is purged, then restores it  | DevTask 3                 |
| `e2e/navigation.e2e.spec.ts`       | a user switches between their lists from the navigation                             | DevTask 4                 |
| `e2e/lists.e2e.spec.ts`            | a user creates a list and it appears in the navigation                              | DevTask 4                 |
| `e2e/lists.e2e.spec.ts`            | a user abandons a half-typed list name and no list is created                       | DevTask 4                 |
| `e2e/lists.e2e.spec.ts`            | a user re-orders their lists                                                        | DevTask 4                 |
| `e2e/lists.e2e.spec.ts`            | a user cannot move the first list any higher or the last list any lower             | DevTask 4                 |
| `e2e/lists.e2e.spec.ts`            | a user creates a task while a specific list is open and the task lands in that list | DevTask 4                 |
| `e2e/recently_deleted.e2e.spec.ts` | a user restores a deleted list and its tasks come back                              | **Spec 4**, not this Spec |

**Mechanics.** `navigation`, `lists` and `recently_deleted` each currently carry a `test.describe.skip`.

- **DevTask 2** drops the `describe.skip` on `navigation` and `lists`, and individually `test.skip`s
  every test in them not in its own activation set.
- **DevTask 3** drops the `describe.skip` on `recently_deleted` — leaving that file's second test
  individually skipped — and removes the DevTask 3 marks in `navigation`.
- **DevTask 4** removes the last marks in `navigation` and `lists`. No `.skip` of any kind remains in
  those two files.

The single row assigned to Spec 4 keeps its `test.skip` past this Spec's close-out — **the one test
this Spec knowingly leaves skipped** — because deleting a list has no home on `/` until the options
menu ships.

**Switching lists is a DevTask 4 story, not DevTask 2.** With only the bootstrap `Tasks` list there is
nothing to switch _to_; the story needs list creation, which lands with the Lists page.

**Existing E2E specs this Spec must update.** Audited against the chrome being replaced:

| File                                     | What breaks                                                                                                             | Rewritten                      | Activated in            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------- |
| `e2e/lists.e2e.spec.ts`                  | all three tests drive `Open list switcher`                                                                              | on the Spec branch, skipped    | DevTask 2 and DevTask 4 |
| `e2e/recently_deleted.e2e.spec.ts`       | `Recently Deleted` and `Close` buttons become a drawer destination and a back navigation                                | on the Spec branch, skipped    | DevTask 3 (see caveat)  |
| `e2e/task_list.e2e.spec.ts`              | one line — `getByRole('heading', { name: 'PSYKL' })` at `:22`; PSYKL becomes a header button                            | **left green, changed in DT2** | DevTask 2               |
| `e2e/offline_pressure.e2e.spec.ts`       | audited — drives `getByLabel('title')` (`TaskCreateForm`, Spec 3) and the banner (Spec 5). **Unaffected by this Spec.** | not touched                    | n/a                     |
| `e2e/task_list-offline-sync.e2e.spec.ts` | audited — drives task rows and the pending dot (Spec 2) via `helpers/multi-device`. **Unaffected by this Spec.**        | not touched                    | n/a                     |

**Why `task_list.e2e.spec.ts` is treated differently.** It is the only affected file where the change
is a single selector rather than a change in the user's journey. Rewriting it up front would skip five
currently-green tests covering task create, edit, complete and delete in order to review one line that
carries no UX decision. DevTask 2 changes that line in place.

**Caveat on `recently_deleted.e2e.spec.ts`.** Its second test — _a user restores a deleted list and its
tasks come back_ — drives the list options menu, which is Spec 4's work (drafting decision C). It stays
individually `test.skip`ped when DevTask 3 activates the rest of the file, and **`to-do-ui` Spec 4
un-skips it.** Carried in the activation table above; Spec 4's doc must pick it up, since nothing in
the code says so.

**Otherwise: a slice that leaves one red or skipped has not landed.** Every other row above is green by
the end of the DevTask named in it.

### TDD order during implementation

Per the operator's instruction of 2026-09-21, the E2E layer is written **first, on the Spec
integration branch**, ahead of any DevTask, so the expected end-state UX can be reviewed in the draft
PR before implementation starts. Specs that cannot pass yet land `test.skip` and are activated by the
DevTask that implements the behaviour.

0. **On the Spec branch:** write every new E2E spec and rewrite every affected existing one, skipping
   what is not yet implemented. Open the draft PR against `main`. **Operator reviews and approves the
   expected UX before DevTask 1 starts.**
1. Unit test for the token sheet → write `tokens.css` → green
2. Unit test for `useDestination` → implement → green
3. Unit tests for `SidebarNav` → implement → green
4. Storybook story for `AppShell` → implement header / drawer / layout → green → un-skip the DevTask 2
   E2E rows
5. Unit + story for `SyncStatus` → implement → green → un-skip the DevTask 3 E2E rows
6. Unit + story for `ListsPage` → implement → green → un-skip the DevTask 4 E2E rows
7. Delete `ListSwitcher/` and prove nothing imports it

---

## DevTasks

4 DevTasks (see Drafting decision D). Each branches off
`spec/to-do-ui-s1-shell-navigation-and-lists` and PRs into it. **No stacking** — each DevTask merges
into the Spec branch before the next starts, per the operator's instruction of 2026-09-21. DevTasks
are numbered globally across the initiative; `to-do-ui` starts at 1.

### DevTask 1: Land the production token sheet, glyph set, and URL-backed destinations

**Files:** 6 production
**Branch:** `feat/to-do-ui-s1-dt1-foundation`
**PR:** _filled once opened_

**Affected:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/__tests__/tokens.unit.test.ts`
- Create: `src/components/AppShell/Glyphs/Glyphs.tsx`
- Create: `src/components/AppShell/Glyphs/glyphs.css`
- Create: `src/components/AppShell/Glyphs/index.ts`
- Create: `src/hooks/useDestination.ts`
- Create: `src/hooks/__tests__/useDestination.unit.test.ts`
- Modify: `src/main.tsx` — add `import './styles/tokens.css';`

**Interfaces produced** (DevTasks 2-4 rely on these exact names):

```ts
// src/components/AppShell/Glyphs/index.ts
export type DestinationGlyphName = 'list' | 'lists' | 'recently-deleted' | 'settings' | 'sync';
export function DestinationGlyph(props: { name: DestinationGlyphName }): JSX.Element;
export function HeaderGlyph(props: { name: 'close' | 'menu' }): JSX.Element;
export function ChevronGlyph(): JSX.Element;
export function PlusGlyph(): JSX.Element;

// src/hooks/useDestination.ts
export type Destination = 'list' | 'lists' | 'recently-deleted' | 'settings' | 'sync';
export function useDestination(): { destination: Destination; goTo: (next: Destination) => void };
export function pathForDestination(destination: Destination): string;
export function destinationForPath(pathname: string): Destination;
```

**Steps:**

- [x] **Step 1: Write the failing token-sheet guard test.** Create
      `src/styles/__tests__/tokens.unit.test.ts`. It reads `src/styles/tokens.css` as text (via
      `readFileSync`) and asserts the rule that was earned in review round 1 — five tokens were silently
      orphaned inside `prefers-reduced-motion` and the 16px gutter, 44px row floor and 680px column were
      dead for a full round.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sheet = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');

/** The `:root { … }` block, excluding every nested media block. */
function rootBlock(css: string): string {
  const start = css.indexOf(':root {');
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}

describe('tokens.css', () => {
  it('defines every semantic token the contract requires', () => {
    // Given the semantic contract in docs/DESIGN.md → Two token tiers
    const required = [
      '--bg-app',
      '--bg-grouped',
      '--bg-elevated',
      '--bg-pressed',
      '--bg-selected',
      '--text-primary',
      '--text-secondary',
      '--text-tertiary',
      '--text-on-accent',
      '--separator',
      '--accent',
      '--accent-session',
      '--status-warn',
      '--status-good',
      '--destructive',
      '--focus-ring',
      '--font-ui',
      '--font-numeric',
      '--radius-control',
      '--radius-field',
      '--icon-tile',
      '--icon-glyph',
      '--gutter',
      '--row-min',
      '--content-max',
    ];

    // When / Then — each is defined in the bare :root block, not only in a media block
    const root = rootBlock(sheet);
    for (const token of required) {
      expect(root, `${token} must be defined at :root`).toContain(`${token}:`);
    }
  });

  it('defines no token inside the reduced-motion block', () => {
    // Given the reduced-motion block
    const start = sheet.indexOf('@media (prefers-reduced-motion: reduce)');
    const block = start === -1 ? '' : sheet.slice(start);

    // When / Then — it carries motion rules only
    expect(block).not.toMatch(/^\s*--[a-z-]+:/m);
  });

  it('raises exactly the four tokens Increased Contrast is allowed to touch', () => {
    // Given the Increased Contrast override blocks
    const overrides = sheet.match(/\[data-contrast='increased'\][^}]*}/g) ?? [];

    // Then only the three light tokens and the one dark token appear
    const touched = new Set(overrides.flatMap((block) => block.match(/--[a-z-]+(?=:)/g) ?? []));
    expect([...touched].sort()).toEqual(['--accent', '--text-secondary', '--text-tertiary']);
  });
});
```

- [x] **Step 2: Run it and watch it fail.** Run:
      `pnpm --filter @psykl/web-client test:unit tokens`
      Expected: FAIL — `ENOENT: no such file or directory … src/styles/tokens.css`.

- [x] **Step 3: Write `src/styles/tokens.css`.** Use the Token mapping table above for the ported
      values and the four added tokens. Structure, in this order: a bare `:root { … }` block carrying
      **every** token at its light value; then `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { … } }`
      redefining only the dark values; then `:root[data-theme='dark'] { … }` repeating them so an explicit
      choice wins in both directions; then the two `[data-contrast='increased']` blocks copied verbatim
      from `docs/DESIGN.md` → Contrast — Standard and Increased. Add
      `import './styles/tokens.css';` at the top of `src/main.tsx`.

- [x] **Step 4: Run the test and watch it pass.** Run:
      `pnpm --filter @psykl/web-client test:unit tokens`
      Expected: PASS, 3 tests.

- [x] **Step 5: Commit.**

```bash
git add components/web_client/src/styles components/web_client/src/main.tsx
git commit -m "feat: land the production token sheet with both contrast levels"
```

- [x] **Step 6: Write the failing `useDestination` test.** Create
      `src/hooks/__tests__/useDestination.unit.test.ts`.

```ts
import { describe, expect, it } from 'vitest';

import { destinationForPath, pathForDestination } from '../useDestination';

describe('useDestination', () => {
  it('maps every destination to its path and back', () => {
    // Given every destination the drawer offers
    const destinations = ['list', 'lists', 'recently-deleted', 'settings', 'sync'] as const;

    // When / Then — the mapping round-trips
    for (const destination of destinations) {
      expect(destinationForPath(pathForDestination(destination))).toBe(destination);
    }
  });

  it('falls back to the list for a path it does not know', () => {
    // Given a path no destination claims
    // When / Then
    expect(destinationForPath('/nonsense')).toBe('list');
  });

  it('puts the active list at the root path', () => {
    // When / Then — the list is the app's home, not a sub-path
    expect(pathForDestination('list')).toBe('/');
  });
});
```

- [x] **Step 7: Run it and watch it fail.** Run:
      `pnpm --filter @psykl/web-client test:unit useDestination`
      Expected: FAIL — cannot resolve `../useDestination`.

- [x] **Step 8: Implement `src/hooks/useDestination.ts`.**

```ts
import { navigate, usePathname } from './usePathname';

type Destination = 'list' | 'lists' | 'recently-deleted' | 'settings' | 'sync';

/** The active list is the app's home; every other destination is a sub-path, so
 * the browser back button and a pasted link both land somewhere real. The
 * prototype held this in component state — see the Spec's drafting decision A. */
const PATHS: Record<Destination, string> = {
  list: '/',
  lists: '/lists',
  'recently-deleted': '/recently-deleted',
  settings: '/settings',
  sync: '/sync',
};

function pathForDestination(destination: Destination): string {
  return PATHS[destination];
}

function destinationForPath(pathname: string): Destination {
  const match = (Object.keys(PATHS) as Destination[]).find(
    (destination) => destination !== 'list' && PATHS[destination] === pathname,
  );
  return match ?? 'list';
}

function useDestination(): { destination: Destination; goTo: (next: Destination) => void } {
  const pathname = usePathname();
  return {
    destination: destinationForPath(pathname),
    goTo: (next) => navigate(pathForDestination(next)),
  };
}

export { type Destination, destinationForPath, pathForDestination, useDestination };
```

- [x] **Step 9: Run the test and watch it pass.** Run:
      `pnpm --filter @psykl/web-client test:unit useDestination`
      Expected: PASS, 3 tests.

- [x] **Step 10: Port the glyph set.** Create `src/components/AppShell/Glyphs/Glyphs.tsx`,
      `glyphs.css` and `index.ts` from `src/experiment/apple-reminders-ux/glyphs.tsx` and the
      `.reminders-glyph` rules in `src/experiment/apple-reminders-ux/tokens.css:37-72`. Rename the class
      prefix to `psykl-glyph`, and swap `--r-tint` → `--accent`, `--r-on-tint` → `--text-on-accent`,
      `--r-label-secondary` → `--text-secondary`, `--r-icon-tile` → `--icon-tile`, `--r-icon-glyph` →
      `--icon-glyph`. Keep the utility-destination rule: Recently Deleted and Settings take
      `--text-secondary` as their tile fill so the lists read as the primary destinations.

- [x] **Step 11: Verify static analysis.** Run:
      `pnpm --filter @psykl/web-client lint && pnpm --filter @psykl/web-client typecheck && pnpm --filter @psykl/web-client format:check`
      Expected: all three pass.

- [x] **Step 12: Commit.**

```bash
git add components/web_client/src/hooks components/web_client/src/components/AppShell
git commit -m "feat: add URL-backed destinations and the production glyph set"
```

---

### DevTask 2: Ship the app shell — header, drawer, and sidebar navigation

**Files:** 7 production
**Branch:** `feat/to-do-ui-s1-dt2-app-shell`
**PR:** _filled once opened_

**Interfaces consumed:** `DestinationGlyph`, `HeaderGlyph`, `ChevronGlyph` and `useDestination` from
DevTask 1.

**Affected:**

- Create: `src/components/AppShell/AppShell.tsx`, `app-shell.css`, `index.ts`
- Create: `src/components/AppShell/SidebarNav/SidebarNav.tsx`, `sidebar-nav.css`, `index.ts`
- Create: `src/components/AppShell/SidebarNav/__tests__/SidebarNav.unit.test.tsx`
- Create: `src/components/AppShell/__tests__/AppShell.stories.tsx`
- Modify: `src/App.tsx`
- Modify: `e2e/navigation.e2e.spec.ts`, `e2e/lists.e2e.spec.ts`, `e2e/task_list.e2e.spec.ts` — un-skip
  the rows this DevTask activates

**Interfaces produced:**

```tsx
// src/components/AppShell/index.ts
export function AppShell(props: {
  children: React.ReactNode; // the destination's content
  headerAction?: React.ReactNode; // the trailing header control, or nothing
  title: string;
}): JSX.Element;
```

**Steps:**

- [ ] **Step 1: Write the failing `SidebarNav` unit test.** Create
      `src/components/AppShell/SidebarNav/__tests__/SidebarNav.unit.test.tsx`. Arrange / Act / Assert per
      the UI convention.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SidebarNav } from '../SidebarNav';

const lists = [
  { id: 'list-1', title: 'Tasks' },
  { id: 'list-2', title: 'Groceries' },
];

describe('SidebarNav', () => {
  it('offers every destination', () => {
    // Arrange
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={vi.fn()}
        onSelectDestination={vi.fn()}
        onSelectList={vi.fn()}
      />,
    );

    // Assert
    for (const name of ['Lists', 'Sync', 'Recently Deleted', 'Settings']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('marks the open list as the current page', () => {
    // Arrange
    render(
      <SidebarNav
        activeListId="list-2"
        destination="list"
        lists={lists}
        onClose={vi.fn()}
        onSelectDestination={vi.fn()}
        onSelectList={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Groceries' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Tasks' })).not.toHaveAttribute('aria-current');
  });

  it('collapses and expands the Lists section', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={vi.fn()}
        onSelectDestination={vi.fn()}
        onSelectList={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Collapse Lists' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Groceries' })).not.toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Expand Lists' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and watch it fail.** Run:
      `pnpm --filter @psykl/web-client test:unit SidebarNav`
      Expected: FAIL — cannot resolve `../SidebarNav`.

- [ ] **Step 3: Port `SidebarNav`.** Create the three files from
      `src/experiment/apple-reminders-ux/SidebarNav/`. Rename the class prefix
      `reminders-sidebar-nav` → `psykl-sidebar-nav`, swap the `--r-*` variables per the Token mapping
      table, and import the glyphs from `../Glyphs` rather than `../glyphs`. Keep the structure exactly:
      Lists is a destination in its own right, its chevron unfolds the list names beneath it, and
      Recently Deleted sits inside the Lists section.

- [ ] **Step 4: Run the test and watch it pass.** Run:
      `pnpm --filter @psykl/web-client test:unit SidebarNav`
      Expected: PASS, 3 tests.

- [ ] **Step 5: Commit.**

```bash
git add components/web_client/src/components/AppShell/SidebarNav
git commit -m "feat: add the navigation sidebar with collapsible lists"
```

- [ ] **Step 6: Write the failing `AppShell` story.** Create
      `src/components/AppShell/__tests__/AppShell.stories.tsx` with four stories, each carrying a play
      function. `Closed` asserts the drawer is not exposed and the trigger reads `Open PSYKL navigation`.
      `Opened` clicks the trigger, asserts the nav is exposed, presses `Escape`, and asserts focus returns
      to the trigger. `HeaderGlyphDoesNotShift` records
      `trigger.getBoundingClientRect()` closed, opens the drawer, and asserts the close button's rect
      matches on both axes — this is the x=24 / cy=38 fix from review. `IncreasedContrast` renders inside
      a decorator that sets `document.documentElement.dataset.contrast = 'increased'` and asserts
      `getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()` is
      `#6d6d72`, then clears the attribute in a cleanup. Set
      `parameters: { viewport: { defaultViewport: 'mobile2' } }` on the phone stories and a 1024px
      viewport on a `Desktop` story asserting the content column is at most 680px wide. **No IndexedDB
      writes — MSW handlers only, `resetStore()` in `beforeEach`.**

- [ ] **Step 7: Run it and watch it fail.** Run:
      `pnpm --filter @psykl/web-client test:component:stories`
      Expected: FAIL — cannot resolve `../AppShell`.

- [ ] **Step 8: Port the shell.** Create `AppShell.tsx`, `app-shell.css` and `index.ts` from
      `src/experiment/apple-reminders-ux/AppleRemindersUxExperiment.tsx:95-135` and the
      `.reminders-experiment__*` rules in `apple-reminders-ux.css`. `AppShell` owns the header button, the
      `aside` drawer, the dismiss backdrop, the Escape handler, focus restoration to the trigger, the
      content header (`<h2>{title}</h2>` plus `headerAction`), and the content slot. It renders
      `SidebarNav`, driving it from `useDestination`, `useLists` and `useActiveListId`. It does **not**
      know which destination's content it wraps — that is `App.tsx`'s job. Carry the earned fixes:
      `display: flow-root` on the layout, the drawer `position: absolute` not `fixed`, and the header
      glyph at x=24 / cy=38 in both states.

- [ ] **Step 9: Rewrite `src/App.tsx`.** Delete `<h1>PSYKL</h1>`, the "M1 bootstrap shell" line, the
      three bordered buttons, and every inline `style={{…}}` object. `App` reads `useDestination` and
      renders `AppShell` around the destination's content: the existing `TaskCreateForm` + `TaskList` for
      `list`, the existing `RecentlyDeleted` for `recently-deleted`, the existing `Settings` for
      `settings`. `lists` and `sync` render nothing yet — DevTask 4 and Spec 5 fill them. Keep
      `ListSwitcher` mounted and reachable until DevTask 4 deletes it, so list rename and delete do not
      disappear a DevTask earlier than planned. Keep `OutOfSyncBanner`, `Toast` and `VersionFooter`
      untouched — Spec 5 retires the first two.

- [ ] **Step 10: Run the stories and watch them pass.** Run:
      `pnpm --filter @psykl/web-client test:component:stories`
      Expected: PASS.

- [ ] **Step 11: Un-skip and green the E2E rows this DevTask activates.** Remove `.skip` from
      `e2e/navigation.e2e.spec.ts` → "a user opens the navigation and switches between lists", and from
      the two retargeted `e2e/lists.e2e.spec.ts` tests that only needed new navigation selectors. Update
      `e2e/task_list.e2e.spec.ts:22` from `getByRole('heading', { name: 'PSYKL' })` to
      `getByRole('button', { name: 'Open PSYKL navigation' })`. Run:
      `pnpm test:e2e -- navigation lists task_list`
      Expected: PASS, with only the rows marked DevTask 3 / DevTask 4 still skipped.

- [ ] **Step 12: Commit.**

```bash
git add components/web_client/src/components/AppShell components/web_client/src/App.tsx e2e
git commit -m "feat: replace the bootstrap shell with the header, drawer, and navigation"
```

---

### DevTask 3: Ship the header sync control and the remaining destinations

**Files:** 5 production
**Branch:** `feat/to-do-ui-s1-dt3-sync-control`
**PR:** _filled once opened_

**Interfaces consumed:** `AppShell` (the `headerAction` prop) from DevTask 2; `DestinationGlyph` from
DevTask 1.

**Affected:**

- Create: `src/components/SyncStatus/SyncStatus.tsx`, `sync-status.css`, `useFailedSyncCount.ts`, `index.ts`
- Create: `src/components/SyncStatus/__tests__/SyncStatus.unit.test.tsx`
- Create: `src/components/SyncStatus/__tests__/SyncStatus.stories.tsx`
- Modify: `src/App.tsx`
- Modify: `e2e/navigation.e2e.spec.ts`, `e2e/recently_deleted.e2e.spec.ts`

**Interfaces produced:**

```tsx
// src/components/SyncStatus/index.ts
export function SyncStatus(props: {
  active: boolean;
  failedCount: number;
  onOpen: () => void;
  queuedCount: number;
}): JSX.Element;
export function useFailedSyncCount(): number;
```

**Steps:**

- [ ] **Step 1: Write the failing `SyncStatus` unit test.** Create
      `src/components/SyncStatus/__tests__/SyncStatus.unit.test.tsx`.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SyncStatus } from '../SyncStatus';

describe('SyncStatus', () => {
  it('reads as clear when nothing is queued or failed', () => {
    // Arrange
    render(<SyncStatus active={false} failedCount={0} onOpen={vi.fn()} queuedCount={0} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync clear' })).toHaveAttribute('data-status', 'clear');
  });

  it('asks for attention when a change is queued', () => {
    // Arrange
    render(<SyncStatus active={false} failedCount={0} onOpen={vi.fn()} queuedCount={1} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync needs attention' })).toHaveAttribute('data-status', 'attention');
  });

  it('asks for attention when a change failed permanently', () => {
    // Arrange
    render(<SyncStatus active={false} failedCount={2} onOpen={vi.fn()} queuedCount={0} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync needs attention' })).toBeInTheDocument();
  });

  it('opens the Sync destination when pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SyncStatus active={false} failedCount={0} onOpen={onOpen} queuedCount={0} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Sync clear' }));

    // Assert
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.** Run:
      `pnpm --filter @psykl/web-client test:unit SyncStatus`
      Expected: FAIL — cannot resolve `../SyncStatus`.

- [ ] **Step 3: Port `SyncStatus`.** Create the four files from
      `src/experiment/apple-reminders-ux/SyncStatus/`. Rename the class prefix
      `reminders-sync-status` → `psykl-sync-status` and swap the `--r-*` variables per the Token mapping
      table. **Port the control only, not the `details` panel** — the prototype's inline
      `<section className="reminders-sync-status__details">` is the Sync _destination_, which is Spec 5's
      work. Keep the `active` prop; it marks the control `aria-current="page"` while the Sync destination
      is open.

- [ ] **Step 4: Run the test and watch it pass.** Run:
      `pnpm --filter @psykl/web-client test:unit SyncStatus`
      Expected: PASS, 4 tests.

- [ ] **Step 5: Wire the control and the remaining destinations into `App.tsx`.** Pass `SyncStatus` as
      `AppShell`'s `headerAction` on the `list` and `sync` destinations, reading `useSyncDiscrepancy()`
      for the queued count and `useFailedSyncCount()` for the failed count. Render `RecentlyDeleted` and
      `Settings` as destination content rather than modals — pass `open` permanently true and
      `onClose={() => goTo('list')}` so their existing close affordance returns to the list.

- [ ] **Step 6: Write the `SyncStatus` story.** Create
      `src/components/SyncStatus/__tests__/SyncStatus.stories.tsx` with `Clear` and `NeedsAttention`
      stories, each asserting the rendered `data-status` in a play function. MSW handlers only; no
      IndexedDB writes.

- [ ] **Step 7: Run the stories.** Run:
      `pnpm --filter @psykl/web-client test:component:stories`
      Expected: PASS.

- [ ] **Step 8: Un-skip and green the E2E rows this DevTask activates.** Remove `.skip` from
      `e2e/navigation.e2e.spec.ts` → "a user reaches Recently Deleted and Settings from the navigation"
      and "a user returns to their list with the browser back button". Rewrite
      `e2e/recently_deleted.e2e.spec.ts:14` to open the drawer and choose the Recently Deleted
      destination, and `:21` to navigate back rather than press `Close`. Run:
      `pnpm test:e2e -- navigation recently_deleted`
      Expected: PASS.

- [ ] **Step 9: Verify static analysis.** Run:
      `pnpm --filter @psykl/web-client lint && pnpm --filter @psykl/web-client typecheck && pnpm --filter @psykl/web-client format:check`
      Expected: all three pass.

- [ ] **Step 10: Commit.**

```bash
git add components/web_client/src/components/SyncStatus components/web_client/src/App.tsx e2e
git commit -m "feat: put the sync control in the header and the utility destinations in the shell"
```

---

### DevTask 4: Ship the Lists page and delete `ListSwitcher`

**Files:** 3 production created + 1 modified; `ListSwitcher/` deleted
**Branch:** `feat/to-do-ui-s1-dt4-lists-page`
**PR:** _filled once opened_

**Interfaces consumed:** `AppShell` (`headerAction`) from DevTask 2, `PlusGlyph` and
`DestinationGlyph` from DevTask 1.

**Interfaces produced:**

```tsx
// src/components/ListsPage/index.ts
export function ListsPage(props: {
  creating?: boolean; // the header's New List button has been pressed
  onCreated?: () => void; // the new-list row committed or cancelled
  onSelectList?: (listId: string) => void;
}): JSX.Element;
```

**Affected:**

- Create: `src/components/ListsPage/ListsPage.tsx`, `lists-page.css`, `index.ts`
- Create: `src/components/ListsPage/__tests__/ListsPage.unit.test.tsx`
- Create: `src/components/ListsPage/__tests__/ListsPage.stories.tsx`
- Modify: `src/App.tsx`
- Delete: `src/components/ListSwitcher/` (`ListSwitcher.tsx`, `index.ts`, `ListRow/ListRow.tsx`,
  `ListRow/index.ts`, and their `__tests__/`)
- Modify: `e2e/lists.e2e.spec.ts`
- Create: `docs/features/[20260921]P1_to-do-ui-shell-navigation-and-lists.md` (final DevTask of the
  Spec — see Spec close-out below)

**Scope reminder:** create, re-order and select only. **Rename and delete-list are deliberately absent**
— see Drafting decisions B and C.

**Steps:**

- [ ] **Step 1: Write the failing `ListsPage` unit test.** Create
      `src/components/ListsPage/__tests__/ListsPage.unit.test.tsx`, mocking `useLists` so no IndexedDB is
      touched.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListsPage } from '../ListsPage';

const createList = vi.fn();
const moveList = vi.fn();
const lists = [
  { id: 'list-1', position: 'a0', title: 'Tasks' },
  { id: 'list-2', position: 'a1', title: 'Groceries' },
  { id: 'list-3', position: 'a2', title: 'Reading' },
];

vi.mock('../../../hooks/useLists', () => ({
  useLists: () => ({ createList, lists, moveList }),
}));

describe('ListsPage', () => {
  beforeEach(() => {
    createList.mockClear();
    moveList.mockClear();
  });

  it('creates a list when the name is committed with Return', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<ListsPage creating onCreated={onCreated} />);

    // Act
    await user.type(screen.getByLabelText('New list name'), 'Errands{Enter}');

    // Assert
    expect(createList).toHaveBeenCalledWith('Errands');
  });

  it('abandons the new list when the name is cancelled with Escape', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListsPage creating onCreated={vi.fn()} />);

    // Act
    await user.type(screen.getByLabelText('New list name'), 'Errands{Escape}');

    // Assert
    expect(createList).not.toHaveBeenCalled();
  });

  it('moves a list between the two neighbours it lands among', async () => {
    // Arrange — 'Reading' is last; moving it up puts it between 'Tasks' and 'Groceries'
    const user = userEvent.setup();
    render(<ListsPage />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Move Reading up' }));

    // Assert
    expect(moveList).toHaveBeenCalledWith('list-3', lists[0], lists[1]);
  });

  it('cannot move the first list up or the last list down', () => {
    // Arrange
    render(<ListsPage />);

    // Assert
    expect(screen.getByRole('button', { name: 'Move Tasks up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Reading down' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run it and watch it fail.** Run:
      `pnpm --filter @psykl/web-client test:unit ListsPage`
      Expected: FAIL — cannot resolve `../ListsPage`.

- [ ] **Step 3: Port the Lists page.** Create `ListsPage.tsx`, `lists-page.css` and `index.ts` from
      `src/experiment/apple-reminders-ux/ListsView/`. Rename the class prefix
      `reminders-lists` → `psykl-lists` and swap the `--r-*` variables per the Token mapping table. Keep
      the `move(index, direction)` neighbour arithmetic exactly as the prototype computes it
      (`ListsView.tsx:19-27`) — it is what makes `moveList` land a fractional position between the right
      pair. **Replace the `autoFocus` on the new-list input with a `useLayoutEffect` focus call**: this is
      the fix earned in the prototype's review, where `autoFocus` landed after paint and silently dropped
      the first characters typed, so `Book dentist` arrived as `k dentist`. Keep Escape-cancels via the
      `cancelledRef` pattern.

- [ ] **Step 4: Run the test and watch it pass.** Run:
      `pnpm --filter @psykl/web-client test:unit ListsPage`
      Expected: PASS, 4 tests.

- [ ] **Step 5: Commit.**

```bash
git add components/web_client/src/components/ListsPage
git commit -m "feat: add the Lists page with create and re-order"
```

- [ ] **Step 6: Wire the Lists destination and retire `ListSwitcher`.** In `src/App.tsx`, render
      `ListsPage` for the `lists` destination and pass a `PlusGlyph` "New List" button as `AppShell`'s
      `headerAction` there. Delete `src/components/ListSwitcher/` entirely, along with its
      `__tests__/`, and remove its import from `App.tsx`.

- [ ] **Step 7: Prove nothing imports the deleted component.** Run:
      `grep -rn "ListSwitcher" components/web_client/src e2e docs/specs/to-do-ui || echo "no references"`
      Expected: `no references`. Then run:
      `pnpm --filter @psykl/web-client typecheck`
      Expected: PASS.

- [ ] **Step 8: Write the `ListsPage` story.** Create
      `src/components/ListsPage/__tests__/ListsPage.stories.tsx` with one `CreateThenReorder` play
      function driving create → re-order against MSW handlers, with `resetStore()` in `beforeEach`. No
      IndexedDB writes.

- [ ] **Step 9: Run the stories.** Run:
      `pnpm --filter @psykl/web-client test:component:stories`
      Expected: PASS.

- [ ] **Step 10: Un-skip and green the last E2E rows.** Remove `.skip` from
      `e2e/lists.e2e.spec.ts` → "a user creates a list and it appears in the navigation" and "a user
      re-orders their lists". Run the whole suite:
      `pnpm test:e2e`
      Expected: PASS with **zero** skipped tests attributable to this Spec.

- [ ] **Step 11: Commit.**

```bash
git add components/web_client/src e2e
git commit -m "feat: put list management on the Lists page and retire the list switcher"
```

- [ ] **Step 12: Spec close-out (FINAL DevTask of this Spec only).** Write
      `docs/features/[20260921]P1_to-do-ui-shell-navigation-and-lists.md` from
      `docs/templates/FEATURE.md`, consolidating this Spec's outcome and its four drafting decisions.
      Refresh `CHANGELOG.md` (one entry for the Spec) and `docs/PROJECT_STATUS.md` (last completed Spec
      points at the feature doc; next executable Spec is `to-do-ui` Spec 2). Delete this spec doc per the
      Spec close-out checklist. Then walk that checklist in
      `docs/workflows/production-dev-workflow.md` → File & Status Discipline in full.

```bash
git add docs CHANGELOG.md
git commit -m "docs: record the shell, navigation, and lists feature

- add the Spec 1 feature doc consolidating four drafting decisions
- refresh CHANGELOG.md and PROJECT_STATUS.md for Spec close-out
- delete the Spec 1 execution plan per the close-out checklist"
```

---

## Verification (manual)

1. `pnpm install && pnpm dev`
2. At **390px**: the drawer opens over the list; every destination in it reaches its surface; the
   header glyph does not move between the open and closed states; Escape closes the drawer and focus
   returns to the trigger.
3. At **1024px**: the sidebar is persistent and the content column is at most 680px.
4. Paste `http://localhost:5173/lists` into a fresh tab — the Lists page loads directly. Press the
   browser back button from Settings — the active list returns.
5. Toggle the OS between light and dark; compare against `screenshots/390-sidebar.png` and
   `1024-loaded-light.png`.
6. In devtools, set `data-contrast="increased"` on `<html>` — secondary text and the tint darken; no
   hue changes.
7. Confirm list **rename** and **delete** are gone from `/`. This is expected — see Open Questions.

---

## Open Questions / Risks

- **Resolved 2026-09-21 — contrast ships as a user choice.** This Spec's token sheet carries **both**
  levels: Standard as the default, plus `:root[data-contrast='increased']` overriding three tokens in
  light and one in dark. Values in [`docs/DESIGN.md`](../../DESIGN.md) → Contrast — Standard and
  Increased. The Settings control that selects between them lands in Spec 5.
- **TRACKED REGRESSION — list rename is unavailable on `/` from this Spec onward.** The accepted
  prototype never designed it and `ListSwitcher` is deleted here. The operator has accepted this as a
  known prototype-vs-production gap to be addressed **after `to-do-ui` Spec 6**, with the other gaps.
  Spec 6's close-out must carry this forward; it is not a defect to be filed against this Spec.
- **TRACKED REGRESSION — list delete is unavailable on `/` between this Spec and Spec 4.** The
  prototype puts it in `ListMenu`, which `to-do-ui/DESIGN.md` assigns to Spec 4. Accepted by the
  operator as a temporary gap; lists are soft-deleted and no data is at risk.
- **Storybook component tests cannot be written ahead of their components** — a `*.stories.tsx`
  imports the component it renders, so it will not typecheck before that component exists. The
  expected assertions are enumerated in the Test Plan above for review in the Spec's draft PR; the
  stories themselves land in their DevTask. E2E specs have no such constraint and land up front.
- Back-button navigation between destinations is behaviour the prototype did not have (Drafting
  decision A). It is chrome rather than a product capability, but it is worth noting against the
  initiative's "no new user-facing capability" rule.
- The largest selector churn in the initiative lands here; budget for E2E rework, not just new tests.
- Mixed styling on `/` is at its most visible after this Spec — new chrome, old list rows, old capture
  form. Accepted in Decision 1; Spec 2 and Spec 3 close it.
- `Glyphs/` is nested under `AppShell/` because `AppShell` is its only consumer today. Spec 2's
  `TaskRow` is the expected second consumer; **that Spec promotes it to `src/components/Glyphs/`**
  rather than importing across a parent boundary.

## Affected by / Depends on

Nothing. This Spec is the foundation the other five build on.
