# Experiments

Artifacts for the Experimental lane — see
[`docs/workflows/lightweight-feature-workflow.md`](../workflows/lightweight-feature-workflow.md) under `target = prototype`. Lightweight work targeting production lands in `docs/specs/` instead.

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

**An experiment that exits collapses to one file: `docs/experiments/{slug}.md`.** The folder and its
iteration subfolders are deleted; the summary that replaces them says what was tried, what it
proved, and — for promoted work — links each iteration to the `docs/features/` doc it became. Git
history holds the artifacts if the detail is ever needed. On promotion, one iteration's artifacts
are the inputs to one production Spec, and that Spec's feature doc becomes the durable record of
what shipped; the experiment summary records only what the experiment _was_.

See [`apple-reminders-ux.md`](apple-reminders-ux.md) for a worked example (promoted, three
iterations, retired 2026-09-24).

This is not `docs/initiatives/` (gstack initiative planning) or `docs/specs/` (production
execution plans). Nothing here is a commitment to ship.
