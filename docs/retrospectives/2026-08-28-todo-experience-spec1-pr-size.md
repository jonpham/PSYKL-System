---
spec_prs: [70]
---

# Retrospective: Spec 1 PR size and agent response verbosity

**Initiative:** `todo-experience` · **Spec:** 1 — Generalized Sync Queue + Lists

## What happened

Executing Spec 1 via `superpowers:subagent-driven-development`, a pre-flight
`AskUserQuestion` offered "commit all DevTasks directly onto the Spec branch,
single PR at close-out" as the recommended option, to run continuously
without per-DevTask approval stops. The operator accepted it for velocity.

Result: PR #70 (the Spec integration PR) landed with **83 files** across all
6 DevTasks plus fix-round commits, in one review pass. The operator reported
this as the primary source of review friction — "fear and dread of
continuing work" — and separately flagged that agent responses during
execution ran long enough to compound the problem.

## Root cause

Not a rule violation: the ≤10-production-file limit was always scoped to
DevTask PRs only, and Spec PRs were explicitly documented as unlimited
aggregates. The rule did its job everywhere it applied — it just never got
the chance to apply, because the workflow chosen up front skipped opening
DevTask PRs entirely.

## Fix

1. **Reversed the default**: `superpowers:subagent-driven-development` no
   longer offers "single PR at close-out" as an option. Each DevTask now
   opens and merges its own PR against the Spec branch before the next
   starts (AGENTS.md → Subagent-Driven Development Discipline).
2. **New Response Style caps**: ≤20 lines of prose per response, bullets
   over paragraphs, conclusion-first, no re-paraphrasing on-disk content
   (AGENTS.md → Response Style).

## Proposed AGENTS.md changes

Landed in this same session — see the two diffs above. No further action.
