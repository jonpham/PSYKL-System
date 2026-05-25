---
status: DONE
issue: P2
branches:
  - infra/service-task-drizzle-schema
  - feat/service-task-nestjs-handlers
  - feat/service-task-user-id-guard-and-openapi
  - feat/service-task-static-analysis
prs:
  - https://github.com/jonpham/PSYKL-System/pull/12
  - https://github.com/jonpham/PSYKL-System/pull/14
  - https://github.com/jonpham/PSYKL-System/pull/15
  - https://github.com/jonpham/PSYKL-System/pull/16
completed_at: 2026-05-25
created_at: 2026-05-20
initiative: m1-bootstrap
spec_number: 2
devtasks_total: 4
devtasks_complete: 4
honors_decisions: [2, 2b, 4, 8, 13, 19, 20, 24, 25, 29, 31, 32]
---

# M1 Spec 2: service-task minimal API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a NestJS service exposing `POST /tasks` and `GET /tasks`, persisting PSYKL `Task` records to pglite via Drizzle, with a global `UserIdGuard` enforcing the default-deny `X-User-Id` posture and an emitted OpenAPI document derived from the Zod schemas in `packages/shared-types`.

**Architecture:** NestJS app with a single `TaskModule`. `TaskService` uses Drizzle ORM against pglite (in-process PostgreSQL via WebAssembly). Zod schemas from `packages/shared-types` are wired as DTOs via `nestjs-zod`. The OpenAPI document is emitted at build time by a `build:openapi` script that calls `packages/shared-types`'s `buildOpenApiDocument()` and writes the JSON to `components/service-task/openapi.json` (gitignored; regenerated on every build). The `UserIdGuard` is registered globally via `app.useGlobalGuards()` so adding a route without going through it is impossible by construction.

**Tech Stack:** NestJS 11.x, Drizzle ORM 0.36.x with `drizzle-orm/pglite`, `@electric-sql/pglite` 0.2.x, `nestjs-zod` 4.x, `uuid` 11.x (v7 IDs), Vitest 2.x, supertest 7.x (for Component contract tests against the in-process HTTP layer).

**Reads from:** `docs/initiatives/m1-bootstrap/DESIGN.md` Decisions appendix. Honors decisions #2 (NestJS), #2b (Zod schema-first), #4 (Drizzle), #8 (pglite), #13 (Drizzle directory layout), #19 (UUID v7), #20 (timestamptz + DB default), #24 (pnpm script contract), #25 (PGLITE_DATA_DIR env), #29 (CORS allowed headers), #31 (text column for id), #32 (node:24-bookworm-slim — applies in Spec 4's Dockerfile).

**Execution order:** DevTask 4 (Drizzle + schema + migration) lands FIRST so DevTask 3a's TaskService has real persistence to test against. Original global numbering (3a → 3b → 4) retained for cross-doc consistency; execution order is 4 → 3a → 3b. DevTask 3c was added during execution to close the Static Analysis gap before Spec 5 CI consumes `lint` and `format:check`.

---

## File Structure

**`components/service-task/` (created from scratch):**

