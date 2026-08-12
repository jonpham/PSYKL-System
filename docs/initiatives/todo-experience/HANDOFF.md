---
status: OPEN
created: 2026-08-12
deleted_at_spec_closeout: true
---

# Handoff — adversarial review of `todo-experience/DESIGN.md`

Written because the originating session ran out of token budget before the review pass
(per [`AGENTS.md`](../../../AGENTS.md) → Subagent-Driven Development Discipline: on a
token-conservation warning, pause and write a handoff before dispatching more agents).

## State

| Item                    | Where                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| Design doc under review | `docs/initiatives/todo-experience/DESIGN.md` (Status: **DRAFT**) |
| Review prompt for Codex | `docs/initiatives/todo-experience/REVIEW-PROMPT.txt`             |
| Branch                  | `feat/plan-psykl-loop` — **not pushed**                          |
| Commits                 | `c0d8759` roadmap retag · plus this session's design-doc commit  |

## What happened before this handoff

1. `/office-hours` (gstack, Builder mode) ran against the question "what's next after M2."
2. The roadmap was re-cut earlier the same day (`c0d8759`): milestones past M1/M2 moved from
   ordinal numbers to purpose tags, Apple-native and auth were deferred as unsequenced, and a
   `psykl-loop` milestone was opened as next.
3. **The office-hours session then superseded that.** The operator wants Apple Reminders-grade
   todo experience **first**, and the PSYKL loop after. `docs/initiatives/todo-experience/DESIGN.md`
   is the result.

## Known inconsistency — do not "fix" it silently

`docs/initiatives/psykl-loop/MILESTONE.md`, `docs/PRODUCT.md`, and `docs/PROJECT_STATUS.md` all
still name `psykl-loop` as the active initiative. This is **known and deliberately unresolved** —
the close-out was gated on design-doc approval, which has not happened yet.

Close-out, once the doc is APPROVED:

1. `git mv docs/initiatives/psykl-loop docs/initiatives/todo-experience` is **not** right — the
   target directory already exists. Move `psykl-loop/MILESTONE.md` aside, write a new
   `todo-experience/MILESTONE.md` from the approved design, and re-create `psykl-loop/MILESTONE.md`
   seeded from the design doc's **Appendix: PSYKL loop specification**.
2. Refresh the roadmap tables in `docs/PRODUCT.md` and `docs/PROJECT_STATUS.md`.
3. Delete this handoff and `REVIEW-PROMPT.txt`.

## The task

Run the adversarial review the office-hours skill specifies, which the originating session skipped.
Reviewer must have **fresh context** — the value is that it has not seen the conversation that
produced the doc, only the doc.

```bash
cd "$(git rev-parse --show-toplevel)"
codex exec "$(cat docs/initiatives/todo-experience/REVIEW-PROMPT.txt)" \
  -C "$(git rev-parse --show-toplevel)" \
  -s read-only \
  -c 'model_reasoning_effort="high"'
```

Then: fix each issue in `DESIGN.md`, re-run, **max 3 iterations**. If the reviewer returns the
same issues twice running, stop and persist them as a `## Reviewer Concerns` section in the doc
rather than looping.

## Constraints the reviewer's fixes must not violate

- **Premise P2 is operator-corrected**, not an oversight. Due dates and optional times are IN;
  notifications and repeat rules are OUT; recurrence arrives later as template-tasks-that-spawn-instances.
  A reviewer flagging "why no notifications?" is wrong, not insightful.
- **Subtasks are deliberately deferred** pending hands-on validation. Not an omission.
- **Single-user, no collaboration, ever** (`docs/PRODUCT.md` → Sync and Sharing Model). Any
  suggestion involving sharing, assignees, or collaboration is out of scope by product definition.
- **Approach B was chosen by the operator.** A reviewer may argue the sequence within B; it may not
  re-litigate B versus A versus C.
- Never commit to `main`; never merge without explicit operator approval (`AGENTS.md` → Git Conventions).

## After the review

Report to the operator: iterations run, issues found, issues fixed, remaining concerns, quality
score. Then ask whether to mark the doc APPROVED and proceed to the close-out above. **Do not
mark it approved unilaterally.**
