---
status: TODO
issue: P1
pr:
completed_at:
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec_number: 1
devtasks_total: 4
devtasks_complete: 0
step_gating: false
honors_decisions: [34, 35, 41, 43, 44, 45, 55, 56]
---

# Service Task PATCH/DELETE + Last-Write-Wins + Idempotency — Implementation Spec

> Generated using `superpowers:writing-plans`.
> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement one DevTask at a time.

**Goal:** Evolve the `Task` service contract so the backend supports update, complete, tombstone delete, conflict reconciliation, and idempotent retry for offline clients.

**Architecture:** `packages/shared-types` owns the Zod schemas and generated OpenAPI shape. `components/service-task` persists the evolved task row through Drizzle, applies Last-Write-Wins (LWW) using client `updated_at`, and wraps mutating requests in an idempotency interceptor keyed by `(user_id, Idempotency-Key)`.

**Tech Stack:** NestJS, Drizzle, PostgreSQL/pglite, Zod, `nestjs-zod`, `zod-to-openapi`, Vitest/Supertest.

---

## Overview

As a developer, I can PATCH and DELETE a PSYKL `Task` through `service-task` with deterministic LWW conflict handling and retry-safe mutation semantics. This spec touches `packages/shared-types` and `components/service-task`; it is the prerequisite for all IndexedDB, sync, Service Worker, user interface, and end-to-end work in M2.

`DevTask` means the workflow unit from `AGENTS.md`. `Task` means the product data record.

## Data Model

Task row evolves from M1 by adding:

```ts
completedAt: timestamp('completed_at', { withTimezone: true });
updatedAt: timestamp('updated_at', { withTimezone: true });
serverUpdatedAt: timestamp('server_updated_at', { withTimezone: true }).notNull().defaultNow();
deletedAt: timestamp('deleted_at', { withTimezone: true });
```

Migration `0002` uses Decision #56: add nullable `updated_at`, backfill `updated_at = created_at`, then set `updated_at` NOT NULL. `completed_at` and `deleted_at` stay nullable. `server_updated_at` is server-stamped.

Idempotency adds an `idempotency` table in migration `0003`:

```ts
userId: text('user_id').notNull();
idempotencyKey: text('idempotency_key').notNull();
requestHash: text('request_hash').notNull();
statusCode: integer('status_code').notNull();
responseBody: jsonb('response_body').notNull();
expiresAt: timestamp('expires_at', { withTimezone: true }).notNull();
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
```

Unique index: `(user_id, idempotency_key)`.

## API

```http
POST /tasks
Headers: user_id, Idempotency-Key
Body: { id: string, title: string, updated_at: string }
Response 201: TaskResponse
Errors: 400 invalid body or non-UUID-v7 id, 401 missing user_id, 409 same idempotency key with different body
```

`id` is required and client-supplied in M2 so offline-created Tasks have stable entity identity before network sync. The server validates the value as UUID v7 and persists it; it no longer generates Task IDs on create. `Idempotency-Key` remains a separate operation identity header for retry dedupe.

```http
PATCH /tasks/:id
Headers: user_id, Idempotency-Key
Body: { title?: string, completed_at?: string | null, updated_at: string }
Response 200: TaskResponse
Errors: 400 invalid body, 401 missing user_id, 404 missing task, 409 same idempotency key with different body
```

Stale writes return `200` with the current server row. Future client timestamps more than 5 minutes ahead are clamped by the service before comparison.

```http
DELETE /tasks/:id
Headers: user_id, Idempotency-Key
Body: { deleted_at: string, updated_at: string }
Response 200: TaskResponse
Errors: 400 invalid body, 401 missing user_id, 404 missing task, 409 same idempotency key with different body
```

```http
GET /tasks?include_deleted=1
Headers: user_id
Response 200: TaskResponse[]
```

Default `GET /tasks` excludes tombstones.

## Implementation Components

### `packages/shared-types/`

- Modify `src/schemas/task.ts` with `TaskPatchInputSchema`, `TaskDeleteInputSchema`, and evolved `TaskResponseSchema`.
- Modify `src/schemas/task.unit.test.ts` to cover nullable completion, tombstones, and required `updated_at`.
- Modify `src/index.ts` exports.
- OpenAPI continues to be emitted by `src/openapi.ts`.

### `components/service-task/`

