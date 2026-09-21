---
status: TODO
issue:
pr:
completed_at:
created_at: 2026-09-21
initiative: to-do-ui
spec_number: 6
devtasks_total: 1
devtasks_complete: 0
honors_decisions:
  - 1
  - 2
---

# Retire the Experiment and Close Out — Implementation Spec

> **Outline fidelity.** Expanded by `superpowers:writing-plans` when this Spec starts.

---

**Date:** 2026-09-21
**Initiative:** `to-do-ui`
**Spec:** 6/6
**Spec User Story:** _As the operator, I find one production surface and one set of current design docs — not a shipped app plus a prototype of the same app plus three docs describing a design nobody uses._
**Status:** see frontmatter
**Time-box:** ~0.5 day
**Reads from:** [`docs/initiatives/to-do-ui/DESIGN.md`](../../initiatives/to-do-ui/DESIGN.md).

---

## Overview

Deletes the promoted experiment, archives its three iteration folders with recorded verdicts, and
writes the initiative's feature doc.

> **Changed 2026-09-21:** the baseline doc rewrite that was planned here **moved to the front of the
> initiative and is already done.** `docs/DESIGN.md` was rewritten to the prototype's built values,
> `docs/STYLE.md` gained a Styling section, and `todo-experience/UX.md` was reconciled in place —
> all before any implementation, so no Spec can pull the old production surface in by reading a
> stale doc. What remains here is verification that the shipped app matches them.

Docs and deletion only — no behaviour change.

---

## Data Model

**None required.** Nothing is added or removed from persistence.

## API

**No API surface.**

---

## Implementation Components

### `components/web_client/`

- `src/experiment/registry.ts` — remove the `apple-reminders-ux` entry.
- `src/experiment/apple-reminders-ux/` — **deleted** in full.
- The `/exp` infrastructure — `registry.ts`, `ExperimentRouter`, `ExperimentsIndex`,
  `ExperimentFrame` — **stays**, for future experiments.

### `docs/`

- `docs/experiments/apple-reminders-ux/` → `docs/experiments/archive/apple-reminders-ux/`, all three
  iterations (`sidebar-navigation`, `sync-status`, `apple-reminders-ui`), each with a recorded
  verdict. All three are **promoted** — this migration absorbed all of them.
- `docs/features/[YYYYMMDD]P{n}_to-do-ui-reminders-grade-surface.md` (new) — the consolidated record,
  from `docs/templates/FEATURE.md`.
- `docs/DESIGN.md` — **already the baseline** (rewritten 2026-09-21). This Spec only reconciles it
  against what actually shipped: correct any value the five implementing Specs changed, and resolve
  the recorded contrast decision if it is still open.
- `docs/STYLE.md`, `docs/initiatives/todo-experience/UX.md` — **already reconciled**. Same treatment:
  check, do not rewrite.
- `docs/PROJECT_STATUS.md` — `to-do-ui` marked done; `todo-experience` Specs 3-7 unpaused; the next
  initiative named.
- `CHANGELOG.md` — the initiative's entry.

**`docs/initiatives/todo-experience/DESIGN.md` is not edited.** It is APPROVED and nothing here
contradicts it.

---

## Test Plan

### Static Analysis

The whole burden lands here: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check` must be clean
after the deletion. A dangling import of the deleted tree is the only realistic failure mode.

### Unit / Component / E2E

**No new tests.** The experiment's own tests are deleted with it. Every production test written in
Specs 1-5 must stay green — that is the deletion's proof.

One check that is not a test and must be run: `/exp` still serves its index, and
`/exp/apple-reminders-ux` now 404s rather than erroring.

### TDD order

Not applicable — no behaviour is added. Delete, then prove the suite is green.

---

## DevTasks

1 DevTask off `spec/to-do-ui-s6-retire-experiment-and-close-out`.

### DevTask 13: Delete the experiment, archive its artifacts, and close out the initiative

**Files:** ~2 production (`registry.ts`, plus the deleted tree); the rest are docs and are exempt from
the ≤10 count.
**Branch:** `chore/to-do-ui-s6-dt13-retire-experiment`

**Steps** include the final-DevTask obligation: create
`docs/features/[YYYYMMDD]P{n}_to-do-ui-reminders-grade-surface.md` consolidating the initiative's
outcome.

---

## Verification (manual)

1. `/exp` lists the remaining experiments; `/exp/apple-reminders-ux` is gone.
2. `grep -r "apple-reminders-ux" components/` returns nothing.
3. **The initiative's own acceptance gate:** walk all eight checks in the archived
   `acceptance-checks.md` against `/` at 390px and 1024px, light and dark, against `screenshots/`.
   Confirm completed-visibility and appearance both survive a reload and both stay device-local.

## Open Questions / Risks

- Archiving is a `git mv`; make sure the screenshots move with their iteration folder.
- The `docs/DESIGN.md` reconciliation is now a check, not a rewrite; keep `--accent-session` reserved for a live
  PSYKL session and nothing else.

## Affected by / Depends on

Specs 1-5 must all merge first. This Spec is the close-out.