| File | Purpose | DevTask |
|------|---------|---------|
| `package.json` | NestJS app, scripts, deps | 4 (initial), 3a (more deps) |
| `tsconfig.json` | Extends repo root `tsconfig.base.json`, NestJS overrides | 4 |
| `nest-cli.json` | NestJS CLI config | 3a |
| `vitest.config.ts` | Vitest config: `node` env, glob unit + integration + contract test patterns | 4 (initial), refined in 3a/3b |
| `drizzle.config.ts` | drizzle-kit config: dialect=postgresql, schema path, out path | 4 |
| `src/db/schema/task.ts` | Drizzle `pgTable` definition for the PSYKL `Task` table | 4 |
| `src/db/schema/index.ts` | Barrel re-export of schema tables | 4 |
| `src/db/index.ts` | Drizzle client factory reading `PGLITE_DATA_DIR` env | 4 |
| `drizzle/migrations/0000_initial.sql` | Generated migration creating the `tasks` table | 4 |
| `drizzle/migrations/meta/_journal.json` | Migration journal | 4 |
| `tests/integration/task-crud.integration.test.ts` | Integration test: Drizzle + in-memory pglite end-to-end CRUD on the `tasks` table | 4 |
| `src/main.ts` | NestJS bootstrap | 3a (initial), 3b (global guard) |
| `src/app.module.ts` | Root NestJS module importing `TaskModule` | 3a |
| `src/task/task.module.ts` | NestJS module wiring controller + service | 3a |
| `src/task/task.controller.ts` | REST handlers (`POST /tasks`, `GET /tasks`) with `nestjs-zod` DTOs | 3a |
| `src/task/task.service.ts` | Business logic: UUID v7 id generation, Drizzle calls | 3a |
| `src/task/task.service.unit.test.ts` | Unit tests for `TaskService` (id generation, query shape) | 3a |
| `src/auth/user-id.guard.ts` | NestJS Guard reading `X-User-Id` header, attaching to request | 3b |
| `src/auth/user-id.guard.contract.test.ts` | Component-layer contract test: default-deny on missing/malformed header | 3b |
| `src/task/task.controller.contract.test.ts` | Component-layer contract test: positive paths against in-process HTTP | 3b |
| `scripts/build-openapi.ts` | Script that calls `buildOpenApiDocument()` from `@psykl/shared-types` and writes `openapi.json` | 3b |

---

## Task 4: Drizzle schema, initial migration, pglite client

**Files:**
- Create: `/Users/jp/code/psykl/components/service-task/package.json`
- Create: `/Users/jp/code/psykl/components/service-task/tsconfig.json`
- Create: `/Users/jp/code/psykl/components/service-task/vitest.config.ts`
- Create: `/Users/jp/code/psykl/components/service-task/drizzle.config.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/db/schema/task.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/db/schema/index.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/db/index.ts`
- Create: `/Users/jp/code/psykl/components/service-task/drizzle/migrations/0000_initial.sql` (generated)
- Test: `/Users/jp/code/psykl/components/service-task/tests/integration/task-crud.integration.test.ts`

Start DevTask 4 on a fresh branch off `main`: `git checkout main && git pull && git checkout -b infra/service-task-drizzle-schema`.

- [x] **Step 1: Create `package.json`**

Write to `components/service-task/package.json`:

```json
{
  "name": "@psykl/service-task",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "build:openapi": "tsx scripts/build-openapi.ts > openapi.json",
    "dev": "tsx watch src/main.ts",
    "start": "node dist/main.js",
    "lint": "eslint . --max-warnings 0",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --reporter=verbose src/**/*.unit.test.ts",
    "test:integration": "vitest run --reporter=verbose tests/integration",
    "test:component": "vitest run --reporter=verbose src/**/*.contract.test.ts",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@psykl/shared-types": "workspace:*",
    "@electric-sql/pglite": "^0.2.0",
    "drizzle-orm": "^0.36.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0"
  }
}
```

- [x] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts", "tests/**/*.ts", "drizzle.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

(Note: `verbatimModuleSyntax: false` overrides the base for NestJS decorator compat; `experimentalDecorators` + `emitDecoratorMetadata` are required by NestJS.)

