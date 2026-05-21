---
status: TODO
issue: P1
pr:
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec_number: 1
devtasks_total: 2
devtasks_complete: 0
honors_decisions: [1, 5, 6, 18, 24, 2b, 26]
---

# M1 Spec 1: Workspace Bootstrap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring up a fresh PSYKL-System monorepo workspace such that a developer can clone the repo and run `pnpm install` to have a working development environment.

**Architecture:** A pnpm workspace at the repo root with `packages/shared-types` as the first member. Root contains toolchain pins (`.nvmrc`, `.npmrc`, `packageManager`), `tsconfig.base.json` for shared TypeScript config, MIT `LICENSE`, `CHANGELOG.md` with an `Unreleased` heading. `packages/shared-types` exports Zod schemas for the PSYKL `Task` entity that downstream Specs (`service-task`, `web_client`) consume via `workspace:*` to derive types, NestJS DTOs, runtime validation, and the OpenAPI document.

**Tech Stack:** pnpm 10.x (workspace tool), Node.js 24 LTS, TypeScript 5.x, Zod 3.x, `@asteasolutions/zod-to-openapi` 7.x, Vitest 2.x (for unit tests on Zod schemas).

**Reads from:** `docs/initiatives/m1-bootstrap/DESIGN.md` Decisions appendix. Decisions referenced by ID below are NORMATIVE — do not re-open.

---

## File Structure

This Spec creates these files (no modifications to existing files — the repo currently only has docs):

**Repository root (DevTask 1):**
- Create: `package.json` (~25 lines) — workspace root, `packageManager: pnpm@10.11.0`, no dependencies, no scripts beyond `pnpm -r` orchestrators
- Create: `pnpm-workspace.yaml` (~5 lines) — glob patterns for `components/*` and `packages/*`
- Create: `tsconfig.base.json` (~30 lines) — strict mode, ES2023 target, NodeNext module resolution, declaration generation enabled
- Create: `.nvmrc` (1 line) — `24`
- Create: `.npmrc` (~3 lines) — `engine-strict=true`, `auto-install-peers=true`, `strict-peer-dependencies=false`
- Create: `.gitignore` (~30 lines) — Node, TypeScript, IDE, OS, generated artifacts
- Create: `.editorconfig` (~15 lines) — UTF-8, LF line endings, 2-space indent for TS/JSON/MD, 4-space for Python if any
- Create: `LICENSE` (no extension, ~21 lines) — standard MIT text, "Copyright (c) 2026 Jonathan Pham"
- Modify: `CHANGELOG.md` (existing in repo) — verify presence of `## Unreleased` heading; if missing, add it

**`packages/shared-types/` (DevTask 2):**
- Create: `packages/shared-types/package.json` (~25 lines) — `"name": "@psykl/shared-types"`, `"type": "module"`, exports map, scripts (`build`, `lint`, `format:check`, `typecheck`, `test:unit`, `test:component`, `test:integration` stubs)
- Create: `packages/shared-types/tsconfig.json` (~10 lines) — extends `tsconfig.base.json`, `outDir: dist`, `rootDir: src`
- Create: `packages/shared-types/vitest.config.ts` (~10 lines) — Vitest config for unit tests
- Create: `packages/shared-types/src/index.ts` (~5 lines) — barrel re-exports from `schemas/`
- Create: `packages/shared-types/src/schemas/task.ts` (~40 lines) — Zod schemas (`TaskSchema`, `TaskInputSchema`, `TaskResponseSchema`) + derived TypeScript types via `z.infer`
- Create: `packages/shared-types/src/schemas/task.unit.test.ts` (~60 lines) — Vitest tests for parsing valid/invalid inputs
- Create: `packages/shared-types/src/openapi.ts` (~20 lines) — helper that registers schemas with `zod-to-openapi` and produces a `buildOpenApiDocument()` function for `service-task` to call at build time

---

## Task 1: Repository-root workspace scaffolding

