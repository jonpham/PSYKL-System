# Experiments

Artifacts for the Experimental lane — see
[`docs/workflows/experimental-feature-workflow.md`](../workflows/experimental-feature-workflow.md).

One directory per experiment, named for the experiment slug, matching the folder at
`components/web_client/src/experiment/{slug}/` and the route `/exp/{slug}`. An experiment is a
surface that gets iterated, so the artifact sets nest one level: the root card describes the
experiment, and each iteration owns a subfolder.

```text
docs/experiments/{slug}/
  feature-card.md              # the experiment: hypothesis, shared non-goals, iteration log, verdict
  {iteration}/
    feature-card.md
    visual-artifact.md
    acceptance-checks.md
    implementation-notes.md
    screenshots/
```

An iteration never overwrites a previous iteration's artifacts — they are the record of what was
tried. Adding an iteration means one new subfolder plus one row in the root card's `## Iterations`
table; the route, the code folder, and the registry entry do not change.

`archive/` holds iterations and experiments that have exited — discarded or promoted — under
`archive/{slug}/{iteration}/`. The Verdict sections record which, and why. Archived directories
stay: the record of what was tried and rejected is the point. On promotion, one iteration's
artifacts are the inputs to one production Spec.

This is not `docs/initiatives/` (gstack initiative planning) or `docs/specs/` (production
execution plans). Nothing here is a commitment to ship.