- [x] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.unit.test.ts',
      'src/**/*.contract.test.ts',
      'tests/integration/**/*.integration.test.ts',
    ],
    testTimeout: 30_000, // pglite WASM init can take a few seconds
  },
});
```

- [x] **Step 4: Create `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  // pglite uses Postgres SQL dialect; drizzle-kit generates standard Postgres migrations.
});
```

- [x] **Step 5: Install dependencies**

Run from repo root: `pnpm install`
Expected: installs all deps under `components/service-task/node_modules`.

- [x] **Step 6: Create the Drizzle schema files**

Write `components/service-task/src/db/schema/task.ts`:

```ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * PSYKL Task table.
 *
 * Honors DESIGN.md:
 *   - Decision #19: id is text (UUID v7 generated app-side in TaskService).
 *   - Decision #20: created_at is timestamptz with DB default now().
 *   - Decision #31: text column type (not uuid) for type-portability + no pgcrypto.
 *   - Premise 7:   user_id on every row; service guard enforces ownership.
 */
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TaskRow = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
```

Write `components/service-task/src/db/schema/index.ts`:

```ts
export * from './task';
```

- [x] **Step 7: Create the Drizzle client factory**

Write `components/service-task/src/db/index.ts`:

```ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema';

/**
 * Build a Drizzle client backed by pglite (in-process PostgreSQL via WebAssembly).
 *
 * Honors Decision #25:
 *   - process.env.PGLITE_DATA_DIR set (e.g. /var/lib/psykl/pglite in production
 *     Docker, ./.pglite-dev in local non-Docker dev): filesystem-backed persistence.
 *   - process.env.PGLITE_DATA_DIR unset: in-memory mode (used by integration tests).
 */
export type Db = ReturnType<typeof drizzle<typeof schema>>;

export async function createDb(): Promise<Db> {
  const dataDir = process.env.PGLITE_DATA_DIR;
  const pglite = dataDir ? new PGlite(dataDir) : new PGlite();
  await pglite.waitReady;
  const db = drizzle(pglite, { schema });
  // Apply pending migrations on every boot. drizzle/migrations is checked into git.
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  return db;
}

export { schema };
```

- [x] **Step 8: Generate the initial migration**

Run: `pnpm --filter @psykl/service-task db:generate`
Expected: drizzle-kit produces `drizzle/migrations/0000_<random_slug>.sql` and updates `drizzle/migrations/meta/_journal.json`. Inspect the SQL — it should create a `tasks` table with `id text PRIMARY KEY`, `user_id text NOT NULL`, `title text NOT NULL`, `created_at timestamp with time zone NOT NULL DEFAULT now()`.

If the migration filename uses a non-deterministic suffix, rename to `0000_initial.sql` for stability (and update `_journal.json` accordingly).

- [x] **Step 9: Write failing integration test**

Write `components/service-task/tests/integration/task-crud.integration.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { createDb, schema, type Db } from '../../src/db';
import { eq } from 'drizzle-orm';

