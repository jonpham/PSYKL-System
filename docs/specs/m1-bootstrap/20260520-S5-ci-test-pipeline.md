---
status: TODO
issue: P5
pr:
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec_number: 5
devtasks_total: 1
devtasks_complete: 0
honors_decisions: [11, 17, 23, 24, 27, 28]
---

# M1 Spec 5: CI test pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire GitHub Actions so every Pull Request runs the full 5-layer test pyramid before merge. Static Analysis + Unit + Integration + Component as one fast job; End-to-End (Playwright against the Docker Compose stack from Spec 4 + the E2E overlay) as a separate job. Branch protection on `main` (configured in repo settings, not code) blocks merge on any layer failing.

**Architecture:** Two GitHub Actions workflows. `ci.yml` runs lint + typecheck + format-check + per-component unit/integration/component tests in a single matrix-free job (fast feedback). `ci-e2e.yml` runs as a separate job because the E2E setup (Docker build + compose up + Playwright + browser install) is slow and not worth re-running per push if the source didn't change. Both gate `main` via required-status-checks repo settings.

**Tech Stack:** GitHub Actions, `actions/checkout@v4`, `pnpm/action-setup@v4` for the pinned pnpm 10.x, `actions/setup-node@v4` for Node 24, `actions/cache@v4` for pnpm + Playwright browsers, Playwright 1.49.x for the E2E driver, Vitest workspace mode for the lower test layers.

**Reads from:** `docs/initiatives/m1-bootstrap/DESIGN.md` Decisions appendix. Honors decisions #11 (test file locations), #17 (branch protection), #23 (Vitest workspace), #24 (pnpm script contract), #27 (E2E overlay), #28 (Playwright Chromium only in M1).

**Depends on:** Specs 1-4 must have merged.

---

## File Structure

| File                                                | Purpose                                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/Users/jp/code/psykl/.github/workflows/ci.yml`     | Lint + typecheck + format-check + Unit + Integration + Component (per-component, via pnpm -r) |
| `/Users/jp/code/psykl/.github/workflows/ci-e2e.yml` | E2E job: build compose stack, bring up with E2E overlay, run Playwright, tear down            |
| `/Users/jp/code/psykl/vitest.workspace.ts`          | Vitest workspace mode config referencing each component/package's vitest.config.ts            |
| `/Users/jp/code/psykl/e2e/package.json`             | E2E test package (Playwright deps, scripts)                                                   |
| `/Users/jp/code/psykl/e2e/playwright.config.ts`     | Playwright config: baseURL, single Chromium project, 1 retry in CI                            |
| `/Users/jp/code/psykl/e2e/m1-task-crud.e2e.spec.ts` | E2E test: open PWA, create task, see it in list                                               |
| `/Users/jp/code/psykl/e2e/tsconfig.json`            | TS config for e2e/                                                                            |

---

## Task 8: CI workflows + Playwright config + first E2E spec

Start DevTask 8 on a branch off `main`: `git checkout main && git pull && git checkout -b infra/ci-test-pipeline`.

- [x] **Step 1: Add `vitest.workspace.ts` at repo root**

Write `/Users/jp/code/psykl/vitest.workspace.ts`:

```ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/shared-types/vitest.config.ts',
  './components/service-task/vitest.config.ts',
  './components/web_client/vitest.config.ts',
]);
```

- [x] **Step 2: Update root `package.json` test scripts to use workspace mode where applicable**

Modify root `package.json`'s `scripts` section. Replace the test scripts with:

```json
"test:unit": "vitest run --reporter=verbose --include='**/*.unit.test.{ts,tsx}'",
"test:integration": "vitest run --reporter=verbose --include='**/tests/integration/**/*.integration.test.ts'",
"test:component": "vitest run --reporter=verbose --include='**/*.contract.test.ts' --include='**/*.component.test.tsx'",
"test:e2e": "pnpm --filter @psykl/e2e test"
```

(Vitest with workspace + an `--include` pattern will fan out across all configured packages.)

- [x] **Step 3: Create `e2e/package.json`**

```json
{
  "name": "@psykl/e2e",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:install-browsers": "playwright install --with-deps chromium",
    "lint": "eslint . --max-warnings 0",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [x] **Step 4: Add `e2e/` to `pnpm-workspace.yaml`**

Modify `/Users/jp/code/psykl/pnpm-workspace.yaml`:

```yaml
packages:
  - 'components/*'
  - 'packages/*'
  - 'e2e'
```

- [x] **Step 5: Install Playwright**

Run: `pnpm install`. Then: `pnpm --filter @psykl/e2e test:install-browsers` (locally; CI caches this).

- [x] **Step 6: Create `e2e/tsconfig.json`**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": false,
    "noEmit": true,
    "types": ["@playwright/test", "node"]
  },
  "include": ["**/*.ts", "**/*.spec.ts"]
}
```

- [x] **Step 7: Create `e2e/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:5173';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [x] **Step 8: Write the failing E2E spec**

Write `e2e/m1-task-crud.e2e.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('M1: PSYKL Task CRUD via PWA', () => {
  test('user creates a task and sees it in the list', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'PSYKL' })).toBeVisible();
    await expect(page.getByText(/no tasks yet/i)).toBeVisible();

    const title = `e2e task ${Date.now()}`;
    await page.getByRole('textbox', { name: /title/i }).fill(title);
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(/no tasks yet/i)).not.toBeVisible();
  });

  test('multiple tasks render in order', async ({ page }) => {
    await page.goto('/');
    const titles = [`first ${Date.now()}`, `second ${Date.now()}`, `third ${Date.now()}`];
    for (const title of titles) {
      await page.getByRole('textbox', { name: /title/i }).fill(title);
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText(title)).toBeVisible();
    }
    // All three present
    for (const title of titles) {
      await expect(page.getByText(title)).toBeVisible();
    }
  });
});
```

