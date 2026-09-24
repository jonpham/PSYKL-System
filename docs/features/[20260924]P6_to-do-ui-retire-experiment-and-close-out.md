---
status: IN-PROGRESS # → DONE, with completed_at, when PR #142 merges
issue: P6
branches:
  - chore/experiment-cleanup-reminders-ux
prs:
  - https://github.com/jonpham/PSYKL-System/pull/142
completed_at:
created_at: 2026-09-24
initiative: to-do-ui
spec: docs/specs/to-do-ui/20260921-Spec6-retire-experiment-and-close-out.md (deleted at Spec close-out; see git history)
---

# Retiring the `apple-reminders-ux` Experiment

## User Story

As the operator, I find one production surface and one set of current design docs — not a shipped
app plus a prototype of the same app plus three docs describing a design nobody uses.

## Features

1. `components/web_client/src/experiment/apple-reminders-ux/` **deleted in full** — 47 files, the
   second implementation of the shipped app. `/exp/apple-reminders-ux` no longer resolves.
2. The registry is **empty and valid**. The `/exp` infrastructure — `registry.ts`,
   `ExperimentRouter`, `ExperimentsIndex`, `ExperimentFrame`, `ExperimentTools` — stays for the next
   experiment, and its tests no longer name a deleted tree.
3. The experiment's planning artifacts are **deleted**, not archived — the operator's call at
   close-out: all three iterations were promoted, so their record is this initiative's six feature
   docs, and git history holds the artifacts themselves. Their two load-bearing pieces are carried
   into this doc rather than lost: the picture of the surface (`## Visual Record`) and the
   acceptance gate (`## Verification Steps`). Deleting them also retires ten committed screenshots,
   which [`AGENTS.md`](../../AGENTS.md) had never permitted in the first place.
4. `docs/DESIGN.md` reconciled against what shipped: the pixel source-of-truth path follows the
   archive, and the Accessibility section's "contrast exception is unresolved" line is corrected —
   that decision was made on 2026-09-21 and shipped in Spec 5.
5. The `to-do-ui` initiative closes: `CHANGELOG.md`, `docs/PROJECT_STATUS.md`, and an initiative
   retrospective at [`docs/retrospectives/2026-09-24-to-do-ui.md`](../retrospectives/2026-09-24-to-do-ui.md),
   which also carries the post-experiment refactor proposals for the client's hooks and components.

## Visual Record

The `to-do-ui` initiative shipped this surface across Specs 1-5; none of those feature docs carried
a `## Visual Record`, and the planning `visual-artifact.md` was deleted with the experiment's
artifacts. It is carried here — **updated to what was built** — so the picture survives its source,
per [`AGENTS.md`](../../AGENTS.md) → Git Conventions. `docs/DESIGN.md` remains the normative
statement of metrics, tokens, and motion; this is the shape they compose into.

### Loaded list @ 390px

```text
┌──────────────────────────────┐
│ ☰ PSYKL                      │  44px chrome · Open PSYKL navigation
│                              │
│ Tasks                    ◍ ⋯ │  large title · sync control · list menu
│ ──────────────────────────── │  separator, full bleed
│  ◯  Book dentist             │  row ≥44px · title 17/22 · 22px circle
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │  separator inset to the title edge
│  ◯  Draft the offline sync   │
│     notes for Thursday       │  wraps, never truncates
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ✔  ̶R̶e̶n̶e̶w̶ ̶p̶a̶s̶s̶p̶o̶r̶t̶         │  completed sink below the open tasks
│                              │
│                          (+) │  floating capture · New Task
└──────────────────────────────┘
```

### Capture, keyboard up @ 390px

```text
┌──────────────────────────────┐
│  ◯  Book dentist             │
│     ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ◯  ▏                        │  empty row appended after the last
│                              │  OPEN task, never below completed
├──────────────────────────────┤
│  q w e r t y u i o p         │  Return commits and opens the next
│   a s d f g h j k l          │  empty row; Escape leaves; an empty
│    z x c v b n m  ⌫          │  row is discarded on blur
│  ─────── space ───── return  │
└──────────────────────────────┘
```

### Selection mode @ 390px