describe('Drizzle + pglite Task CRUD', () => {
  let db: Db;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR; // force in-memory mode
    db = await createDb();
  });

  it('inserts a Task and reads it back', async () => {
    const id = uuidv7();
    await db.insert(schema.tasks).values({
      id,
      userId: 'local',
      title: 'integration test task',
    });

    const rows = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      userId: 'local',
      title: 'integration test task',
    });
    expect(rows[0]!.createdAt).toBeInstanceOf(Date);
  });

  it('lists Tasks scoped to a user_id', async () => {
    await db.insert(schema.tasks).values([
      { id: uuidv7(), userId: 'alice', title: 'alice 1' },
      { id: uuidv7(), userId: 'alice', title: 'alice 2' },
      { id: uuidv7(), userId: 'bob', title: 'bob 1' },
    ]);

    const aliceRows = await db.select().from(schema.tasks).where(eq(schema.tasks.userId, 'alice'));
    const aliceTitles = aliceRows.map((r) => r.title).sort();
    expect(aliceTitles).toEqual(expect.arrayContaining(['alice 1', 'alice 2']));
    expect(aliceTitles).not.toContain('bob 1');
  });

  it('applies the timestamptz default now() when no createdAt is supplied', async () => {
    const id = uuidv7();
    const before = new Date();
    await db.insert(schema.tasks).values({ id, userId: 'local', title: 'default ts' });
    const [row] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    const after = new Date();
    expect(row!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(row!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});
```

- [x] **Step 10: Run the integration test to verify it fails (or passes if Drizzle infra is correct)**

Run: `pnpm --filter @psykl/service-task test:integration`
Expected: PASS — if migration is correctly checked into `drizzle/migrations`, the test will boot pglite in memory, apply migrations, and the CRUD tests will pass.

If it FAILS with "relation 'tasks' does not exist": the migration generated in Step 8 wasn't applied; check `drizzle/migrations/_journal.json` references the right file and the SQL contents are correct. Fix and re-run.

- [x] **Step 11: Verify typecheck**

Run: `pnpm --filter @psykl/service-task typecheck`
Expected: PASS — zero TypeScript errors.

- [x] **Step 12: Commit DevTask 4**

```bash
git add components/service-task/ pnpm-lock.yaml
git commit -m "infra(M1-T4): service-task Drizzle schema + pglite client + initial migration

Sets up the persistence tier of service-task: Drizzle ORM against pglite
(in-process PostgreSQL via WebAssembly). Schema defines the PSYKL Task table
per DESIGN.md Decisions #13/19/20/31. The createDb() factory reads PGLITE_DATA_DIR
env and applies migrations on boot.

Integration tests cover end-to-end CRUD with in-memory pglite."
```

Push and open PR. After merge, continue.

---

## Task 3a: NestJS handlers + module wiring

**Files (added on top of DevTask 4):**
- Create: `/Users/jp/code/psykl/components/service-task/nest-cli.json`
- Create: `/Users/jp/code/psykl/components/service-task/src/main.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/app.module.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/task/task.module.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/task/task.controller.ts`
- Create: `/Users/jp/code/psykl/components/service-task/src/task/task.service.ts`
- Test: `/Users/jp/code/psykl/components/service-task/src/task/task.service.unit.test.ts`
- Modify: `/Users/jp/code/psykl/components/service-task/package.json` (add NestJS deps)

Start DevTask 3a on a fresh branch off `main`: `git checkout main && git pull && git checkout -b feat/service-task-nestjs-handlers`.

- [x] **Step 1: Add NestJS dependencies**

Append to `components/service-task/package.json` `dependencies`:

```json
"@nestjs/common": "^11.0.0",
"@nestjs/core": "^11.0.0",
"@nestjs/platform-express": "^11.0.0",
"nestjs-zod": "^4.3.0",
"reflect-metadata": "^0.2.0",
"rxjs": "^7.8.0"
```

Append to `devDependencies`:

```json
"@nestjs/testing": "^11.0.0",
"supertest": "^7.0.0",
"@types/supertest": "^6.0.0"
```

Run: `pnpm install`

- [x] **Step 2: Create `nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [x] **Step 3: Write failing unit tests for `TaskService`**

Write `components/service-task/src/task/task.service.unit.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from './task.service';
import type { Db } from '../db';
import { schema } from '../db';

describe('TaskService', () => {
  let mockDb: any;
  let service: TaskService;

  beforeEach(() => {
    // Minimal Drizzle stub for unit tests — service-shape verification only.
    // Integration tests in DevTask 4 + Contract tests in DevTask 3b cover real DB.
    mockDb = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ returning: vi.fn(async () => [{ id: 'mock-id', userId: 'local', title: 'mock', createdAt: new Date() }]) })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => []),
        })),
      })),
    } as unknown as Db;
    service = new TaskService(mockDb);
  });

  it('generates a UUID v7 id when creating a Task', async () => {
    const created = await service.createTask('local', { title: 'hello' });
    expect(created.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('passes the user_id from the guard, not from the request body', async () => {
    await service.createTask('local', { title: 'hello' });
    const insertCall = (mockDb.insert as any).mock.calls[0][0];
    const valuesCall = (mockDb.insert as any).mock.results[0].value.values.mock.calls[0][0];
    expect(valuesCall.userId).toBe('local');
  });

  it('lists tasks scoped to user_id', async () => {
    await service.listTasks('alice');
    expect(mockDb.select).toHaveBeenCalled();
    // verify .where was called (user-id filter present)
    const fromResult = (mockDb.select as any).mock.results[0].value.from.mock.results[0].value;
    expect(fromResult.where).toHaveBeenCalled();
  });
});
```

- [x] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @psykl/service-task test:unit`
Expected: FAIL with "Cannot find module './task.service'" — the file doesn't exist yet.

- [x] **Step 5: Implement `TaskService`**

Write `components/service-task/src/task/task.service.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { TaskInput, TaskResponse } from '@psykl/shared-types';
import { schema, type Db } from '../db';

export const DB_TOKEN = Symbol('DB');

@Injectable()
export class TaskService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  /**
   * Create a Task owned by the given userId.
   * userId comes from the global UserIdGuard's request augmentation (DevTask 3b),
   * NOT from the request body.
   * id is generated as UUID v7 (Decision #19).
   * createdAt is set by the database default (Decision #20).
   */
  async createTask(userId: string, input: TaskInput): Promise<TaskResponse> {
    const id = uuidv7();
    const [row] = await this.db
      .insert(schema.tasks)
      .values({ id, userId, title: input.title })
      .returning();
    if (!row) throw new Error('Insert returned no row');
    return {
      id: row.id,
      user_id: row.userId,
      title: row.title,
      created_at: row.createdAt.toISOString(),
    };
  }

  /** List Tasks owned by userId. */
  async listTasks(userId: string): Promise<TaskResponse[]> {
    const rows = await this.db.select().from(schema.tasks).where(eq(schema.tasks.userId, userId));
    return rows.map((row) => ({
      id: row.id,
      user_id: row.userId,
      title: row.title,
      created_at: row.createdAt.toISOString(),
    }));
  }
}
```

- [x] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @psykl/service-task test:unit`
Expected: PASS — all 3 TaskService unit tests green.

- [x] **Step 7: Create the `TaskController`**

Write `components/service-task/src/task/task.controller.ts`:

```ts
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { TaskInputSchema, type TaskInput, type TaskResponse } from '@psykl/shared-types';
import { TaskService } from './task.service';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  userId?: string;
}

@Controller('tasks')
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(TaskInputSchema)) body: TaskInput,
  ): Promise<TaskResponse> {
    // userId is attached to req by UserIdGuard (DevTask 3b); guard guarantees presence.
    return this.tasks.createTask(req.userId!, body);
  }

  @Get()
  async list(@Req() req: RequestWithUser): Promise<TaskResponse[]> {
    return this.tasks.listTasks(req.userId!);
  }
}
```

- [x] **Step 8: Wire the module**

Write `components/service-task/src/task/task.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService, DB_TOKEN } from './task.service';
import { createDb } from '../db';

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    {
      provide: DB_TOKEN,
      useFactory: async () => createDb(),
    },
  ],
  exports: [TaskService],
})
export class TaskModule {}
```

Write `components/service-task/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TaskModule } from './task/task.module';

@Module({
  imports: [TaskModule],
})
export class AppModule {}
```

Write `components/service-task/src/main.ts`:

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'X-User-Id'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  // UserIdGuard wired globally in DevTask 3b.
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`service-task listening on http://0.0.0.0:${port}`);
}
bootstrap();
```

- [x] **Step 9: Run typecheck**

Run: `pnpm --filter @psykl/service-task typecheck`
Expected: PASS.

- [x] **Step 10: Smoke-run the dev server (without the guard — DevTask 3b adds it)**

Run: `pnpm --filter @psykl/service-task dev`
Expected: logs `service-task listening on http://0.0.0.0:3000` and pglite init logs.

