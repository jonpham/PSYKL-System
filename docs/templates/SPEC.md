# {Spec Name} — Implementation Spec

> Template for `superpowers:writing-plans` to write into.
> See an example at `docs/superpowers/specs/2026-05-14-message-reactions-design.md`.

---

**Date:** YYYY-MM-DD
**Initiative:** M{n} {initiative-slug}
**Spec:** {N}/{M} in initiative
**Spec User Story:** *As a {role}, I {capability} so that {value}.*
**Status:** TODO | IN-PROGRESS | DONE | BLOCKED
**Branch:** `(feat|bug|infra|chore)/short-description`
**Time-box:** {N hours / N days estimate}
**Reads from:** `docs/initiatives/{initiative}/DESIGN.md` Decisions appendix (architectural decisions are LOCKED — do not re-open).

---

## Overview

One paragraph: what this Spec delivers end-to-end. Reference the User Story in plain language. State which PSYKL-System components are touched (e.g., `components/service-task`, `components/web_client`, `packages/shared-types`) and how the deliverable connects to the broader initiative.

> Vocabulary reminder: "Task" in this doc means a workflow Task (one PR), per AGENTS.md. The PSYKL data-model entity `Task { id, user_id, title, created_at }` is unrelated. Disambiguate by context.

---

## Data Model

For Specs that touch persistence:

- Tables/collections added or modified (with schema)
- Migration tool entries (Drizzle: which `schema.ts` files, which migration files)
- Constraints (uniqueness, foreign keys, defaults)
- `user_id` ownership column on every new record (per AGENTS.md Premise 7 equivalent)

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

Include the OpenAPI spec changes that `@nestjs/swagger` will emit.

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

All 5 pyramid layers per AGENTS.md → Test Discipline. Every Task lists tests in **TDD order** (failing test → implementation → green → refactor).

### Static Analysis

- New lint/format/code-style/compile/type-check rules introduced (if any)
- Files added to the `tsc` graph
- Configuration changes (`.eslintrc`, `tsconfig.*`)

### Unit tests

| File | What it asserts |
|------|-----------------|
| `path/to/file.test.ts` | concrete behavior |

### Integration tests

| File | What it asserts |
|------|-----------------|
| `path/to/integration.test.ts` | multi-module interaction inside one component (e.g., API handler + Drizzle + in-memory SQLite) |

### Component tests

For services (e.g., `service-task`): API contract tests driving the real HTTP layer in-process.
For UI apps (e.g., `web_client`): drive the real UI against stubbed back-end services.

| File | What it asserts |
|------|-----------------|
| `path/to/contract.test.ts` | full request/response shape, including default-deny on missing/malformed `user_id` |

### End-to-End tests

| File | What it asserts |
|------|-----------------|
| `e2e/{flow}.spec.ts` | one realistic user flow exercised against the running Docker Compose stack |

### TDD order during implementation

Number the order in which tests get written:

1. Write Static Analysis configuration that fails on bad code (if introducing new tooling)
2. Write Unit tests for pure helpers → implement → green
3. Write Integration tests for the API handler → implement handler → green
4. Write Component-layer contract tests → wire the boundary → green
5. Write the E2E test → connect the stack → green

---

## Tasks

This Spec contains {N} Tasks. Each Task is one Pull Request, ≤10 files (lockfile exempt). Each Task contains multiple Steps; each Step ends with one commit.

### Task {N.1}: {short imperative title}

**Files:** ~{count}
**Branch:** `(feat|bug|infra|chore)/{slug}`
**Affected:** list of file paths to create or modify

**Steps:**

- [ ] Step 1: Write failing test for X (commit: `test: add failing test for X`)
- [ ] Step 2: Implement X to make test pass (commit: `feat: implement X`)
- [ ] Step 3: Refactor / add edge-case tests (commit: `test: add edge-case coverage for X`)
- [ ] Step 4: Update feature doc + status (commit: included in the same PR, body bullet per AGENTS.md commit-message rule)

### Task {N.2}: {short imperative title}

(repeat structure)

---

## Verification (manual)

How to confirm the Spec is delivered end-to-end after all Tasks merge:

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

## Frontmatter (for living spec docs)

When this Spec is checked into `docs/specs/{initiative}/`, the file should have YAML frontmatter:

```yaml
---
status: TODO            # TODO | IN-PROGRESS | DONE | BLOCKED
issue:                  # P{n} for local plan, GH{n} once a GitHub Issue exists
branch:                 # (feat|bug|infra|chore)/short-description (Task-level branch)
pr:                     # PR URL once opened
completed_at:           # YYYY-MM-DD when merged
created_at: YYYY-MM-DD
initiative:             # m1-bootstrap, m2-pwa-crud-offline, etc.
tasks_total: N          # number of Tasks in this Spec
tasks_complete: 0       # update as Tasks merge
---
```

This frontmatter is the spec-level status. Per-Task / per-Step status lives in the Tasks checklist above.
