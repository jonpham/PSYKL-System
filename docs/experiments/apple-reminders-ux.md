---
status: DONE
type: experiment-summary
slug: apple-reminders-ux
created_at: 2026-08-29
completed_at: 2026-09-24
verdict: promoted
initiative: to-do-ui
---

# Experiment — `apple-reminders-ux`

**Promoted and retired.** Ran at `/exp/apple-reminders-ux` from 2026-08-29 to 2026-09-24 as three
iterations over one long-lived shell. All three were absorbed into production by the
`to-do-ui` initiative, which then deleted the experiment's code, its
registry entry, and its planning artifacts. This file is the durable record; the artifacts
themselves are in git history up to commit `a2eac2c`.

> The features it produced are documented in `docs/features/` — see the Iterations table below.
> This file says what was tried and what it proved, not how the shipped app works. For that, read
> [`docs/DESIGN.md`](../DESIGN.md) (the design it established) and the feature docs.

## Hypothesis

PSYKL's shell had been built to prove data flow, not to be lived in. Apple Reminders is the
interaction standard the product is actually judged against, and there was nowhere to try
Reminders-grade patterns over real PSYKL features before committing them to production.

The bet: a running surface, iterated against real hooks and real data, would make promoting a design
a **known quantity rather than a bet** — settled against a build under review, not against a
document.

**It held.** Four operator review rounds accepted the surface before a single production module
changed, and the five implementing Specs then built something already agreed. The experiment's own
`## Not now` — UI layer only, no schema, API, shared-model, or production-module edits — held for its
entire life: retiring it changed nothing under `src/components/`, `src/hooks/`, `src/services/`,
`src/sync/`, or `src/preferences/`.

## Iterations

Each iteration owned its own artifact set and shipped into one or more Specs.

| #   | Iteration            | Source                                                   | What it proposed                                                                                                                | Shipped as                                                                                                                                                                                                                                                                                           |
| --- | -------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `sidebar-navigation` | [#87](https://github.com/jonpham/PSYKL-System/issues/87) | Navigation moves out of the content area into a sidebar — hidden behind the `PSYKL` heading on mobile, permanent on desktop.    | [P1 — Shell, Navigation, and List Management](../features/%5B20260921%5DP1_to-do-ui-shell-navigation-and-lists.md)                                                                                                                                                                                   |
| 2   | `sync-status`        | [#91](https://github.com/jonpham/PSYKL-System/issues/91) | The sync banner becomes a compact status glyph in the header, with counts moved to a Sync destination opened on demand.         | [P5 — Sync, Recently Deleted, and Settings](../features/%5B20260922%5DP5_to-do-ui-sync-recently-deleted-and-settings.md)                                                                                                                                                                             |
| 3   | `apple-reminders-ui` | [#86](https://github.com/jonpham/PSYKL-System/issues/86) | The list inside the shell becomes Reminders-grade: row language, checkbox, capture, motion, a full token set in light and dark. | [P2 — Task List and Row](../features/%5B20260922%5DP2_to-do-ui-task-list-and-row.md) · [P3 — Inline Capture](../features/%5B20260922%5DP3_to-do-ui-inline-capture.md) · [P4 — List Options and Completed Visibility](../features/%5B20260922%5DP4_to-do-ui-list-options-and-completed-visibility.md) |

The migration itself, and this retirement, are recorded in
[P6 — Retiring the `apple-reminders-ux` Experiment](../features/%5B20260924%5DP6_to-do-ui-retire-experiment-and-close-out.md),
whose `## Visual Record` carries the picture of the surface as built.

## What the experiment changed beyond the code

- **It became the design baseline.** [`docs/DESIGN.md`](../DESIGN.md) was rewritten on 2026-09-21
  from this prototype's built and reviewed values — explicitly outranking its own previous revision,
  which had been written before any of the surface existed. [`docs/STYLE.md`](../STYLE.md) gained a
  Styling section in the same pass, and [`todo-experience/UX.md`](../initiatives/todo-experience/UX.md)
  was reconciled section by section against what the prototype actually built.
- **It reshaped the roadmap.** `todo-experience` Specs 3-7 were paused mid-initiative because they
  described the surface this prototype replaced; they resume by rebasing onto it.
- **It produced the `/exp` infrastructure**, which outlives it: `registry.ts`, `ExperimentRouter`,
  `ExperimentsIndex`, `ExperimentFrame`, and the 🧪 `ExperimentTools`, plus the one-way ESLint
  import boundary that let the whole tree be deleted without touching production. Registering the
  next experiment is a folder plus one line in `components/web_client/src/experiment/registry.ts`.
- **It caught a real bug before production ever had it.** `autoFocus` on the capture input focused
  _after_ paint, so characters typed immediately after tapping the control were swallowed —
  `Book dentist` arrived as `k dentist`. Focus is taken synchronously in a layout effect, in both
  the task capture row and the new-list input, because the prototype found it first.

## Acceptance record

The surface was accepted on 2026-09-21 against a running build at 390×780 and 1024×768, light and
dark, with the API deliberately down so every row also carried its pending-sync dot. Tab order,
Space-to-toggle, Escape-to-cancel, and persistence across reload were each observed directly rather
than inferred from tests.

Iteration 3's eight checks — capture, completion, row craft, empty and failure states, dark mode,
persistence, keyboard and focus, and the desktop column — all passed, as did iteration 2's eight
sync checks. Iteration 1's checks passed in Storybook and browser review; its iPhone operator review
was folded into the later whole-surface review rounds rather than run separately.

## Verdict

**Promoted, 2026-09-24.** Every iteration reached production, so nothing was left to explore and the
experiment exited by deletion rather than by archive: with all three promoted, the six `to-do-ui`
feature docs are the record of what it produced, and this file is the record of what it was.

Differences between the prototype and the shipped app are not tracked as open items — the shipped
app is the reference, and production iterates on its own terms from here.
