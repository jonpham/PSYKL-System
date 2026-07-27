---
status: DONE
issue: [GH#6](https://github.com/jonpham/PSYKL-System/issues/6)
branches:
  - spec/m1-s5-ci-test-pipeline
prs:
  - https://github.com/jonpham/PSYKL-System/pull/29
completed_at: 2026-05-29
created_at: 2026-05-20
initiative: m1-bootstrap
spec: consolidated-into-this-doc
---

# M1 Spec 5: CI Test Pipeline

## User Story

As a **developer**, I want **every Pull Request to run the full 5-layer test pyramid before merge** so that **regressions, type errors, schema drift, and end-to-end breakage are caught automatically before `main` is tagged or released**.

## Features

1. **Split lower-layer CI workflow.** `.github/workflows/ci.yml` runs four visible checks on Pull Requests to `main` and `spec/**`: `static-checking`, `unit-tests`, `integration-tests`, and `component-tests`.
2. **Static-analysis-first ordering.** Unit, Integration, and Component jobs depend on `static-checking`, preserving the project rule that Static Analysis blocks deeper test layers.
3. **Docker Compose E2E workflow.** `.github/workflows/ci-e2e.yml` installs Playwright Chromium, builds the Compose stack with `docker-compose.e2e.yml`, waits for both service boundaries, runs Playwright E2E tests, uploads the Playwright report on failure, prints Compose logs on failure, and always tears the stack down.
4. **Root verification command surface.** Root `verify:*` scripts in `package.json` are the developer-facing source of truth for CI commands. GitHub Actions call those commands instead of duplicating test invocations in workflow YAML.
5. **Reusable E2E shell helpers.** Multi-step shell behavior that developers may need locally lives under `scripts/`: Compose up/down/logs and service readiness checks.
6. **Baseline Playwright E2E package.** The root `e2e/` workspace contains Playwright configuration and `task_list.e2e.spec.ts`, covering task creation and list rendering through the running PWA.
7. **Private-repository scope.** README and close-out docs record that branch-protection enforcement and required status checks are out of scope while the repository is private without GitHub Pro; the visible workflow checks are the manual merge gate.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m1-bootstrap/DESIGN.md` (Decisions #11, #17, #23, #24, #27, #28).
- Original issue brief: `docs/initiatives/m1-bootstrap/issues/[20260520]P5_m1-ci-test-pipeline.md` (consolidated into this feature doc and removed by PR #29).
- Execution spec: `docs/specs/m1-bootstrap/20260520-S5-ci-test-pipeline.md` (consolidated into this feature doc and removed by PR #29; the DevTask checklist lives only in git history from here forward).
- GitHub issue: [#6](https://github.com/jonpham/PSYKL-System/issues/6).
- Spec integration PR: [#29](https://github.com/jonpham/PSYKL-System/pull/29).

## Implementation Notes

- **CI decomposition:** Lower test layers are split into separate jobs so failures are easier to scan in Pull Request status.
- **Command ownership:** `package.json` owns developer-facing verification commands. Workflow YAML calls `pnpm verify:*`; `scripts/` is reserved for reusable shell behavior that is more than a one-line package-script forwarder.
- **Generated artifacts:** `pnpm verify:prepare` builds shared types, emits the service OpenAPI document, and regenerates web client API types before checks that depend on those artifacts.
- **Playwright browser scope:** M1 installs Chromium only, matching DESIGN.md Decision #28. Other browser projects can be added in a later client-surface milestone.
- **E2E database reset:** E2E runs use the Spec 4 Compose overlay, which swaps pglite persistence for `tmpfs` so every run starts from an empty database.
- **Private-repository limitation:** Branch protection and required status checks require a public repository or GitHub Pro. They are not part of the shipped `ci-test-pipeline` behavior for the current private repository.

## Verification Steps

**Associated E2E test:** `e2e/task_list.e2e.spec.ts`.

**Manual verification**

_Setup / Preconditions_

- Specs 1, 2, 3, and 4 are present because CI builds and tests the actual workspace packages and Docker Compose stack.
- Docker Engine + Docker Compose v2 are available for local E2E verification.
- GitHub Actions are enabled for the repository.

_Steps_

1. Run `pnpm verify:prepare`.
2. Run `pnpm verify:static`.
3. Run `pnpm verify:unit`.
4. Run `pnpm verify:integration`.
5. Run `pnpm verify:component`.
6. Run `pnpm verify:e2e:install-browsers`.
7. Run `pnpm verify:e2e:up`.
8. Run `pnpm verify:e2e:wait`.
9. Run `pnpm verify:e2e`.
10. Run `pnpm verify:e2e:down`.
11. Open PR #29 and confirm the five expected checks run on the pushed branch.
12. After PR #29 merges, confirm the same checks run on `main`. While the repository remains private without GitHub Pro, treat green checks as a manual merge gate rather than enforced branch protection.

_Expectation_

Every Pull Request to `main` and Spec integration branches runs the full M1 test pyramid. Static Analysis runs first and blocks deeper lower-layer jobs if it fails. E2E runs against the actual Docker Compose stack with a clean pglite database.

## Affected Components

- `.github/workflows/ci.yml`
- `.github/workflows/ci-e2e.yml`
- `package.json`
- `scripts/`
- `e2e/`
- `README.md`
- `.claude/settings.json`
- Durable docs: `CHANGELOG.md`, `docs/PROJECT_STATUS.md`, `docs/STACK.md`, `docs/ARCHITECTURE.md`

## Design Decisions

- **#11** Test file location convention and canonical run commands for the full test pyramid.
- **#17** GitHub branch protection on `main` is scoped out while the repository is private without GitHub Pro; visible checks remain.
- **#23** Vitest workspace mode at repo root via `vitest.workspace.ts`.
- **#24** pnpm script contract: every component and package defines the standard script set; no-op stubs are allowed where a layer does not apply.
- **#27** E2E reset strategy: `docker-compose.e2e.yml` overlay with `tmpfs`.
- **#28** E2E driver: Playwright, Chromium only in M1.

## Architecture Decisions (ADR)

- **ADR-M1-022:** GitHub Actions is the M1 CI visibility gate. It runs on Pull Requests to `main` and Spec integration branches so long-lived Spec PRs receive the same feedback as final merges.
- **ADR-M1-023:** Static Analysis is an upstream CI check. Unit, Integration, and Component jobs declare `needs: static-checking` so lint, formatting, and type errors stop deeper lower-layer work within CI.
- **ADR-M1-024:** Root `verify:*` scripts are the public developer and CI command surface. Shell scripts are kept only where they encode reusable multi-step behavior, such as Compose lifecycle and readiness polling.
- **ADR-M1-025:** E2E CI drives the real Docker Compose stack, not mocked service boundaries, and uses the existing `docker-compose.e2e.yml` overlay for clean database state.

## Change Log

| Date       | PR                                                     | Summary                                                                                                                                                                    |
| ---------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-29 | [#29](https://github.com/jonpham/PSYKL-System/pull/29) | Spec integration: split CI checks, root `verify:*` command surface, Playwright E2E workspace, reusable E2E helper scripts, private-repo CI scope docs, and close-out docs. |
