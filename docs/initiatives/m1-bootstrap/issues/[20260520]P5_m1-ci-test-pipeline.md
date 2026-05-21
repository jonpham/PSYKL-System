---
status: TODO
issue: [GH#6](https://github.com/jonpham/PSYKL-System/issues/6)
branches:
  -
prs:
  -
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec: 5
devtasks_total: 1       # DevTask 8 (may be split into 2 DevTasks per trilemma rule if file count requires)
devtasks_complete: 0
---

# 20260520 - M1 Spec 5: CI test pipeline

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **developer**, I want **every Pull Request to run the full 5-layer test pyramid before merge** so that **regressions, type errors, schema drift, and end-to-end breakage all get caught automatically by CI — and `main` is always in a green state worth tagging for release**.

## Features (DevTasks composing this Spec)

1. **DevTask 8 — CI pipeline + E2E.** GitHub Actions workflow(s) running:
   - **Static Analysis**: `pnpm -r lint`, `pnpm -r format:check`, `pnpm -r typecheck`
   - **Unit**: `pnpm -r test:unit`
   - **Integration**: `pnpm -r test:integration` (in-process pglite per Decision #25)
   - **Component**: `pnpm -r test:component`
   - **End-to-End**: separate job that runs `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up` (per Decision #27, tmpfs overlay so each run starts fresh), then runs Playwright (per Decision #28) against the running stack at the configured base URL, then tears the stack down. Browser installs cached by GitHub Actions.
   - Plus: `playwright.config.ts` at `e2e/playwright.config.ts`, a baseline E2E spec (`e2e/m1-task-crud.e2e.spec.ts`) covering the user-journey verification in Spec 3, branch-protection setup notes in README (manual repo-settings change per Decision #17).
   ~5-7 files (spec writer may split into "lint+unit+integration+component" workflow and a separate "e2e against compose" workflow if file count requires). [Sub-Issue TBD]

## Verification Steps

**Associated E2E test:** `e2e/m1-task-crud.e2e.spec.ts` — created and exercised as part of this Spec.

**Manual verification:**

_Setup / Preconditions_
- Specs 1, 2, 3, 4 complete and merged.
- Repo settings → Branches → `main` configured with branch protection (per Decision #17): require PR review, require status checks to pass (named after the CI job names), require linear history, block force-pushes. (One-time manual setup; not a DevTask deliverable.)

_Steps_
1. Open a Pull Request that touches any file under `components/` or `packages/`.
2. Confirm GitHub Actions starts a workflow run automatically.
3. Confirm the workflow's jobs run, in this order or in parallel where independent:
   - `lint` (static analysis): pass
   - `typecheck` (static analysis): pass
   - `test:unit` (per-component Vitest, including UI widgets): pass
   - `test:integration` (per-component Vitest with in-process pglite): pass
   - `test:component` (per-component Vitest + Testing Library + MSW for `web_client`; in-process HTTP contract tests for `service-task`): pass
   - `e2e` (Playwright against `docker compose -f docker-compose.yml -f docker-compose.e2e.yml up`): pass
4. Open another PR that intentionally breaks one layer (e.g., add a TypeScript error). Confirm CI fails on that layer and merge is blocked.
5. Open another PR that breaks the E2E flow (e.g., remove the `POST /tasks` handler). Confirm the E2E layer fails and merge is blocked.
6. Confirm Playwright browser cache works: the second E2E run on the same runner type is materially faster than the first (no full browser download).

_Expectation_
PSYKL-System has a green-when-ready CI gate. Every PR runs the full pyramid. Merging `main` requires all jobs green. Breakage in any layer is caught and surfaced before merge.

## Affected Components

- `.github/workflows/`: at least one workflow file (e.g., `ci.yml`); possibly split into `ci.yml` (lint/unit/integration/component) and `ci-e2e.yml` (Playwright + Docker Compose) if file budget requires.
- `e2e/` (repo root): `playwright.config.ts`, `m1-task-crud.e2e.spec.ts`, optionally `fixtures/` for test data, `package.json` for e2e-specific Playwright deps.
- `README.md` and/or `CONTRIBUTING.md` (later): note the branch-protection manual setup step.

## Design Decisions

- **#11** Test file location convention (per AGENTS.md → Test File Location Convention). Each test layer has a canonical run command:
  - Static Analysis: `pnpm -r lint && pnpm -r typecheck && pnpm -r format:check`
  - Unit: `pnpm -r test:unit`
  - Integration: `pnpm -r test:integration`
  - Component: `pnpm -r test:component`
  - E2E: `pnpm test:e2e` (root-level script invoking Playwright)
- **#17** GitHub branch protection on `main`: configured in repo settings (not in code). Required status checks named after the CI job names. NOT a DevTask deliverable.
- **#23** Vitest workspace mode at repo root via `vitest.workspace.ts`; each component and package under `packages/` has its own `vitest.config.ts`.
- **#24** pnpm script contract: every component and package defines the standard script set; no-op stubs allowed where a layer doesn't apply.
- **#27** E2E reset strategy: `docker-compose.e2e.yml` overlay with tmpfs.
- **#28** E2E driver: Playwright (Chromium only in M1). Config at `e2e/playwright.config.ts`. CI installs browsers via `pnpm exec playwright install --with-deps chromium`, cached.

## Architecture Decisions (ADR)

- **ADR-M1-017:** Full 5-layer pyramid enforced as a merge gate from M1. No "we'll add tests later." TDD discipline is sacred (per AGENTS.md). See Decision #11 and AGENTS.md → Test Discipline.
- **ADR-M1-018:** Playwright (Chromium only in M1) chosen over Cypress / WebdriverIO / native browser-driving frameworks. Playwright is the industry standard for browser E2E in 2026; WebKit + Firefox can be added later when iOS-PWA testing matters. See Decision #28.
- **ADR-M1-019:** Vitest workspace mode (per-component `vitest.config.ts` under a root `vitest.workspace.ts`) over Jest. Vitest plays better with Vite (same config root for `web_client`), runs faster, and supports both `node` and `jsdom` environments per-package via workspace mode. See Decision #23.
- **ADR-M1-020:** Branch protection is a repo-settings change, NOT a DevTask deliverable. Mentioning it here so the spec writer doesn't waste a DevTask trying to encode it in YAML. See Decision #17.

## Change Log

| Date | PR | Summary |
| ---- | -- | ------- |
| _none yet_ | _none yet_ | _none yet_ |