**Files:**
- Create: `/Users/jp/code/psykl/package.json`
- Create: `/Users/jp/code/psykl/pnpm-workspace.yaml`
- Create: `/Users/jp/code/psykl/tsconfig.base.json`
- Create: `/Users/jp/code/psykl/.nvmrc`
- Create: `/Users/jp/code/psykl/.npmrc`
- Modify: `/Users/jp/code/psykl/.gitignore` (existing — extend, don't replace)
- Create: `/Users/jp/code/psykl/.editorconfig`
- Create: `/Users/jp/code/psykl/LICENSE` (no extension)
- Verify/extend: `/Users/jp/code/psykl/CHANGELOG.md` (existing)

- [ ] **Step 1: Verify Node 24 LTS is available**

Run: `node --version`
Expected: `v24.x.x` (any patch). If output is a different major, install Node 24 via `nvm install 24` or your system package manager, then `nvm use 24`.

- [ ] **Step 2: Enable Corepack**

Run: `corepack enable`
Expected: no output, exit code 0. (Corepack ships with Node 24; this lets the `packageManager` field auto-activate the correct pnpm version.)

- [ ] **Step 3: Create `.nvmrc`**

Run: `echo "24" > .nvmrc`
Verify: `cat .nvmrc` outputs `24`.

- [ ] **Step 4: Create `.npmrc`**

Write to `/Users/jp/code/psykl/.npmrc`:

```
engine-strict=true
auto-install-peers=true
strict-peer-dependencies=false
```

Verify: `cat .npmrc` shows the three lines.

- [ ] **Step 5: Create root `package.json`**

Write to `/Users/jp/code/psykl/package.json`:

```json
{
  "name": "psykl-system",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "PSYKL-System — time-independent planning tool around energy cycles. See docs/PRODUCT.md.",
  "license": "MIT",
  "packageManager": "pnpm@10.11.0",
  "engines": {
    "node": ">=24.0.0 <25"
  },
  "scripts": {
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "format:check": "pnpm -r format:check",
    "typecheck": "pnpm -r typecheck",
    "test:unit": "pnpm -r test:unit",
    "test:integration": "pnpm -r test:integration",
    "test:component": "pnpm -r test:component",
    "test:e2e": "echo 'e2e wired up in Spec 5' && exit 0",
    "dev": "echo 'dev orchestrator wired up after components scaffold; for now run per-component: pnpm --filter <name> dev'"
  }
}
```

- [ ] **Step 6: Create `pnpm-workspace.yaml`**

Write to `/Users/jp/code/psykl/pnpm-workspace.yaml`:

```yaml
packages:
  - "components/*"
  - "packages/*"
```

- [ ] **Step 7: Create `tsconfig.base.json`**

Write to `/Users/jp/code/psykl/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

- [ ] **Step 8: Extend `.gitignore`**

Read current `.gitignore`. Append (do NOT replace existing entries):

```
# Node / pnpm
node_modules/
*.log
.pnpm-debug.log*
.pnpm-store/

# TypeScript build output
dist/
*.tsbuildinfo

# Generated artifacts (regenerated on every build)
**/openapi.json
**/src/api/types.ts
.pglite-dev/

# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Test artifacts
coverage/
playwright-report/
test-results/
```

- [ ] **Step 9: Create `.editorconfig`**

Write to `/Users/jp/code/psykl/.editorconfig`:

```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

- [ ] **Step 10: Create `LICENSE`**

Write to `/Users/jp/code/psykl/LICENSE` (no extension):

```
MIT License

Copyright (c) 2026 Jonathan Pham

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 11: Verify `CHANGELOG.md` has `## Unreleased` heading**

Run: `grep -c "^## Unreleased" CHANGELOG.md`
Expected: `1`. If `0`, prepend the heading via:

```bash
( echo "# Changelog" ; echo "" ; echo "## Unreleased" ; echo "" ; cat CHANGELOG.md ) > CHANGELOG.md.new && mv CHANGELOG.md.new CHANGELOG.md
```

- [ ] **Step 12: Run `pnpm install`**

Run: `pnpm install`
Expected: exits 0. Creates `pnpm-lock.yaml` at repo root and a `node_modules/` directory. Should warn that `components/*` and `packages/*` glob match no packages yet — that's fine for now (DevTask 2 fixes the `packages/*` case).

- [ ] **Step 13: Verify engine-strict works**

Run: `node -e "console.log(process.versions.node)"`
Expected: `24.x.x`. If a future Node ever ships >=25, the `engines.node` constraint + `engine-strict=true` will make `pnpm install` fail — that's intentional.

- [ ] **Step 14: Commit DevTask 1**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .nvmrc .npmrc .gitignore .editorconfig LICENSE CHANGELOG.md pnpm-lock.yaml
git status   # confirm no stray files
git commit -m "infra(M1-T1): scaffold pnpm workspace with Node 24 LTS pin and MIT license"
```

Expected: commit lands on the DevTask 1 branch. Push the branch and open PR for DevTask 1.

---

## Task 2: `packages/shared-types` with Zod schemas

**Files:**
- Create: `/Users/jp/code/psykl/packages/shared-types/package.json`
- Create: `/Users/jp/code/psykl/packages/shared-types/tsconfig.json`
- Create: `/Users/jp/code/psykl/packages/shared-types/vitest.config.ts`
- Create: `/Users/jp/code/psykl/packages/shared-types/src/index.ts`
- Create: `/Users/jp/code/psykl/packages/shared-types/src/schemas/task.ts`
- Test: `/Users/jp/code/psykl/packages/shared-types/src/schemas/task.unit.test.ts`
- Create: `/Users/jp/code/psykl/packages/shared-types/src/openapi.ts`

Start DevTask 2 on a fresh branch off `main`: `git checkout main && git pull && git checkout -b chore/shared-types-zod-schemas`.

- [ ] **Step 1: Create `packages/shared-types/package.json`**

Write:

```json
{
  "name": "@psykl/shared-types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./schemas": {
      "types": "./dist/schemas/index.d.ts",
      "import": "./dist/schemas/index.js"
    },
    "./openapi": {
      "types": "./dist/openapi.d.ts",
      "import": "./dist/openapi.js"
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint . --max-warnings 0",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "echo 'no integration tests' && exit 0",
    "test:component": "echo 'no component tests' && exit 0"
  },
  "dependencies": {
    "zod": "^3.23.0",
    "@asteasolutions/zod-to-openapi": "^7.3.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create `packages/shared-types/tsconfig.json`**

Write:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 3: Create `packages/shared-types/vitest.config.ts`**

Write:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

- [ ] **Step 4: Install dependencies**

Run from repo root: `pnpm install --filter @psykl/shared-types`
Expected: installs `zod`, `@asteasolutions/zod-to-openapi`, `vitest`, `typescript` under `packages/shared-types/node_modules` (with hard links via the pnpm store).

- [ ] **Step 5: Write failing test for `TaskSchema`**

Write to `packages/shared-types/src/schemas/task.unit.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { TaskSchema, TaskInputSchema, TaskResponseSchema } from './task';

describe('TaskSchema', () => {
  it('accepts a valid Task record', () => {
    const valid = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: 'first task',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    const parsed = TaskSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it('rejects a Task with empty title', () => {
    const bad = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: '',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task with title >200 chars', () => {
    const bad = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: 'x'.repeat(201),
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task missing user_id', () => {
    const bad = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      title: 'no user',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });
});

describe('TaskInputSchema', () => {
  it('accepts a request body with only title', () => {
    const valid = { title: 'incoming task' };
    const parsed = TaskInputSchema.parse(valid);
    expect(parsed.title).toBe('incoming task');
  });

  it('rejects a request body missing title', () => {
    expect(() => TaskInputSchema.parse({})).toThrow();
  });

  it('rejects a request body with extra fields', () => {
    const bad = { title: 'x', user_id: 'spoofed' };
    expect(() => TaskInputSchema.parse(bad)).toThrow();
  });
});

describe('TaskResponseSchema', () => {
  it('is identical in shape to TaskSchema', () => {
    const valid = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: 'response shape',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(TaskResponseSchema.parse(valid)).toEqual(TaskSchema.parse(valid));
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm --filter @psykl/shared-types test:unit`
Expected: FAIL with "Cannot find module './task'" or similar import error. (Implementation does not exist yet.)

- [ ] **Step 7: Implement `task.ts` to make tests pass**

Write to `packages/shared-types/src/schemas/task.ts`:

```ts
import { z } from 'zod';

/**
 * PSYKL Task data-model entity.
 * Stored in service-task's pglite database. Identified by app-generated UUID v7.
 * `user_id` carries ownership (see DESIGN.md Premise 7 + 8).
 *
 * NOTE: this is the PSYKL data-model `Task` entity. The workflow concept "DevTask"
 * (a PR-sized unit of work) is unrelated. See AGENTS.md → Key Stages.
 */
export const TaskSchema = z
  .object({
    id: z.string().uuid().describe('UUID v7, app-generated in TaskService'),
    user_id: z.string().min(1).describe('Owner; "local" in M1/M2, real auth in M4+'),
    title: z.string().min(1).max(200).describe('User-visible task title'),
    created_at: z.string().datetime({ offset: true }).describe('ISO 8601 timestamp from the database (timestamptz)'),
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;

/**
 * Request body shape for POST /tasks. The client sends only the title;
 * id is generated server-side (UUID v7), user_id comes from the X-User-Id header
 * via the global UserIdGuard, created_at comes from the database default.
 */
export const TaskInputSchema = z
  .object({
    title: z.string().min(1).max(200),
  })
  .strict();

export type TaskInput = z.infer<typeof TaskInputSchema>;

/**
 * Response shape for POST /tasks and the individual elements of GET /tasks.
 * Identical to TaskSchema today; kept as a separate name so future
 * server-side derived fields (e.g. completed_at in M2) can extend the
 * response without breaking the persistence schema.
 */
export const TaskResponseSchema = TaskSchema;

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm --filter @psykl/shared-types test:unit`
Expected: PASS — all 9 test cases green.

- [ ] **Step 9: Create the barrel `index.ts`**

Write to `packages/shared-types/src/index.ts`:

```ts
export * from './schemas/task';
export { buildOpenApiDocument } from './openapi';
```

- [ ] **Step 10: Implement the OpenAPI builder**

Write to `packages/shared-types/src/openapi.ts`:

```ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { TaskInputSchema, TaskResponseSchema } from './schemas/task';

/**
 * Build the OpenAPI 3.1 document for service-task.
 * service-task runs this at build time and writes the result to openapi.json.
 *
 * Adding a new schema:
 *   1. Define it in src/schemas/.
 *   2. Register it here via registry.register(...).
 *   3. Register any paths that use it via registry.registerPath(...).
 *
 * Routes are defined in this builder (not in service-task controllers) so that
 * the spec is the single source of truth for the public HTTP API shape.
 */
export function buildOpenApiDocument(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  const registry = new OpenAPIRegistry();

  const taskInput = registry.register('TaskInput', TaskInputSchema);
  const taskResponse = registry.register('Task', TaskResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/tasks',
    summary: 'Create a Task',
    request: {
      headers: [
        { name: 'X-User-Id', schema: { type: 'string' }, required: true },
      ],
      body: { content: { 'application/json': { schema: taskInput } } },
    },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: taskResponse } } },
      400: { description: 'Bad request — body fails TaskInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/tasks',
    summary: 'List Tasks for the current user',
    request: {
      headers: [
        { name: 'X-User-Id', schema: { type: 'string' }, required: true },
      ],
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: { type: 'array', items: taskResponse } } },
      },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
    },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'PSYKL service-task API',
      version: '0.0.0',
      description: 'PSYKL-System service-task REST API. Generated from Zod schemas.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local dev' }],
  });
}
```

- [ ] **Step 11: Add a test that the OpenAPI document builds cleanly**

Append to `packages/shared-types/src/schemas/task.unit.test.ts` (or create `src/openapi.unit.test.ts`):

```ts
import { describe, it, expect } from 'vitest';
import { buildOpenApiDocument } from '../openapi';

describe('buildOpenApiDocument', () => {
  it('produces an OpenAPI 3.1 document with /tasks paths and Task schema', () => {
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.paths?.['/tasks']?.post).toBeDefined();
    expect(doc.paths?.['/tasks']?.get).toBeDefined();
    expect(doc.components?.schemas?.Task).toBeDefined();
    expect(doc.components?.schemas?.TaskInput).toBeDefined();
  });

  it('declares X-User-Id header as required on every endpoint', () => {
    const doc = buildOpenApiDocument();
    const postParams = (doc.paths?.['/tasks']?.post as any)?.parameters ?? [];
    const getParams = (doc.paths?.['/tasks']?.get as any)?.parameters ?? [];
    const findUserId = (params: any[]) => params.find((p: any) => p.name === 'X-User-Id');
    expect(findUserId(postParams)).toMatchObject({ required: true });
    expect(findUserId(getParams)).toMatchObject({ required: true });
  });
});
```

If the file path differs, place this in `packages/shared-types/src/openapi.unit.test.ts`.

- [ ] **Step 12: Run all unit tests**

Run: `pnpm --filter @psykl/shared-types test:unit`
Expected: PASS — all schema tests plus both OpenAPI tests green.

- [ ] **Step 13: Run typecheck**

Run: `pnpm --filter @psykl/shared-types typecheck`
Expected: PASS — no TypeScript errors.

- [ ] **Step 14: Verify package builds**

Run: `pnpm --filter @psykl/shared-types build`
Expected: PASS — `dist/` directory created with `index.js`, `schemas/task.js`, `openapi.js`, and corresponding `.d.ts` files.

- [ ] **Step 15: Commit DevTask 2**

```bash
git add packages/shared-types/ pnpm-lock.yaml
git status   # confirm only shared-types files + lockfile
git commit -m "chore(M1-T2): add packages/shared-types with Zod Task schemas and OpenAPI builder

Defines TaskSchema, TaskInputSchema, TaskResponseSchema, and a
buildOpenApiDocument() helper that service-task will call at build
to emit openapi.json. All schemas test-covered at the unit layer.

Honors DESIGN.md Decisions #2b (schema-first via Zod), #19 (UUID v7
text PK), #20 (timestamptz created_at)."
```

---

## Spec 1 Verification (after both DevTasks merge)

- [ ] **Step 1: Fresh-clone smoke test**

```bash
cd /tmp && rm -rf psykl-smoke && git clone <repo-url> psykl-smoke && cd psykl-smoke
node --version           # expect 24.x
corepack enable
pnpm install             # expect 0 errors
pnpm -r typecheck        # expect 0 errors
pnpm -r test:unit        # expect all green
pnpm -r build            # expect dist/ in packages/shared-types/
ls LICENSE CHANGELOG.md .nvmrc .npmrc .editorconfig .gitignore tsconfig.base.json pnpm-workspace.yaml package.json
```

Expected: every file listed exists; tests pass; build succeeds. No engine-mismatch errors.

- [ ] **Step 2: Update spec frontmatter on Spec close**

When DevTask 2's PR merges, set frontmatter at top of this file:
- `status: DONE`
- `completed_at: YYYY-MM-DD` (merge date)
- `devtasks_complete: 2`
- `branches:` and `prs:` lists populated

Also write the consolidating feature doc at `docs/features/[YYYYMMDD]P1_m1-workspace-bootstrap.md` summarizing the Spec's outcome (use `docs/initiatives/m1-bootstrap/issues/[20260520]P1_m1-workspace-bootstrap.md` as the starting point — promote it from the issues/ dir to the features/ dir).
