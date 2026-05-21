---
status: TODO
issue: [GH#3](https://github.com/jonpham/PSYKL-System/issues/3)
branches:
  -
prs:
  -
completed_at:
created_at: 2026-05-20
initiative: m1-bootstrap
spec: 2
devtasks_total: 3       # DevTask 3a + 3b + 4 (DevTask 3 pre-split per Decision #19 trilemma)
devtasks_complete: 0
---

# 20260520 - M1 Spec 2: service-task minimal API

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **developer**, I want to be able to **`POST /tasks` and `GET /tasks` against a locally-running NestJS service that persists to pglite** so that **the API tier of PSYKL-System is provably wired end-to-end (HTTP layer, validation, ORM, in-process database, security middleware) and can serve the M1 PWA in Spec 3**.

## Features (DevTasks composing this Spec)

1. **DevTask 3a — NestJS handlers + module wiring.** `main.ts`, `AppModule`, `TaskModule`, `TaskController` (`POST /tasks` + `GET /tasks`), `TaskService` (generates UUID v7 IDs via the `uuid` package, inserts via Drizzle), `nestjs-zod` DTO wiring consuming Zod schemas from `packages/shared-types`. Plus Unit tests for `TaskService` (id generation, validation). ~6 impl files + ~2 unit-test files. [Sub-Issue TBD]
2. **DevTask 3b — Global `UserIdGuard` + OpenAPI emission + Component contract tests.** `UserIdGuard` registered globally via `app.useGlobalGuards()`, `pnpm --filter service-task build:openapi` script using `zod-to-openapi` to emit `components/service-task/openapi.json`, package.json script wiring. Component-layer contract tests: positive path (`POST /tasks` returns 201 with the new task body; `GET /tasks` returns the user's tasks only) + default-deny negative paths (missing `X-User-Id` header → 401, malformed header → 403, an un-guarded route would also be rejected by construction). ~3 impl + ~3 contract-test files. [Sub-Issue TBD]
3. **DevTask 4 — Drizzle schema + initial migration (pglite).** Drizzle schema files in `components/service-task/src/db/schema/` defining the PSYKL `Task` table (Postgres-shaped via `drizzle-orm/pglite`; `text` PK for UUID v7 per Decision #31, `timestamptz` + DB default `now()` per Decision #20), `drizzle.config.ts`, initial migration SQL generated to `components/service-task/drizzle/migrations/`, Integration test confirming schema applied against an in-process pglite instance. ~6 files. [Sub-Issue TBD]

## Verification Steps

**Associated E2E test:** none — E2E suite arrives in Spec 5; this Spec is verified via Component contract tests (in-process HTTP) and an Integration test (pglite + Drizzle).

**Manual verification:**

_Setup / Preconditions_
- Spec 1 (Workspace Bootstrap) complete and merged.
- A clean clone with `pnpm install` done.
- `PGLITE_DATA_DIR=./.pglite-dev` env var (or unset, defaulting to in-memory; per Decision #25).

_Steps_
1. `pnpm --filter service-task dev` starts the NestJS service on `:3000`.
2. Confirm logs show `Application is running on: http://localhost:3000`, Drizzle migrations applied, and the global `UserIdGuard` registered.
3. Run: `curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "X-User-Id: local" -d '{"title":"first PSYKL task"}'`. Expect `201 Created` and JSON body containing `id` (UUID v7), `user_id: "local"`, `title: "first PSYKL task"`, `created_at` (ISO 8601 timestamp).
4. Run: `curl -s http://localhost:3000/tasks -H "X-User-Id: local"`. Expect a JSON array containing the task from step 3.
5. Run: `curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"x"}'` (NO `X-User-Id` header). Expect `401 Unauthorized` or `403 Forbidden`.
6. Run: `curl -i http://localhost:3000/tasks -H "X-User-Id: "` (empty header). Expect `401`/`403`.
7. Visit `http://localhost:3000/api-docs` (or wherever the emitted OpenAPI document is served / inspect `components/service-task/openapi.json`) and confirm it lists `POST /tasks`, `GET /tasks`, request/response schemas, and the `X-User-Id` header as a required parameter.

_Expectation_
A clean API with two endpoints, persisted storage, validated request/response shapes derived from Zod schemas, an emitted OpenAPI document, and default-deny security posture proven by negative-path contract tests.

## Affected Components

- `components/service-task/` (new):
  - `src/main.ts`, `src/app.module.ts`
  - `src/task/task.module.ts`, `src/task/task.controller.ts`, `src/task/task.service.ts`
  - `src/task/task.service.unit.test.ts`, `src/task/task.controller.contract.test.ts`
  - `src/auth/user-id.guard.ts`, `src/auth/user-id.guard.contract.test.ts`
  - `src/db/schema/task.ts`, `src/db/index.ts` (Drizzle client setup with `PGLITE_DATA_DIR` env)
  - `drizzle.config.ts`, `drizzle/migrations/0000_initial.sql`
  - `tests/integration/task-crud.integration.test.ts`
  - `package.json` (NestJS deps, scripts including `build:openapi`), `tsconfig.json`, `nest-cli.json`
- `packages/shared-types/` (consumed; no new files in this Spec).

## Design Decisions

- **#2** API framework: NestJS, REST initially, multi-transport-ready (gRPC + GraphQL deferrable into the same app later).
- **#2b** Schema discipline: schema-first via Zod (`packages/shared-types/src/schemas/`) → `nestjs-zod` for DTOs → `zod-to-openapi` for the emitted OpenAPI document. NO `@nestjs/swagger`.
- **#4** ORM + migrations: Drizzle ORM + `drizzle-kit`.
- **#8** Database: pglite (in-process PostgreSQL via WebAssembly).
- **#13** Drizzle directory layout: schema at `components/service-task/src/db/schema/`; migrations at `components/service-task/drizzle/migrations/`; config at `components/service-task/drizzle.config.ts`.
- **#19** `Task.id` strategy: UUID v7, app-generated in `TaskService` via the `uuid` package. Drizzle column: `text('id').primaryKey()` (per Decision #31).
- **#20** `created_at` column shape: `timestamptz` with DB default `now()`. App code does NOT set `created_at` on insert.
- **#25** pglite persistence: `PGLITE_DATA_DIR` env var; in-memory if unset (Integration test default).
- **#29** CORS allowed headers must include `X-User-Id` and `Content-Type` (relevant when `web_client` consumes this API in Spec 3).
- **#31** UUID column type: `text` not `uuid` (no pgcrypto dependency; type-portable).
- **#32** Container runtime: Debian-based `node:24-bookworm-slim` (relevant for the Dockerfile in Spec 4; mentioned here so the runtime expectations are consistent).

## Architecture Decisions (ADR)

- **ADR-M1-004:** NestJS chosen over Hono/Fastify/Express specifically because of its multi-transport model. REST controllers, GraphQL resolvers, and gRPC controllers can all coexist later in the same app, calling the same `TaskService`. Migration cost to add gRPC or GraphQL later: ~3-5 days vs ~3-5 weeks with a single-transport framework. See Decision #2.
- **ADR-M1-005:** Schema-first via Zod (not pure spec-first via OpenAPI codegen, not code-first via `@nestjs/swagger`). Zod schemas in `packages/shared-types` are the single source of truth. The `openapi.json` artifact is emitted, not hand-edited. Honest discipline given NestJS's strengths. See Decision #2b.
- **ADR-M1-006:** pglite over SQLite. Postgres-shaped SQL semantics from day one; M4+ migration to networked Postgres is a connection-string change, not a query rewrite. See Decision #8.
- **ADR-M1-007:** UUID v7 (time-ordered) over UUID v4 (random). Better database-index locality; app-generated keeps M2 offline-first sync option open. `text` column type rather than `uuid` for type-portability and no pgcrypto dependency. See Decisions #19, #31.
- **ADR-M1-008:** Security posture: global `UserIdGuard` is the entire authorization model in M1/M2 (per Premise 7 + 8). `user_id` ownership IS the access control list — there is no per-task ACL, and there will never be (per Premise 8: PSYKL is single-user multi-device, never multi-user collaboration).

## Change Log

| Date | PR | Summary |
| ---- | -- | ------- |
| _none yet_ | _none yet_ | _none yet_ |
