---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: # P{n} for local plan, GH{n} once a GitHub Issue exists
pr: # PR URL — only set for single-DevTask Specs; multi-DevTask Specs leave blank and track per-DevTask `pr:` in the DevTasks section below
completed_at: # YYYY-MM-DD when the final DevTask of this Spec merges
created_at: YYYY-MM-DD
initiative: # m1-bootstrap, m2-pwa-crud-offline, etc.
spec_number: N # matches docs/initiatives/{initiative}/DESIGN.md Spec/DevTask Breakdown
devtasks_total: N # number of DevTasks in this Spec (post any trilemma-driven splits)
devtasks_complete: 0 # update as DevTasks merge
honors_decisions: # YAML list of decision IDs from the initiative DESIGN.md that this Spec touches/depends on (e.g. [1, 2, 2b, 6, 18])
  - 0
---

# {Spec Name} — Implementation Spec

> Template for `superpowers:writing-plans` to write into.
> Filename convention (per AGENTS.md → Naming Convention): `YYYYMMDD-S{N}-{spec-slug}.md`
> Reference examples of well-shaped specs may exist locally outside the repo (gitignored); ask the user if a reference is helpful.

---

**Date:** YYYY-MM-DD
**Initiative:** M{n} {initiative-slug}
**Spec:** {N}/{M} in initiative (matches the DESIGN.md Spec/DevTask Breakdown table)
**Spec User Story:** _As a {role}, I {capability} so that {value}._
**Status:** see frontmatter
**Time-box:** {N hours / N days estimate}
**Reads from:** `docs/initiatives/{initiative}/DESIGN.md` Decisions appendix (architectural decisions are LOCKED — do not re-open).

---

## Overview

One paragraph: what this Spec delivers end-to-end. Reference the User Story in plain language. State which PSYKL-System components are touched (e.g., `components/service-task`, `components/web_client`, `packages/shared-types`) and how the deliverable connects to the broader initiative.

> Vocabulary reminder: `DevTask` (used throughout this doc) is the AGENTS.md workflow term for a PR-sized unit of work. The PSYKL data-model entity `Task { id, user_id, title, created_at }` is a different concept — the product domain's record type stored by `service-task`. They share no semantics. When `Task` appears (without the `Dev` prefix), it always means the PSYKL data entity.

---

## Data Model

For Specs that touch persistence:

