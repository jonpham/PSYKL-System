# Design: `to-do-ui` — migrate the `apple-reminders-ux` prototype into production

Drafted 2026-09-21 from the accepted `apple-reminders-ux` experiment.
Repo: [jonpham/PSYKL-System](https://github.com/jonpham/PSYKL-System)
Status: APPROVED
Milestone tag: `to-do-ui`

> **Glossary** (each doc carries its own, per [`AGENTS.md`](../../../AGENTS.md)):
>
> - PWA = Progressive Web App.
> - UI / UX = User Interface / User Experience.
> - LWW = Last-Write-Wins — the conflict-resolution rule inherited from M2.
> - IndexedDB = the browser's local database; the PWA treats it as the source of truth.
> - E2E = End-to-End (Playwright, full stack).
> - MSW = Mock Service Worker, used to stub back-ends in Storybook component tests.
> - TDD = Test-Driven Development.

---

## Problem Statement

The `apple-reminders-ux` experiment is accepted. Its third iteration (`apple-reminders-ui`,
[issue #86](https://github.com/jonpham/PSYKL-System/issues/86)) went through four operator review
rounds and shipped in `v0.4.1`, live on the `robin` homelab cluster.

That experience exists **only** at `/exp/apple-reminders-ux`. Production at `/` is still the M1
bootstrap shell — `<h1>PSYKL</h1>`, the words "M1 bootstrap shell", three bordered buttons, inline
`style={{…}}` objects, a top-anchored `Create` form, and no checkbox. Every user of the deployed app
sees the bootstrap shell; the accepted design is reachable only by typing an `/exp` URL.

This initiative closes that gap and nothing else. It migrates the prototype into production as small
vertical slices, meeting the production quality bar the experimental lane was allowed to skip.

## Why a separate initiative rather than an amendment to `todo-experience`

Three reasons:

1. **`todo-experience/DESIGN.md` is APPROVED and its Decisions appendix is normative.** Nothing in
   this migration contradicts it — its data-model decisions all still hold — so re-opening it would
   be ceremony without a decision to make.
2. **The unit of work is different.** `todo-experience` Specs are feature slices (Sections, ordering,
   due dates, tags). This is a chrome-and-surface replacement that adds no user-facing capability
   beyond what already exists; mixing it into that initiative's numbering would misrepresent both.
3. **Sequencing.** `todo-experience` Specs 3-7 are written against the _current_ UI. They are paused,
   not cancelled, and get rebased onto the new surface after this initiative lands. Keeping the two
   initiatives separate makes that pause legible in `PROJECT_STATUS.md`.

## What supersedes what

| Document                                                                                     | Status       | Effect of this initiative                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/experiments/apple-reminders-ux/apple-reminders-ui/visual-artifact.md` + `screenshots/` | accepted     | **Becomes the UI reference.** Specs cite it for layout, metrics, and motion.                                                                                                                 |
| [`docs/DESIGN.md`](../../DESIGN.md)                                                          | **APPROVED** | **Rewritten 2026-09-21, before implementation**, to the prototype's built values. It is now the visual baseline every Spec implements against — not a document to be corrected at close-out. |
| [`docs/STYLE.md`](../../STYLE.md)                                                            | current      | **Gained a Styling section** 2026-09-21: no inline styles, no raw literals, every token at the theme root.                                                                                   |
| [`docs/initiatives/todo-experience/UX.md`](../todo-experience/UX.md)                         | Proposed     | **Reconciled in place 2026-09-21**, section by section, with each correction flagged `↺`. Its feature-level UX for Sections/ordering/tags survives and is rebased later.                     |
| [`docs/initiatives/todo-experience/DESIGN.md`](../todo-experience/DESIGN.md)                 | APPROVED     | **Not edited.** Its data-model decisions are inputs to this work, not subjects of it.                                                                                                        |
| `docs/specs/todo-experience/` Specs 3-7                                                      | TODO         | **Paused, untouched.** Out of scope — see below.                                                                                                                                             |

## Carried-forward constraints

- **`--accent-session` stays reserved for a live PSYKL session** and nothing else — never a link,
  button, selection, or focus ring. This is the one rule that survived the retired Ledger identity,
  and it is why the differentiator will read as significant when `psykl-loop` lands.
- **Device-local preferences live in the `sync_meta` IndexedDB store**, which is never enqueued and
  therefore never syncs (`todo-experience/DESIGN.md` → Data-model decisions locked here). The
  prototype's `localStorage` stores were an experiment-lane shortcut and are rewritten, not ported.
- **Offline posture is unchanged**: nag at 25 unsynced changes, hard ceiling at 100, deletes move to
  Recently Deleted, the server purges after 30 days.
- **LWW, no foreign keys, client-minted `uuidv7` IDs, `fractional-indexing` for order** — all
  inherited untouched.

## On schema and API surface

**None is anticipated — but no spec asserts that as a foregone conclusion.** Where a slice's
behaviour implies a change to an underlying service object (persistence shape, endpoint, or
contract), the spec must **consider it openly, stop, and bring the operator a proposal before any
implementation**. Each spec's Data Model and API sections either state "none required, because …"
with the reasoning, or carry the proposal and a `BLOCKED` marker pending the operator's answer.
Silently assuming "UI-only" is the failure mode to avoid.

Why nothing is anticipated on today's reading:

- Device-local preferences use the existing `sync_meta` store — `putMeta` / `getMeta` / `deleteMeta`
  already exist in `src/db/idb.ts` and the store is in schema v2, so **no IndexedDB version bump**.
- Stale-write records can live in `sync_meta` too, fed by the existing `sync:stale-write` event that
  `src/sync/replay.ts` already emits. No new store.
- List create / rename / reorder / delete already exist end-to-end in `components/service-task` and
  are already exposed by `useLists`.
- Recently Deleted, restore, and server purge all shipped in `todo-experience` Spec 2.

Spec 5's stale-write record is the most likely place a `service-task` or schema change surfaces: if
`sync_meta` cannot carry what the Sync view needs to show, that is a proposal for the operator, not a
judgement call for the agent.

## Migration shape

**In-place, slice by slice** (Decision 1). Each spec replaces real production components; `/` stays
coherent and shippable at every merge. There is no parallel `/v2` route and no feature flag.

The consequence, stated plainly so no spec can be surprised by it: **between slices, `/` carries
mixed styling.** Chrome goes first precisely so that the mixed states are structural and brief — an
unstyled list inside the final container — rather than cosmetic drift across the whole page.

## Code boundaries and quality bar

- **UI Component folder layout** per `AGENTS.md`: every component gets its own directory with
  `<Name>.tsx`, a child `__tests__/`, and an `index.ts` re-export. Single-consumer components nest
  under their parent (as `TaskRow/` nests under `TaskList/`).
- **Layering holds:** no UI component or hook calls the sync layer directly. Mutations go through the
  existing `Service Client` → `Sync Client` → `API Client` path. Reuse `useTasks`, `useLists`,
  `useRecentlyDeleted`, `useSyncDiscrepancy`, `useActiveList` rather than reaching past them.
- **Tokens replace inline styles.** Production components currently carry inline `style={{…}}`
  objects; the migration moves them to the token sheet. No component keeps a hardcoded hex.
- **No milestone tokens** in filenames or identifiers.
- **≤10 production behaviour source files per DevTask PR**; tests, config and docs are exempt from the
  count but never from the PR.
- Each DevTask branches off the spec integration branch `spec/to-do-ui-s{N}-{slug}` and PRs into it;
  the spec branch is the long-lived PR into `main`.

## Reference implementations to port

All under `components/web_client/src/experiment/apple-reminders-ux/`: `tokens.css`, `glyphs.tsx`,
`SidebarNav/`, `SyncStatus/`, `ListsView/`, `ListMenu/`, `TaskListView/` (with `sortTasks.ts`,
`TaskRow/`, `CaptureRow/`), `RecentlyDeletedView/`, `SettingsView/`, `showCompletedStore.ts`,
`themeStore.ts` (the last two get rewritten onto `sync_meta`).

## Fixes that must survive the port — they were earned in review

| Fix                                                                                           | Why it exists                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Capture takes focus in `useLayoutEffect`, **not** `autoFocus`                                 | `autoFocus` lands after paint and silently drops the first characters typed — `Book dentist` arrived as `k dentist`.                                                                                         |
| Wrapped titles align the checkbox and pending dot to the **first line**, not the block centre | A two-line title otherwise floats its checkbox to the middle of the row.                                                                                                                                     |
| Pending dots sit in a column mirroring the header's trailing columns                          | Each dot hangs directly under the sync control, so the relationship reads without a legend.                                                                                                                  |
| A failed task load stays **silent** while the device has tasks to show                        | Offline-first: the local list is the truth and the sync control already carries the signal.                                                                                                                  |
| Tokens must live at `:root`, never inside a `@media` block                                    | Five tokens were silently orphaned inside `prefers-reduced-motion` during review round 1 — the 16px gutter, 44px row floor and 680px desktop column were dead for a full round before measurement caught it. |

## Spec / DevTask Breakdown

Chrome first, so everything after it renders inside its final container.

| Spec | Slice                                                                                                                                                                                                                                            | Retires                                            | ~DevTasks | Risk it carries                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| 1    | **Shell, navigation, list management** — tokens, glyph set, header, drawer, destinations, header sync control, Lists page (create / rename / reorder / delete)                                                                                   | `components/ListSwitcher/`                         | 3         | Largest slice; touches every existing E2E spec's selectors       |
| 2    | **Task list and row** — circle checkbox with fill animation, 17px wrapping title, inset separators, inline edit, completed sunk below open, first-line alignment, pending-dot column                                                             | rewrites `components/TaskList/`                    | 2         | Row craft is where "Reminders-grade" is won or lost              |
| 3    | **Capture** — trailing `+` opening an inline row after the last open task; Return saves and reopens                                                                                                                                              | `components/TaskCreateForm/`                       | 1-2       | Focus timing; the already-flaky `IntegratedWithCreateForm` story |
| 4    | **List options and completed visibility** — overflow menu, delete list, show/hide completed persisted to `sync_meta`                                                                                                                             | —                                                  | 1-2       | First `sync_meta` preference; sets the pattern Spec 5 reuses     |
| 5    | **Sync, Recently Deleted, Settings** — Sync destination carrying queued, failed **and stale-write** records; Recently Deleted in row language; Settings with appearance (System/Light/Dark) **and contrast (Standard/Increased)** in `sync_meta` | `components/OutOfSyncBanner/`, `components/Toast/` | 2-3       | Most likely place a backend proposal surfaces                    |
| 6    | **Retire the experiment and close out** — unregister, delete, archive iterations, feature doc, rewrite `docs/DESIGN.md`                                                                                                                          | `src/experiment/apple-reminders-ux/`               | 1         | None; docs and deletion only                                     |

**Spec 1 is deliberately the largest** because splitting it would leave a capability gap:
`ListSwitcher` owns list create / rename / delete today, and the drawer alone does not replace it. It
therefore carries ~3 DevTasks (tokens + chrome; sidebar wired to destinations; Lists page and
`ListSwitcher` deletion) rather than one oversized PR — the trilemma rule says split the DevTask, not
bend the ≤10 production-file limit.

## Testing — what the experiment never had

The experimental lane's test floor is one Storybook story plus unit tests. **Every E2E spec and every
production Storybook component test in this migration is new work.** Each spec names its own; the
full table of E2E titles lives in each spec doc, and a summary is in
[`MILESTONE.md`](MILESTONE.md) → Success Criteria.

### The trap: existing E2E specs break as each slice lands

`e2e/task_list.e2e.spec.ts`, `lists.e2e.spec.ts`, `recently_deleted.e2e.spec.ts`,
`offline_pressure.e2e.spec.ts` and `task_list-offline-sync.e2e.spec.ts` all drive the **current**
production UI. In-place migration changes their selectors and flows. **Each spec updates the existing
E2E specs covering the surface it changes, in the same PR** — this is the single most likely thing to
be missed, and it is not optional under the tests-in-same-PR rule.

### Storybook component tests must not write persistent state

The experiment's play-test stories wrote real Tasks and sync ops to IndexedDB. Storybook shares one
origin across stories and the preview loader's `deleteDB('psykl')` is silently blocked while any page
holds a connection, so those rows leaked into `PSYKL/TaskList`'s empty-state assertions and reddened
`main` twice. Use MSW handlers and `resetStore()` instead.

`PSYKL/TaskList › IntegratedWithCreateForm` is **already flaky** on CI — most recently on
`expect(await listSyncQueue()).toHaveLength(0)`. Spec 3 retires `TaskCreateForm`, which is the natural
moment to replace rather than port that story.

## Acceptance-check coverage

Every check in the prototype's `acceptance-checks.md` maps to at least one Spec. Walked 2026-09-21;
no orphans.

| Prototype acceptance check                                                       | Covered by                                                                         |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Capture                                                                          | Spec 3                                                                             |
| Complete                                                                         | Spec 2                                                                             |
| Row craft                                                                        | Spec 2                                                                             |
| Empty + failure                                                                  | Spec 2 (empty state) · Spec 3 (a failed save keeps the typed title)                |
| Dark mode                                                                        | Spec 1 (token sheet, `prefers-color-scheme`) · Spec 5 (explicit appearance choice) |
| Persistence                                                                      | Spec 2                                                                             |
| Keyboard & focus                                                                 | Spec 2 (checkbox focus ring, Space toggle) · Spec 3 (capture focus, Escape)        |
| Desktop                                                                          | Spec 1 (persistent sidebar, ≤680px content column)                                 |
| Review-round widenings — glyph set, collapsible Lists section, Lists page        | Spec 1                                                                             |
| Review-round widenings — per-list show/hide completed                            | Spec 4                                                                             |
| Review-round widenings — Sync / Recently Deleted / Settings in the same language | Spec 5                                                                             |

## Success Criteria

See [`MILESTONE.md`](MILESTONE.md). The one that matters: **production at `/` behaves exactly as the
prototype does today**, judged by walking the prototype's own `acceptance-checks.md` against `/`
rather than `/exp/*`.

## Out of scope

- `docs/specs/todo-experience/` Specs 3-7 (`sections`, `manual-ordering`, `notes-and-due-dates`,
  `interaction-polish-and-theming`, `tags-and-search`). They need rebasing onto the new UI **at a
  later date** and are untouched here.
- Swipe actions, detail sheet, sections, due dates, tags, task reorder, list tint colours, and
  drag-to-reorder for lists — all deferred by the prototype itself and still deferred.
- Any new user-facing capability. If a slice is tempted to add one, it is out of scope.

---

## Decisions

Normative. Surface for discussion; do not silently rework. Spec docs cite these IDs in
`honors_decisions:`.

### Decision 1 — Migrate in place, slice by slice

Each spec replaces real production components on `/`. No parallel route, no feature flag, no big-bang
cutover.

**Why:** a parallel surface doubles the maintenance of every hook and test for the duration, and a
big-bang cutover is one unreviewable PR. **Accepted cost:** `/` carries mixed styling between slices;
chrome goes first so those states are structural and brief.

### Decision 2 — `to-do-ui` becomes the active initiative; `todo-experience` pauses

`docs/PROJECT_STATUS.md` moves the active pointer. `todo-experience/DESIGN.md` is **not** edited — it
is APPROVED, and nothing here contradicts it. Specs 3-7 are marked paused pending a UI rebase.

**Why:** the pointer is status, not design. Editing an APPROVED design doc to record a scheduling
change would be the wrong instrument.

### Decision 3 — Stale writes surface in the Sync view, not as a transient toast

When another device's write replaces this device's edit under LWW, the user is told in the Sync
destination — a durable record they can open — not a toast that disappears while they are elsewhere.

**Why:** a stale write is a fact about data, not an event. `components/Toast/` is retired by Spec 5,
and a transient surface is the wrong place for something a user may want to check hours later.

### Decision 4 — Device-local preferences live in `sync_meta`, not `localStorage`

Show/hide-completed (Spec 4) and appearance (Spec 5) are written through `putMeta` / `getMeta` on the
existing `sync_meta` object store.

**Why:** this honours the locked decision in `todo-experience/DESIGN.md` — `sync_meta` is never
enqueued and therefore never syncs, which is exactly the semantics a device-local preference needs.
The prototype's `localStorage` stores were an experiment-lane shortcut. No schema version bump is
required; the store is already in schema v2.

### Decision 5 — Contrast ships as a user choice, not a compromise

The app offers **Standard** (default) and **Increased** contrast in Settings, alongside appearance.
Standard is the prototype exactly as accepted; Increased raises the four measured values that fall
below WCAG AA until they clear it.

**Why:** adopting Apple's system colors imports Apple's contrast behaviour — `--text-secondary` at
3.3:1 and the unchecked checkbox stroke at 1.7:1 both fail AA, as Reminders' own do. "Be conventional"
and "clear AA" are genuinely in tension here, and picking either one silently costs the other. Letting
the user choose costs one more device-local preference and one override block.

**Scope control, so this does not become a second design surface:** Increased is a four-token override
(three in light, one in dark), not a parallel palette. It may only raise contrast, never revisit hues.
A theme must define both levels — shipping only Standard would silently remove the accessible option.
Values in [`docs/DESIGN.md`](../../DESIGN.md) → Contrast — Standard and Increased.

**Where it lands:** Spec 1 ships the override block in the token sheet; Spec 5 ships the control and
its persistence. Spec 2 verifies the row at both levels, since the checkbox stroke is where the
difference is most visible.
