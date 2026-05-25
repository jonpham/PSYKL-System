---
status: DONE
issue: [GH#3](https://github.com/jonpham/PSYKL-System/issues/3)
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
spec: docs/specs/m1-bootstrap/20260520-S2-service-task-minimal-api.md
---

# M1 Spec 2: service-task Minimal API

## User Story

As a developer, I want to `POST /tasks` and `GET /tasks` against a locally-running NestJS service that persists to pglite so that the API tier of PSYKL-System is wired end-to-end and ready for the M1 PWA in Spec 3.

## Features

1. NestJS `service-task` component with `POST /tasks` and `GET /tasks`.
2. Drizzle ORM schema, migration, and pglite client for the PSYKL `Task` table.
3. `TaskService` generates UUID v7 identifiers and scopes reads/writes by `user_id`.
4. Global `UserIdGuard` enforces default-deny `X-User-Id` header behavior.
5. Zod request validation via `@psykl/shared-types` and `nestjs-zod`.
6. OpenAPI emission through `pnpm --filter @psykl/service-task build:openapi`.
7. ESLint and Prettier static-analysis setup for TypeScript workspace packages.
8. Unit, integration, and Component contract tests for the service.

## Source Artifacts Consolidated

- Initiative design: `docs/initiatives/m1-bootstrap/DESIGN.md`.
- Original issue brief: `docs/initiatives/m1-bootstrap/issues/[20260520]P2_m1-service-task-minimal-api.md`.
- Execution spec: `docs/specs/m1-bootstrap/20260520-S2-service-task-minimal-api.md`.
- GitHub issue: [#3](https://github.com/jonpham/PSYKL-System/issues/3).

## Implementation Notes

- DevTask 4 landed first so Drizzle schema, migration, and pglite client existed before NestJS service logic depended on persistence.
- DevTask 3a added NestJS application wiring, `TaskController`, and `TaskService`. `TaskService` owns UUID v7 generation and maps Drizzle rows to Zod-derived response shapes.
- DevTask 3b made `X-User-Id` mandatory through a global `UserIdGuard`, removed the temporary local-user fallback, added Component contract tests, and emitted `components/service-task/openapi.json` from shared Zod schemas.
- DevTask 3c added root ESLint flat config and Prettier config so the Static Analysis layer is real before Spec 5 CI consumes `pnpm -r lint` and `pnpm -r format:check`.
- Component tests cover both default-deny negative paths and happy-path Task creation/listing through the in-process HTTP layer.

## Verification Steps

**Associated E2E test:** none. End-to-end tests arrive in M1 Spec 5.

**Manual verification**

Setup / Preconditions:
- Node 24 LTS is active.
- Dependencies are installed with `pnpm install`.

Steps:
1. Run `pnpm -r lint`.
2. Run `pnpm -r format:check`.
3. Run `pnpm --filter @psykl/service-task test:unit`.
4. Run `pnpm --filter @psykl/service-task test:integration`.
5. Run `pnpm --filter @psykl/service-task test:component`.
6. Run `pnpm --filter @psykl/service-task typecheck`.
7. Run `pnpm --filter @psykl/service-task build`.
8. Run `pnpm --filter @psykl/service-task build:openapi`.
9. Start the service with `pnpm --filter @psykl/service-task dev`.
10. Confirm `GET /tasks` without `X-User-Id` returns `401`.
11. Confirm `GET /tasks` with `X-User-Id: local` returns `[]` in a fresh in-memory database.
12. Confirm `POST /tasks` with `X-User-Id: local` returns `201` and a Task body with UUID v7 `id`, `user_id`, `title`, and `created_at`.

Expectation: the service exposes validated, guarded, persisted Task CRUD seed endpoints and emits its OpenAPI contract.

## Affected Components

- `components/service-task`.
- `packages/shared-types`.
- Repository root ESLint and Prettier config.

## Design Decisions

- Decision #2: NestJS is the API framework.
- Decision #2b: Zod schema-first contracts drive DTOs and OpenAPI generation.
- Decision #4: Drizzle ORM and drizzle-kit manage database schema and migrations.
- Decision #8: pglite provides in-process PostgreSQL-shaped storage for M1.
- Decision #13: Drizzle schema and migration paths follow the M1 layout.
- Decision #19: Task IDs are app-generated UUID v7 values.
- Decision #20: `created_at` is a database default `timestamptz`.
- Decision #24: the pnpm script contract includes static analysis and test pyramid commands.
- Decision #25: `PGLITE_DATA_DIR` controls pglite persistence.
- Decision #29: CORS allows `Content-Type` and `X-User-Id`.
- Decision #31: Task IDs use a `text` column for portability.

## Architecture Decisions (ADR)

- **ADR-M1-005:** NestJS keeps REST, GraphQL, and gRPC open behind a shared service layer.
- **ADR-M1-006:** Zod schemas are the source of truth for runtime validation, TypeScript types, and OpenAPI output.
- **ADR-M1-007:** pglite keeps M1 local-first while preserving PostgreSQL semantics for later milestones.
- **ADR-M1-008:** UUID v7 improves insertion locality and supports future offline-first client generation.
- **ADR-M1-009:** `UserIdGuard` is the M1/M2 authorization boundary; `user_id` ownership is the access model.
- **ADR-M1-010:** Static analysis is centralized at the repo root through ESLint flat config and Prettier, with package scripts invoking the shared configuration.

## Change Log

| Date | PR | Summary |
| ---- | -- | ------- |
| 2026-05-22 | [#12](https://github.com/jonpham/PSYKL-System/pull/12) | Added Drizzle schema, pglite client, migration, and integration tests. |
| 2026-05-23 | [#14](https://github.com/jonpham/PSYKL-System/pull/14) | Added NestJS bootstrap, modules, Task controller/service, and service unit tests. |
| 2026-05-25 | [#15](https://github.com/jonpham/PSYKL-System/pull/15) | Added global `UserIdGuard`, OpenAPI emission, and Component contract tests. |
| 2026-05-25 | [#16](https://github.com/jonpham/PSYKL-System/pull/16) | Added ESLint and Prettier static analysis for the service and shared types. |