In another terminal, run:

```bash
curl -s -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"smoke test"}'
```

Expected: a JSON response with `id`, `user_id` (`undefined` since guard isn't wired yet — will be `local` after DevTask 3b), `title`, `created_at`. This confirms the wiring; DevTask 3b will add proper auth and break this curl until the header is included.

Stop the dev server (Ctrl-C).

- [x] **Step 11: Commit DevTask 3a**

```bash
git add components/service-task/ pnpm-lock.yaml
git commit -m "feat(M1-T3a): service-task NestJS minimal API handlers + module wiring

Adds TaskController (POST/GET /tasks), TaskService (UUID v7 generation,
Drizzle inserts/selects), TaskModule, AppModule, main.ts bootstrap.
CORS configured with X-User-Id allowed header per Decision #29.

Unit tests cover TaskService id-generation and user-id scoping.

UserIdGuard + Component contract tests land in DevTask 3b."
```

Push, open PR, merge.

---

## Task 3b: Global `UserIdGuard`, OpenAPI emission, Component contract tests

**Files (added on top of DevTasks 4 + 3a):**
- Create: `/Users/jp/code/psykl/components/service-task/src/auth/user-id.guard.ts`
- Test: `/Users/jp/code/psykl/components/service-task/src/auth/user-id.guard.contract.test.ts`
- Test: `/Users/jp/code/psykl/components/service-task/src/task/task.controller.contract.test.ts`
- Create: `/Users/jp/code/psykl/components/service-task/scripts/build-openapi.ts`
- Modify: `/Users/jp/code/psykl/components/service-task/src/main.ts` (register global guard)

Start DevTask 3b on a fresh branch off `main`: `git checkout main && git pull && git checkout -b feat/service-task-user-id-guard-and-openapi`.

- [x] **Step 1: Write failing contract test for `UserIdGuard`**

Write `components/service-task/src/auth/user-id.guard.contract.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { UserIdGuard } from './user-id.guard';

describe('UserIdGuard (Component-layer contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new UserIdGuard());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects POST /tasks with no X-User-Id header (401)', async () => {
    await request(app.getHttpServer()).post('/tasks').send({ title: 'x' }).expect(401);
  });

  it('rejects GET /tasks with no X-User-Id header (401)', async () => {
    await request(app.getHttpServer()).get('/tasks').expect(401);
  });

  it('rejects POST /tasks with empty X-User-Id header (403)', async () => {
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', '').send({ title: 'x' }).expect(403);
  });

  it('rejects POST /tasks with whitespace-only X-User-Id (403)', async () => {
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', '   ').send({ title: 'x' }).expect(403);
  });
});
```

- [x] **Step 2: Run the contract test to verify it fails**

Run: `pnpm --filter @psykl/service-task test:component`
Expected: FAIL — "Cannot find module './user-id.guard'".

- [x] **Step 3: Implement `UserIdGuard`**

Write `components/service-task/src/auth/user-id.guard.ts`:

```ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  userId?: string;
}

/**
 * Global guard enforcing the X-User-Id header on every request.
 *
 * Honors DESIGN.md:
 *   - Premise 7: every request carries user_id; default-deny if missing.
 *   - Premise 8: user_id ownership IS the entire authorization model.
 *   - Decision #29: header name X-User-Id; allowed in CORS preflight.
 *
 * 401 (Unauthorized): header absent.
 * 403 (Forbidden):    header present but empty/whitespace.
 */
@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const raw = req.headers['x-user-id'];
    if (raw === undefined) {
      throw new UnauthorizedException('Missing X-User-Id header');
    }
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ForbiddenException('Malformed X-User-Id header');
    }
    req.userId = value.trim();
    return true;
  }
}
```

- [x] **Step 4: Register the guard globally**

Modify `components/service-task/src/main.ts`. Replace the bootstrap function with:

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserIdGuard } from './auth/user-id.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    allowedHeaders: ['Content-Type', 'X-User-Id'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalGuards(new UserIdGuard());
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`service-task listening on http://0.0.0.0:${port}`);
}
bootstrap();
```

- [x] **Step 5: Run the contract test to verify it passes**

Run: `pnpm --filter @psykl/service-task test:component`
Expected: PASS — all 4 UserIdGuard contract tests green.

- [x] **Step 6: Write controller contract tests (positive paths)**

Write `components/service-task/src/task/task.controller.contract.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { UserIdGuard } from '../auth/user-id.guard';

