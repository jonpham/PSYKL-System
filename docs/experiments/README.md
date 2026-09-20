# Experiments

Artifacts for the Experimental lane — see
[`docs/workflows/experimental-feature-workflow.md`](../workflows/experimental-feature-workflow.md).

One directory per experiment, named for the experiment slug, matching the folder at
`components/web_client/src/experiment/{slug}/` and the route `/exp/{slug}`:

```text
docs/experiments/{slug}/
  feature-card.md
  visual-artifact.md
  acceptance-checks.md
  implementation-notes.md
  screenshots/
```

`archive/` holds experiments that have exited — discarded or promoted. The feature card's
Verdict section records which, and why. Archived directories stay: the record of what was
tried and rejected is the point.

This is not `docs/initiatives/` (gstack initiative planning) or `docs/specs/` (production
execution plans). Nothing here is a commitment to ship.
