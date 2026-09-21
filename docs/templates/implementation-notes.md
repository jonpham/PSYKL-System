# Implementation Notes — {Feature name}

> Experimental lane — `docs/workflows/experimental-feature-workflow.md`.
> Copy to `docs/experiments/{slug}/{iteration}/implementation-notes.md`. Keep it to bullets.
> Scope is the thinnest slice that proves the outcome — not the production design.

## First slice

{The smallest thing that can be built and looked at. One or two bullets.}

## Files

- `components/web_client/src/experiment/{slug}/…` — new (the experiment's existing tree, if iterating)
- `components/web_client/src/experiment/registry.ts` — one entry added
- {production components/hooks reused, by path — these are read-only from here}

## Boundaries

{Confirm: no schema, API, shared-model, or production-module changes. Note anything the
experiment fakes in the UI layer instead of wiring for real.}

## Tests

{The one Storybook story, and any unit test the logic warrants. See the workflow's Test Floor.}

## Evidence

{Screenshots to capture, at which viewports and states, into `screenshots/`.}

## Open questions

{Only the ones that do not block the first slice. If one blocks, ask before coding.}
