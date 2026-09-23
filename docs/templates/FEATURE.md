---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: # P{n} for local plan, GH{n} once a GitHub Issue exists
branches: # YAML list of all branches that contributed to this feature (one per DevTask)
  -  # (feat|bug|infra|chore)/short-description
prs: # YAML list of all PR URLs that contributed to this feature (one per DevTask)
  -  # PR URL once opened
completed_at: # YYYY-MM-DD when merged
created_at: YYYY-MM-DD
initiative: # link/slug of the parent initiative
spec: # link to the source spec under docs/specs/{initiative}/
---

# {Feature Short Description}

> Filename convention: `[{YYYYMMDD}]{ISSUE_REF}_{feature-slug}.md` — see [`AGENTS.md`](../../AGENTS.md#naming-convention).

## User Story

As a {User}, I want to be able to {Feature} so that {Value proposition}.

## Features

1. _tbd_ — link to GitHub Issue once created (e.g. `https://github.com/jonpham/PSYKL-System/issues/N`)
2. _tbd_
3. _tbd_

## Visual Record

> **Required whenever the feature changed a user-facing surface.** Carry the content of the
> planning `visual-artifact.md` in here verbatim-or-updated at close-out, then delete the
> planning artifact — this doc is where it lives afterwards. Text-based forms only (ASCII
> wireframes, Mermaid, a state table): screenshots are local review material and are never
> committed. If implementation diverged from the planned picture, ship the picture of what
> was built and note the difference in one line beneath it. Write _none — no user-facing
> surface changed_ for infrastructure-only work.

{The wireframes / Mermaid flow / state storyboard for the shipped surface.}

## Verification Steps

**Associated E2E test:** _path/to/spec_ (or _none_)

**Manual verification**

_Setup / Preconditions_ — what conditions need to be met before the verification steps can be executed.

_Steps_

1. _tbd_
2. _tbd_

_Expectation_ — a generic description of what the end state should be if the user story was successfully implemented.

## Affected Components

- _tbd_

## Design Decisions

- _tbd_

## Architecture Decisions (ADR)

- _tbd_

## Change Log

| Date  | PR    | Summary |
| ----- | ----- | ------- |
| _tbd_ | _tbd_ | _tbd_   |
