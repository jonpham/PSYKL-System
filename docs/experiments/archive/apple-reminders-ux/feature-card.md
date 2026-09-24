# Apple Reminders-grade UX

Experiment root — formerly route `/exp/apple-reminders-ux`. Lane: Standard. Status: **promoted and retired**.
Source: [issue #87](https://github.com/jonpham/PSYKL-System/issues/87).

One long-lived experimental shell, iterated feature by feature. Each iteration has its own
artifact set in a subfolder here; this card carries only the shell-level hypothesis and the log.

## User

Me (solo user), mobile-first on an iPhone with PSYKL installed as a PWA, and secondarily at a desktop browser.

## Problem

PSYKL's shell was built to prove data flow, not to be lived in. Apple Reminders is the interaction
standard I actually judge it against, and there is nowhere to try Reminders-grade patterns over real
PSYKL features before committing them to production.

## Outcome

A running surface that reproduces an Apple Reminders-comparable experience over existing PSYKL
features, good enough that promoting an iteration into production is a known quantity rather than a bet.

## Scope

UI layer only, on top of existing production components, hooks, and services. Mobile-first; desktop
must work but loses ties. Each iteration is scoped in its own subfolder's feature card.

## Not now

No schema, API, or shared-model changes. No production-module edits — the shell is parallel to
`App.tsx`, never a refactor of it. No visual design system work beyond what an iteration needs.

## Iterations

| #   | Iteration                                                   | Status   | Verdict                         |
| --- | ----------------------------------------------------------- | -------- | ------------------------------- |
| 1   | [`sidebar-navigation/`](sidebar-navigation/feature-card.md) | promoted | Shipped by `to-do-ui` Spec 1    |
| 2   | [`sync-status/`](sync-status/feature-card.md)               | promoted | Shipped by `to-do-ui` Spec 5    |
| 3   | [`apple-reminders-ui/`](apple-reminders-ui/feature-card.md) | promoted | Shipped by `to-do-ui` Specs 2-4 |

Add a row per iteration. On promotion, move that subfolder to
`docs/experiments/archive/apple-reminders-ux/{iteration}/` and record the verdict here; the shell
and its remaining iterations stay live.

## Verdict

**Promoted, and retired 2026-09-24** in `to-do-ui` Spec 6. All three iterations shipped into the
production surface, so the experiment's own code at `components/web_client/src/experiment/apple-reminders-ux/`
was deleted and its registry entry removed — `/exp/apple-reminders-ux` no longer resolves. The `/exp`
infrastructure stays for the next experiment.

The hypothesis held: the shell was good enough that promoting it was a known quantity rather than a
bet, and it became the production app rather than informing a separate design. The one thing that
did not survive contact was the `## Not now` line deferring doc reconciliation to promotion — the
`to-do-ui` initiative moved that rewrite to the _front_ of the work instead, so no implementing Spec
could read a stale `docs/DESIGN.md` (see that initiative's DESIGN.md, Decision 2).

Initiative record: [`docs/initiatives/to-do-ui/`](../../../initiatives/to-do-ui/) and the six
`to-do-ui` feature docs in [`docs/features/`](../../../features/).
