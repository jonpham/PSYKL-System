# Acceptance Checks — {Feature name}

> Experimental lane — `docs/workflows/experimental-feature-workflow.md`.
> Copy to `docs/experiments/{slug}/acceptance-checks.md`.
> 3–8 checks. Each must be observable by a person using the experiment at `/exp/{slug}`.
> This is not a requirements document — delete any check you would not actually verify.

- [ ] **Primary path** — {the main thing the user came to do, start to finish}
- [ ] **Recovery** — {what happens on the failure, empty, or undo path}
- [ ] **Persistence** — {what survives a refresh, and what deliberately does not}
- [ ] **Keyboard & focus** — {tab order, focus after the primary action, Escape to dismiss}
- [ ] **Narrow layout** — {behaviour at ~390px wide}

Drop any line above that does not apply. Add checks only for behaviour this experiment is
actually testing a hypothesis about.

## Verified

{Filled after the slice runs. Date, what passed, what differed from the visual artifact.}