describe('TaskController contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.PGLITE_DATA_DIR;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new UserIdGuard());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks with valid body returns 201 and the persisted record', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .set('Content-Type', 'application/json')
      .send({ title: 'first task' })
      .expect(201);

    expect(res.body).toMatchObject({
      user_id: 'local',
      title: 'first task',
    });
    expect(res.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(typeof res.body.created_at).toBe('string');
  });

  it('POST /tasks with empty title returns 400', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ title: '' })
      .expect(400);
  });

  it('POST /tasks with extra fields returns 400 (strict schema)', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('X-User-Id', 'local')
      .send({ title: 'x', user_id: 'spoofed' })
      .expect(400);
  });

  it('GET /tasks returns 200 and only the current user_id tasks', async () => {
    // seed: alice has 2 tasks, bob has 1
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', 'alice').send({ title: 'a1' }).expect(201);
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', 'alice').send({ title: 'a2' }).expect(201);
    await request(app.getHttpServer()).post('/tasks').set('X-User-Id', 'bob').send({ title: 'b1' }).expect(201);

    const aliceRes = await request(app.getHttpServer()).get('/tasks').set('X-User-Id', 'alice').expect(200);
    const aliceTitles = (aliceRes.body as Array<{ title: string }>).map((t) => t.title).sort();
    expect(aliceTitles).toEqual(expect.arrayContaining(['a1', 'a2']));
    expect(aliceTitles).not.toContain('b1');
  });
});
```

- [x] **Step 7: Run contract tests**

Run: `pnpm --filter @psykl/service-task test:component`
Expected: PASS — all UserIdGuard + TaskController contract tests green.

- [x] **Step 8: Write the OpenAPI build script**

Write `components/service-task/scripts/build-openapi.ts`:

```ts
import { buildOpenApiDocument } from '@psykl/shared-types';

