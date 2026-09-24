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
3. The experiment's artifacts moved to `docs/experiments/archive/apple-reminders-ux/` with a
   recorded verdict on the root card and on each of the three iterations. All three were
   **promoted**; the screenshots moved with them.
4. `docs/DESIGN.md` reconciled against what shipped: the pixel source-of-truth path follows the
   archive, and the Accessibility section's "contrast exception is unresolved" line is corrected —
   that decision was made on 2026-09-21 and shipped in Spec 5.
5. The `to-do-ui` initiative closes: `CHANGELOG.md`, `docs/PROJECT_STATUS.md`, and an initiative
   retrospective at [`docs/retrospectives/2026-09-24-to-do-ui.md`](../retrospectives/2026-09-24-to-do-ui.md),
   which also carries the post-experiment refactor proposals for the client's hooks and components.

## Visual Record

_none — no user-facing surface changed._ One user-reachable route was **removed**
(`/exp/apple-reminders-ux`), and the `/exp` index now states its empty condition:

```text
/exp  ─────────────────────────────────────────
  Experiments
  No experiments are registered right now.

/exp/{any-slug}  ─────────────────────────────
  Experiments
  No experiment is registered at /exp/{any-slug}.
  No experiments are registered right now.
```

Settings still carries its **Experiments** section; it renders the same empty line. The experiment
tools (🧪) are **still reachable**, and deliberately so: `ExperimentFrame` mounts them and arms the
device on any `/exp` path, the index included, so a developer who lands on `/exp` or on a dead
experiment URL can still switch back to Production. They remain invisible to anyone who has never
opened an `/exp` path, which is the property that keeps production free of developer chrome.

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
5. Walk the eight checks in
   `docs/experiments/archive/apple-reminders-ux/apple-reminders-ui/acceptance-checks.md` against `/`
   at 390px and 1024px, light and dark. Confirm completed-visibility and appearance each survive a
   reload and each stay device-local.

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