```text
┌──────────────────────────────┐
│ Tasks                      ✓ │  header hands over; ✓ is the way out
│ ──────────────────────────── │
│  ◉  Book dentist          ⠿ │  rows pool instead of editing · handle
│  ○  Draft the offline sync ⠿ │
│ ──────────────────────────── │
│   ◐        ↪        🗑        │  complete · move · delete (two-press)
└──────────────────────────────┘
```

### Desktop @ 1024px

```text
┌───────────────┬──────────────────────────────────────────┐
│ PSYKL         │  Tasks                               ◍ ⋯ │
│  ▸ Tasks   ✓  │  ────────────────────────────────────────│
│  ▸ Sync       │   ◯  Book dentist                        │
│  ▸ Recently…  │      ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│  ▸ Settings   │   ✔  ̶R̶e̶n̶e̶w̶ ̶p̶a̶s̶s̶p̶o̶r̶t̶                    │
│               │                                      (+) │
└───────────────┴──────────────────────────────────────────┘
       sidebar permanent past 768px · content column max 680px
```

**How the built surface diverges from the planned picture.** Recorded at the prototype's own
acceptance review and carried forward, plus what Specs 2-5 and the lightweight changes altered:

| Divergence                                                                            | Why                                                                                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Capture is a floating **(+)** at the trailing edge, not a bottom `⊕ New Reminder` bar | Changed in Spec 3 / [#122](https://github.com/jonpham/PSYKL-System/issues/122); the bar spent a row of chrome                           |
| No hairline under the large title                                                     | Reminders has none until the title collapses on scroll, and that collapse was never in scope                                            |
| Checkbox column is 36px, not 44px                                                     | Matches the title inset; a 44px column reaches back into the page gutter. The hit target is still 44px                                  |
| A failed task load is silent while the device still has tasks                         | Offline-first: the local list is the truth, and the header's sync control already carries the signal                                    |
| Empty list reads `No tasks yet. Create your first one.`, left-aligned                 | Built that way in Spec 2 rather than the planned centred `No Reminders` — see the note below                                            |
| Rows carry a details **(i)** affordance the prototype never had                       | [#127](https://github.com/jonpham/PSYKL-System/issues/127) added the task drawer; the prototype had neither                             |
| Selection mode, drag handles, and the list-delete dialog are absent from the plan     | All later work ([#126](https://github.com/jonpham/PSYKL-System/issues/126), [#138](https://github.com/jonpham/PSYKL-System/issues/138)) |

> **One divergence is a defect, not a decision.** `TaskList/EmptyState/EmptyState.tsx` renders its
> copy with `style={{ color: '#666' }}` — an inline style carrying a raw hex literal, which
> [`docs/STYLE.md`](../STYLE.md) → Styling and [`docs/DESIGN.md`](../DESIGN.md) → Anti-patterns both
> ban outright, and which ignores theme and contrast entirely. Out of scope for a close-out PR that
> changes no production module; recorded here and in the retrospective so it is not lost.

## Verification Steps

**Associated E2E test:** `e2e/experiment_tools.e2e.spec.ts` — four checks active, two skipped.
Mounting `/exp` itself arms the tools, so closing them for good and dismissing the picker with
Escape both still run without a registered experiment. Only the two that need a _named_ prototype —
switching into one and back, and reading its row in the Settings list — are `test.describe.skip`,
to be re-activated against the next experiment's slug.

**Manual verification**

_Setup / Preconditions_ — the app running at `/` with the full stack up.

_Steps_

1. Open `/exp` — the index states that no experiments are registered.
2. Open `/exp/apple-reminders-ux` — it reports no experiment at that path rather than erroring.
3. Open `/settings` — the Experiments section renders, empty, and no 🧪 control appears anywhere.
4. Run `grep -r "apple-reminders-ux" components/` — no matches.
5. Walk the initiative's acceptance gate below against `/` at 390px and 1024px, light and dark.
   Confirm completed-visibility and appearance each survive a reload and each stay device-local.

_The initiative's acceptance gate_ — the eight checks the prototype was accepted against, carried
here from the deleted `acceptance-checks.md` and re-pointed at `/`, the production surface that
absorbed them. All eight passed against the prototype on 2026-09-21; they are the gate the shipped
app must still clear.

- [ ] **Capture** — the capture affordance appends an empty focused row in place (no modal, no top
      form); typing and pressing Return saves the task and opens the next empty row; blurring an
      empty row discards it.
- [ ] **Complete** — tapping a checkbox fills it with the tint, strikes and dims the title within
      ~200ms, and the row settles below the last open task; tapping again reverses it.
- [ ] **Row craft** — every row is ≥44px with a 22px circle checkbox, titles at 17px wrapping
      rather than truncating, and hairline separators inset to the title's leading edge.
- [ ] **Empty + failure** — an empty list shows its empty copy and the capture affordance; a save
      that fails surfaces the error without losing the typed title.
- [ ] **Dark mode** — switching the OS to dark renders a designed dark surface (black ground,
      `#0A84FF` tint), not an inversion; text and the checkbox stay legible in both.
- [ ] **Persistence** — created and completed tasks survive a refresh, and completed ones return
      below the open tasks in the same order.
- [ ] **Keyboard & focus** — Tab reaches the capture affordance and every checkbox with a visible
      focus ring; Space/Return toggles completion; Escape leaves an in-progress capture row.
- [ ] **Desktop** — at 1024px the list sits in a ≤680px content column beside the persistent
      sidebar, with the same row metrics and no stretched full-width rows.

> The prototype's review also surfaced and fixed one real bug worth keeping: `autoFocus` on the
> capture input focused _after_ paint, so characters typed immediately after tapping the capture
> control were swallowed — `Book dentist` arrived as `k dentist`. Focus is taken synchronously in a
> layout effect, in both the task capture row and the new-list input.

_Expectation_ — the production app is unchanged in every respect, and the prototype is gone.

## Affected Components

- `components/web_client/src/experiment/` — `apple-reminders-ux/` deleted; `registry.ts` emptied;
  `ExperimentTools/`, `ExperimentSwitcher/`, `ExperimentFrame/` tests re-fixtured onto a neutral
  `sample-experiment` slug.
- `e2e/experiment_tools.e2e.spec.ts` — one new active test, four skipped.
- `docs/` — archive move, `DESIGN.md` reconciliation, feature doc, retrospective, status, changelog.

No production module under `src/components/`, `src/hooks/`, `src/services/`, `src/sync/`, or
`src/preferences/` changed. That is the deletion's proof: the experiment was genuinely parallel to
production, never a fork of it.

## Design Decisions

- **The registry's empty state is the resting state, not a defect.** Removing the last experiment
  does not remove `/exp`; `registry.types.ts` deliberately carries no status field, because an
  experiment that is still registered is by definition still being explored.
- **The experiment's E2E coverage is skipped, not deleted — and skipped as narrowly as possible.**
  Only two checks genuinely need a named prototype; per AGENTS.md → Test Discipline they ship
  skipped rather than omitted. The other two were retargeted at `/exp`, which arms the tools just as
  an experiment does — `close()` is the only path that disarms them, so leaving it unexercised would
  have let a regression pin the 🧪 chrome over production for every developer who ever opened `/exp`,
  with nothing in CI failing. `ExperimentTools` also gained four unit tests over the empty registry,
  the configuration that now actually ships.
- **Test fixtures were re-named, not left pointing at a deleted tree.** `sample-experiment` /
  `Sample Experiment` also satisfies the Spec's `grep -r "apple-reminders-ux" components/` gate.
- **Archived artifacts stay in the repo.** Per `docs/experiments/README.md`, the record of what was
  tried is the point; the verdicts say which iteration each production Spec absorbed.
- **The initiative's `DESIGN.md` and `MILESTONE.md` are kept, not deleted.** The initiative
  close-out checklist permits deleting them ("can be deleted to minimize document sprawl"), but
  `todo-experience` Specs 3-7 resume by rebasing onto this surface and read `to-do-ui`'s normative
  Decisions appendix as their input. Deleting an APPROVED design doc is an operator call. Left open
  in the PR.

## Architecture Decisions (ADR)

- None. No component boundary, dependency, or deployment shape changed.

## Change Log

| Date       | PR                                                       | Summary                                                                                              |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 2026-09-24 | [#142](https://github.com/jonpham/PSYKL-System/pull/142) | Deleted the promoted `apple-reminders-ux` experiment, archived its artifacts, closed out `to-do-ui`. |