- Tables/collections added or modified (with schema)
- Migration tool entries (Drizzle: which `schema.ts` files, which migration files)
- Constraints (uniqueness, foreign keys, defaults)
- `user_id` ownership column on every new record (per the initiative DESIGN.md's Premise 7 — Every Persisted Record Carries `user_id`)

If the Spec is purely structural (no schema), say: "No schema changes."

---

## API (if applicable)

For Specs that add or modify HTTP endpoints:

```
{METHOD} {path}
Body:    { ... } (JSON schema or OpenAPI fragment)
Auth:    `user_id` header enforced by global guard
Response: status + body shape
Errors:   400 / 401 / 403 / 404 / 422 with reasons
```

Include the OpenAPI spec changes that `zod-to-openapi` will emit at build time (consuming the Zod schemas in `packages/shared-types/src/schemas/`).

If the Spec is client-only (no API changes), say: "No API surface."

---

## Implementation Components

Break down what's added or modified, grouped by component (`service-task`, `web_client`, `packages/shared-types`, etc.):

### `components/service-task/`

- `src/{module}/...` — what's added/modified
- Module wiring (`AppModule`, providers, controllers)
- Drizzle schema changes (if any)
- Generated artifacts: OpenAPI document, types exported from `packages/shared-types`

### `components/web_client/`

- `src/components/...` — UI components added/modified
- API client wiring (`openapi-fetch` calls, generated types from `openapi-typescript`)
- Route additions or modifications

### `packages/shared-types/`

- Types added or modified
- Consumers (which other packages import what)

---

## Test Plan

All 5 pyramid layers per AGENTS.md → Test Discipline. Every DevTask lists tests in **TDD order** (failing test → implementation → green → refactor).

### Static Analysis

- New lint/format/code-style/compile/type-check rules introduced (if any)
- Files added to the `tsc` graph
- Configuration changes (`.eslintrc`, `tsconfig.*`)

### Unit tests

| File                   | What it asserts   |
| ---------------------- | ----------------- |
| `path/to/file.test.ts` | concrete behavior |

### Integration tests

| File                          | What it asserts                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `path/to/integration.test.ts` | multi-module interaction inside one component (e.g., API handler + Drizzle + in-process pglite, per AGENTS.md → Test Discipline → Integration) |

### Component tests

For services (e.g., `service-task`): API contract tests driving the real HTTP layer in-process.
For UI apps (e.g., `web_client`): drive the real UI against stubbed back-end services.

| File                       | What it asserts                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `path/to/contract.test.ts` | full request/response shape, including default-deny on missing/malformed `user_id` |

### End-to-End tests

| File                 | What it asserts                                                            |
| -------------------- | -------------------------------------------------------------------------- |
| `e2e/{flow}.spec.ts` | one realistic user flow exercised against the running Docker Compose stack |

### TDD order during implementation

Number the order in which tests get written:

1. Write Static Analysis configuration that fails on bad code (if introducing new tooling)
2. Write Unit tests for pure helpers → implement → green
3. Write Integration tests for the API handler → implement handler → green
4. Write Component-layer contract tests → wire the boundary → green
5. Write the E2E test → connect the stack → green

---

## DevTasks

This Spec contains {N} DevTasks. Each DevTask is one Pull Request, ≤10 **production behavior source files** (tests, config, docs, lockfiles, and generated migrations are exempt — see AGENTS.md → Git Conventions). Each DevTask **branches off the Spec integration branch `spec/{tag}-s{N}-{slug}` and PRs into that branch**, not into `main`; the Spec integration branch is the long-lived PR into `main`. Stack a DevTask onto a sibling only when it has a hard dependency on that sibling's unmerged work. Each DevTask contains multiple Steps; each Step ends with one commit.

**Trilemma rule (AGENTS.md → Design Doc Discipline):** if a planned DevTask's implementation files + required test files exceed 10, split the DevTask. Never defer tests to a later PR.

### DevTask {GLOBAL_NUMBER}: {short imperative title}

> DevTasks are numbered **globally** across the initiative (e.g., DevTask 3 always refers to the 3rd DevTask in M1 regardless of which Spec contains it), matching the numbering in the initiative DESIGN.md's Spec/DevTask Breakdown table.

**Files:** ~{count}
**Branch:** `(feat|bug|infra|chore)/{tag}-s{N}-dt{K}-{short-slug}` (e.g., `feat/todo-experience-s1-dt3-list-endpoints`)
**PR:** _filled once the PR is opened; format `https://github.com/jonpham/PSYKL-System/pull/N`_
**Affected:** list of file paths to create or modify

**Steps:**

- [ ] Step 1: Write failing test for X at the appropriate pyramid layer (commit: `test: add failing test for X`)
- [ ] Step 2: Implement X to make test pass (commit: `feat: implement X`)
- [ ] Step 3: Refactor / add edge-case tests (commit: `test: add edge-case coverage for X`)
- [ ] Step 4 (FINAL DevTask of this Spec only): create or update `docs/features/[YYYYMMDD]{ISSUE_REF}_{feature-slug}.md` consolidating the Spec's outcome (commit: included in the final-DevTask PR, body bullet per AGENTS.md commit-message rule). Earlier DevTasks within the same Spec do NOT touch the feature doc; they only update this spec doc's `## DevTasks` checkboxes.

### DevTask {GLOBAL_NUMBER + 1}: {short imperative title}

(repeat structure)

---

## Verification (manual)

How to confirm the Spec is delivered end-to-end after all DevTasks merge:

1. `git pull` and run `pnpm install`
2. `docker compose up` (or `pnpm dev`)
3. Open `http://localhost:{port}/{path}` — expected behavior
4. Run the E2E test locally: `pnpm test:e2e -- {spec-file}`

---

## Decisions made during spec drafting

Decisions THAT WERE NOT in the initiative's DESIGN.md but came up while writing this spec. Examples:

- Specific library version pinned
- Internal API shape between two modules
- Test fixture conventions

Anything that contradicts the initiative DESIGN.md's Decisions appendix is a violation — escalate to user before writing it.

---

## Open Questions / Risks

- Anything still unresolved at spec-writing time
- Known risks for this Spec specifically (e.g., "Playwright in CI may flake on the first few runs")
- Dependencies on other Specs (if any)

---

## Affected by / Depends on

- Other Specs that must merge first (with link)
- External factors (account access, third-party services, etc.)

---

> Frontmatter for this Spec is at the TOP of this template (above the title). The Spec-level frontmatter tracks overall status; per-DevTask `pr:` URLs and per-Step checkboxes live in the DevTasks section above.