/**
 * Emit the OpenAPI document by calling the builder from @psykl/shared-types.
 * Output goes to stdout; package.json's `build:openapi` script redirects to openapi.json.
 *
 * Honors Decision #12: emitted artifact at components/service-task/openapi.json (gitignored).
 */
const doc = buildOpenApiDocument();
process.stdout.write(JSON.stringify(doc, null, 2));
```

- [x] **Step 9: Run the OpenAPI emission**

Run: `pnpm --filter @psykl/service-task build:openapi`
Expected: creates `components/service-task/openapi.json`. Inspect with `cat components/service-task/openapi.json | jq '.paths | keys'`. Should output `["/tasks"]`. Check `cat components/service-task/openapi.json | jq '.components.schemas | keys'` — should show `["Task", "TaskInput"]`.

- [x] **Step 10: Verify `.gitignore` is excluding the emitted artifact**

Run: `git check-ignore components/service-task/openapi.json && echo "IGNORED" || echo "NOT IGNORED"`
Expected: `IGNORED` (the root `.gitignore` from DevTask 1 has `**/openapi.json`).

- [x] **Step 11: Manual end-to-end smoke test**

Run: `pnpm --filter @psykl/service-task dev`. In another terminal:

```bash
# Missing header → 401
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tasks
# Expected: 401

# Empty header → 403
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tasks -H "X-User-Id: "
# Expected: 403

# Valid header, GET empty → 200 []
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
# Expected: []

# Valid header, POST → 201
curl -s -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "X-User-Id: local" \
  -d '{"title":"smoke"}'
# Expected: JSON with id (UUID v7), user_id: "local", title: "smoke", created_at: ISO string