- Modify `src/db/schema/task.ts` for task columns.
- Modify `src/db/schema/index.ts` to export task and idempotency schemas.
- Create `src/db/schema/idempotency.ts`.
- Modify `src/task/task.service.ts` for create timestamps, PATCH, DELETE, LWW, tombstone filtering.
- Modify `src/task/task.controller.ts` for new endpoints and `include_deleted`.
- Create `src/idempotency/idempotency.interceptor.ts`, `src/idempotency/idempotency.service.ts`, and `src/idempotency/idempotency.module.ts`.
- Modify `src/app.module.ts` to register idempotency support.

## Test Plan

Static analysis: existing `pnpm verify:static`.

Unit:

| File                                                         | Assertion                                                                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared-types/src/schemas/task.unit.test.ts`        | evolved schemas accept complete/uncomplete/tombstone shapes, require UUID v7 `id` and `updated_at` on create, and reject missing `updated_at` |
| `components/service-task/src/task/task.service.unit.test.ts` | timestamp comparison, stale-write return, and 5-minute skew clamp                                                                             |

Integration:

| File                                                                      | Assertion                                                                  |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `components/service-task/tests/integration/task-crud.integration.test.ts` | migration backfill, PATCH, DELETE, tombstone filtering, idempotency replay |

Component:

| File                                                                | Assertion                                            |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| `components/service-task/src/task/task.controller.contract.test.ts` | HTTP shapes for PATCH/DELETE/GET include_deleted     |
| `components/service-task/src/auth/user-id.guard.contract.test.ts`   | mutating M2 endpoints still reject missing `user_id` |

End-to-End: deferred to Spec 6 after the PWA consumes these endpoints.

## DevTasks

This Spec contains 4 DevTasks. The Spec integration branch is `spec/m2-s1-service-task-patch-delete-lww-idempotency`. Each DevTask branches from and targets that Spec branch. DevTask PRs must stay within the AGENTS.md limit of 10 production behavior source files; tests, docs, migrations, generated files, config, and lockfiles do not count.

### DevTask M2-1: Evolve Task schema and OpenAPI contract

**Branch:** `feat/m2-s1-dt1-task-schema-evolution`
**Affected:** `packages/shared-types/src/schemas/task.ts`, `packages/shared-types/src/schemas/task.unit.test.ts`, `packages/shared-types/src/index.ts`, `components/service-task/src/db/schema/task.ts`, `components/service-task/tests/integration/task-crud.integration.test.ts`, Drizzle migration output, generated OpenAPI.

- [x] Step 1: Write failing shared schema tests for `completed_at`, `updated_at`, `server_updated_at`, `deleted_at`, `TaskPatchInputSchema`, and `TaskDeleteInputSchema`.
- [x] Step 1a: Write failing shared schema tests proving `TaskInputSchema` requires client-supplied UUID v7 `id` and `updated_at`, and rejects UUID v4/non-UUID IDs.
- [x] Step 2: Run `pnpm --filter @psykl/shared-types test:unit -- task.unit.test.ts`; expected failure: new schemas or fields are missing.
- [x] Step 3: Extend shared Zod schemas and exports with the exact snake_case wire fields; `TaskInputSchema` is `{ id, title, updated_at }`.
- [x] Step 4: Write failing migration integration coverage by seeding an M1-shape `tasks` row and applying migration `0002`; assert `updated_at = created_at` and `server_updated_at` is present.
- [x] Step 5: Update Drizzle task schema and generate migration `0002`.
- [x] Step 6: Run `pnpm --filter @psykl/shared-types test:unit`, `pnpm --filter @psykl/service-task test:integration`, and `pnpm verify:prepare`.
- [x] Step 7: Commit with `feat: evolve task schema for offline sync`.

### DevTask M2-2: Add PATCH with LWW reconciliation

**Branch:** `feat/m2-s1-dt2-task-patch-lww`
**Affected:** `components/service-task/src/task/task.service.ts`, `components/service-task/src/task/task.controller.ts`, `components/service-task/src/task/task.service.unit.test.ts`, `components/service-task/src/task/task.controller.contract.test.ts`, `components/service-task/tests/integration/task-crud.integration.test.ts`.

- [x] Step 1: Write failing service unit tests for newer update wins, stale update returns current row, and client timestamp beyond +5 minutes is clamped.
- [x] Step 2: Write failing contract tests for `PATCH /tasks/:id` success, stale-write `200`, invalid body `400`, missing row `404`, and missing `user_id` `401`.
- [x] Step 3: Implement `patchTask(userId, taskId, input)` with LWW comparison against current `updated_at`.
- [x] Step 4: Wire `PATCH /tasks/:id` through the controller and DTO validation.
- [x] Step 5: Run `pnpm --filter @psykl/service-task test:unit`, `pnpm --filter @psykl/service-task test:integration`, and `pnpm --filter @psykl/service-task test:component`.
- [x] Step 6: Commit with `feat: add task patch with lww guard`.

### DevTask M2-3: Add DELETE tombstones and include_deleted reads

**Branch:** `feat/m2-s1-dt3-task-delete-tombstones`
**Affected:** `components/service-task/src/task/task.service.ts`, `components/service-task/src/task/task.controller.ts`, `components/service-task/src/task/task.controller.contract.test.ts`, `components/service-task/tests/integration/task-crud.integration.test.ts`.

- [ ] Step 1: Write failing integration tests proving `DELETE` sets `deleted_at`, default `GET /tasks` hides the row, and `GET /tasks?include_deleted=1` returns it.
- [ ] Step 2: Write failing contract tests for delete success, delete stale-write reconciliation, missing row `404`, and unparseable `include_deleted` `400`.
- [ ] Step 3: Implement `deleteTask()` as a soft delete through the same LWW helper as PATCH.
- [ ] Step 4: Add `include_deleted` parsing and default tombstone filtering to list tasks.
- [ ] Step 5: Run `pnpm --filter @psykl/service-task test:integration` and `pnpm --filter @psykl/service-task test:component`.
- [ ] Step 6: Commit with `feat: add task tombstone deletes`.

### DevTask M2-4: Add idempotency for POST/PATCH/DELETE

**Branch:** `feat/m2-s1-dt4-idempotent-task-mutations`
**Affected:** `components/service-task/src/db/schema/idempotency.ts`, `components/service-task/src/db/schema/index.ts`, `components/service-task/src/idempotency/idempotency.service.ts`, `components/service-task/src/idempotency/idempotency.interceptor.ts`, `components/service-task/src/idempotency/idempotency.module.ts`, `components/service-task/src/app.module.ts`, `components/service-task/src/task/task.controller.contract.test.ts`, `components/service-task/tests/integration/task-crud.integration.test.ts`.

- [ ] Step 1: Write failing integration tests for first mutation, retry within 24 hours returning cached response, retry after expiry applying again, and same key with different body returning `409`.
- [ ] Step 2: Write failing contract tests proving POST/PATCH/DELETE require `Idempotency-Key`.
- [ ] Step 3: Create idempotency table and service helpers for request hash, lookup, save, expiry cleanup.
- [ ] Step 4: Create NestJS interceptor for mutating task routes and register it through an idempotency module.
- [ ] Step 5: Add final Spec close-out docs in the Spec integration PR: feature doc, `CHANGELOG.md`, `docs/ARCHITECTURE.md`/`docs/STACK.md` if applicable, and delete the P1 issue brief plus this spec at close-out per AGENTS.md.
- [ ] Step 6: Run `pnpm verify:prepare`, `pnpm verify:static`, `pnpm verify:unit`, `pnpm verify:integration`, and `pnpm verify:component`.
- [ ] Step 7: Commit with `feat: add idempotent task mutations`.

## Verification

1. `pnpm install`
2. `pnpm verify:prepare`
3. `pnpm verify:static`
4. `pnpm --filter @psykl/shared-types test:unit`
5. `pnpm --filter @psykl/service-task test:unit`
6. `pnpm --filter @psykl/service-task test:integration`
7. `pnpm --filter @psykl/service-task test:component`

## Decisions made during spec drafting

- M2-P11 linting/tooling tightening is explicitly deferred beyond this spec. Reason: M2 already changes cross-package runtime contracts, generated API types, service tests, PWA storage, Service Worker behavior, and end-to-end harnesses. Broad lint/import-order/commit-style enforcement would add noisy cross-repo churn before the offline contract is stable. Revisit after Spec 6 or in a dedicated hygiene initiative.
- `POST /tasks` requires client-supplied UUID v7 `id` in M2. This is Task entity identity for offline-created rows and is distinct from the header-based `Idempotency-Key`, which remains the mutation operation identity for retry dedupe.

## Open Questions / Risks

- Drizzle-generated migration filenames can differ; executor must keep the generated filename but preserve Decision #56 semantics.
- Idempotency response snapshots should serialize the same response body shape the controller returns, not raw Drizzle rows.

## Affected by / Depends on

- Depends on the approved M2 design and M1 shipped state on `origin/main`.
- Blocks M2 Specs 2 through 6.