- [x] **Step 9: Verify the E2E spec passes locally against the running stack**

```bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build
sleep 15
pnpm --filter @psykl/e2e test
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down
```

Expected: both tests pass. If they fail because the PWA can't reach service-task: check that the web_client container's nginx serves the SPA correctly and the `VITE_API_URL` was baked into the build (default `http://localhost:3000` should work from a host browser, since both ports are exposed on host).

- [x] **Step 10: Create `.github/workflows/ci.yml`**

Write `/Users/jp/code/psykl/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main, 'spec/**']

jobs:
  static-checking:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      # Shared Node/pnpm/cache/dependency setup omitted for brevity.
      - run: pnpm verify:prepare
      - run: pnpm verify:static

  unit-tests:
    needs: static-checking
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      # Shared Node/pnpm/cache/dependency setup omitted for brevity.
      - run: pnpm verify:prepare
      - run: pnpm verify:unit

  integration-tests:
    needs: static-checking
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      # Shared Node/pnpm/cache/dependency setup omitted for brevity.
      - run: pnpm verify:prepare
      - run: pnpm verify:integration

  component-tests:
    needs: static-checking
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      # Shared Node/pnpm/cache/dependency setup omitted for brevity.
      - run: pnpm verify:component:install-browsers
      - run: pnpm verify:prepare
      - run: pnpm verify:component
```

- [x] **Step 11: Create `.github/workflows/ci-e2e.yml`**

```yaml
name: CI E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main, 'spec/**']

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v4
      # Shared Node/pnpm/cache/dependency setup omitted for brevity.
      - run: pnpm verify:e2e:install-browsers
      - run: pnpm verify:e2e:up
      - run: pnpm verify:e2e:wait
      - run: pnpm verify:e2e
      - if: failure()
        run: pnpm verify:e2e:logs
      - if: always()
        run: pnpm verify:e2e:down
```

- [x] **Step 12: Commit and push DevTask 8 (open the PR to verify CI runs)**

```bash
git add .github/workflows/ .claude/settings.json README.md docs/PROJECT_STATUS.md docs/specs/m1-bootstrap/20260520-S5-ci-test-pipeline.md package.json pnpm-workspace.yaml vitest.workspace.ts e2e/ scripts/
git commit -m "infra(M1-T8): CI workflows for full 5-layer test pyramid + Playwright E2E

ci.yml runs Static Analysis (lint + format:check + typecheck) +
Unit + Integration + Component layers on every PR.

ci-e2e.yml builds the Docker Compose stack with the E2E overlay
(tmpfs pglite per Decision #27), brings up the services, runs
Playwright against the live PWA (per Decision #28: Chromium only
in M1), and tears down. Playwright reports uploaded on failure.

Honors Decisions #11, #23, #24, #27, #28.

Branch protection on main (Decision #17) is a one-time repo-settings
change, not a deliverable of this DevTask. Required status checks
to add manually after merge: 'CI / static-checking', 'CI / unit-tests',
'CI / integration-tests', 'CI / component-tests', and 'CI E2E / e2e'."
```

Push and open a PR. Confirm both workflows trigger and run to green. (The first E2E run will be slow because of the browser install — subsequent runs benefit from the cache.)

- [ ] **Step 13: Configure branch protection (one-time, manual, after CI is green)**

After the DevTask 8 PR merges and CI has run at least once on `main`:

1. Go to `https://github.com/jonpham/PSYKL-System/settings/branches`.
2. Under "Branch protection rules", click "Add branch protection rule".
3. Branch name pattern: `main`.
4. Check: "Require a pull request before merging", "Require approvals" (set to 1), "Require status checks to pass before merging".
5. Under "Status checks that are required", add: `CI / static-checking`, `CI / unit-tests`, `CI / integration-tests`, `CI / component-tests`, and `CI E2E / e2e`.
6. Check: "Require linear history".
7. Uncheck: "Allow force pushes".
8. Save.

Add a note to `CONTRIBUTING.md` (or `README.md`'s "Development" section) referencing this manual step so future contributors know.

- [ ] **Step 14: Verify branch protection blocks a failing PR**

Open a throwaway PR that intentionally breaks a test (e.g., change an assertion in `task.service.unit.test.ts` to fail). Confirm:

- CI workflow runs, fails on the broken assertion.
- The "Merge pull request" button is disabled with "Required statuses must pass before merging."
- Revert the change; CI re-runs; merge button enables.

---

## Spec 5 Verification (after DevTask 8 merges + branch protection configured)

- [ ] **Step 1: End-to-end CI smoke**

- Open a PR that touches `components/web_client/src/App.tsx` (any harmless change like a comment).
- Confirm both workflows trigger automatically.
- Confirm CI runs all 5 layers, all green.
- Confirm merge is blocked until both checks pass.

- [ ] **Step 2: Close out the Spec**

Set frontmatter `status: DONE`, `devtasks_complete: 1`, populate branch/PR lists. Promote `docs/initiatives/m1-bootstrap/issues/[20260520]P5_m1-ci-test-pipeline.md` to `docs/features/`.