# GET again → 200 with the task
curl -s http://localhost:3000/tasks -H "X-User-Id: local"
# Expected: [ { ...the task from above... } ]
```

Stop the dev server.

- [x] **Step 12: Commit DevTask 3b**

```bash
git add components/service-task/
git commit -m "feat(M1-T3b): service-task global UserIdGuard + OpenAPI emission + contract tests

Adds UserIdGuard (default-deny on missing/malformed X-User-Id header,
registered globally via app.useGlobalGuards), Component-layer contract
tests for both the guard's negative paths and TaskController's positive
paths, and a build:openapi script that emits openapi.json from
@psykl/shared-types' buildOpenApiDocument() helper.

The emitted openapi.json is gitignored per Decision #12.
Honors Decisions #2b, #29, #2 + Premise 7."
```

Push, open PR, merge.

---

## Task 3c: ESLint + Prettier static analysis

**Files (added on top of DevTasks 4 + 3a + 3b):**
- Create: `/Users/jp/code/psykl/eslint.config.js`
- Create: `/Users/jp/code/psykl/prettier.config.js`
- Create: `/Users/jp/code/psykl/.prettierignore`
- Modify: `/Users/jp/code/psykl/package.json` (add shared static-analysis dev dependencies)
- Modify: `/Users/jp/code/psykl/components/service-task/package.json` (make `format:check` use the root ignore file)
- Modify: `/Users/jp/code/psykl/packages/shared-types/package.json` (make `format:check` use the root ignore file)
- Format: existing `service-task` and `shared-types` files that fail the new Prettier check

Start DevTask 3c on a branch stacked on `feat/service-task-user-id-guard-and-openapi`: `git checkout -b feat/service-task-static-analysis`.

- [x] **Step 1: Verify existing static-analysis scripts fail**

Run: `pnpm --filter @psykl/service-task lint`, `pnpm --filter @psykl/service-task format:check`, `pnpm --filter @psykl/shared-types lint`, and `pnpm --filter @psykl/shared-types format:check`.
Expected before implementation: FAIL because `eslint` and `prettier` are not installed/configured.

- [x] **Step 2: Add ESLint + Prettier dependencies and root configs**

Install root dev dependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, and `globals`.
Add root `eslint.config.js`, `prettier.config.js`, and `.prettierignore`.

- [x] **Step 3: Run lint and format checks**

Run package-level and recursive checks. Format existing files where required.
Expected: `pnpm -r lint` and `pnpm -r format:check` both PASS.

- [x] **Step 4: Run regression verification**

Run service unit, integration, component, typecheck, build, and OpenAPI generation.
Expected: PASS.

- [x] **Step 5: Commit DevTask 3c**

Commit as a stacked PR after DevTask 3b.

---

## Spec 2 Verification (after all 4 DevTasks merge)

- [ ] **Step 1: End-to-end smoke against a fresh clone**

```bash
git clone <repo-url> /tmp/psykl-smoke && cd /tmp/psykl-smoke
pnpm install
pnpm -r lint
pnpm -r format:check
pnpm --filter @psykl/service-task test:unit
pnpm --filter @psykl/service-task test:integration
pnpm --filter @psykl/service-task test:component
pnpm --filter @psykl/service-task build:openapi
test -f components/service-task/openapi.json && echo "openapi.json exists"
pnpm --filter @psykl/service-task dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tasks   # 401
curl -s http://localhost:3000/tasks -H "X-User-Id: local"             # []
kill %1
```

- [ ] **Step 2: Close out the Spec**

When DevTask 3c's PR merges, set frontmatter `status: DONE`, `devtasks_complete: 4`, populate `branches:` and `prs:` lists. Promote `docs/initiatives/m1-bootstrap/issues/[20260520]P2_m1-service-task-minimal-api.md` to `docs/features/` updating its frontmatter and adding Change Log entries for the 4 merged PRs.
