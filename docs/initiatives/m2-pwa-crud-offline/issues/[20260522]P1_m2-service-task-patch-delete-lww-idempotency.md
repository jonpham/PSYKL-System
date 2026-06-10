---
status: TODO # TODO | IN-PROGRESS | DONE | BLOCKED
issue: GH#38
branches: # one entry per DevTask once branches are cut (each branches off spec/m2-s1-... per AGENTS.md revised workflow + M1 DESIGN.md Decision #10)
  -
prs: # one entry per DevTask PR (each targets the Spec branch, not main, per the revised workflow)
  -
spec_branch: # spec/m2-s1-service-task-patch-delete-lww-idempotency once cut
spec_pr: # PR URL for the long-lived Spec PR (spec/m2-s1-... → main) once opened
completed_at:
created_at: 2026-05-22
initiative: m2-pwa-crud-offline
spec: 1
devtasks_total: 4 # M2-1 + M2-2 + M2-3 + M2-4
devtasks_complete: 0
---

# 20260522 - M2 Spec 1: service-task PATCH/DELETE + LWW + Idempotency middleware

> Pre-implementation feature/issue doc. Once all DevTasks for this Spec merge into the Spec branch, this doc moves to `docs/features/` as the completion record. Use as the body of a GitHub Issue.

## User Story

As a **developer (and downstream PWA sync engine)**, I want to be able to **PATCH and DELETE a Task via `service-task` with Last-Write-Wins conflict resolution and idempotent retries** so that **the PWA's offline-first sync engine can safely replay queued mutations across flaky networks, multi-device editing produces a deterministic resolved state via client-stamped timestamps, and deleted tasks propagate to other devices as tombstones rather than vanishing silently**.

## Features (DevTasks composing this Spec)

1. **DevTask M2-1 — Drizzle migration 0002 (Task schema evolution).** Adds nullable `completed_at`, NOT NULL `updated_at` (client-stamped intent timestamp), NOT NULL `server_updated_at` (server-stamped audit timestamp), and nullable `deleted_at` (tombstone marker) columns to the `tasks` table. Migration is additive; existing M1 rows are backfilled in-migration (`updated_at = created_at`, `server_updated_at = now()`). Extends Zod schemas in `packages/shared-types/src/schemas/` for `Task`, `TaskInput`, `TaskResponse`, plus new `TaskPatchInput`. `TaskInput` now requires client-supplied UUID v7 `id` and `updated_at`; the `id` is Task entity identity for offline creates and is distinct from the `Idempotency-Key` operation identity header. Regenerates `openapi.json`. ~5 production behavior source files.
2. **DevTask M2-2 — PATCH /tasks/:id with LWW guard.** New NestJS controller method + service method. LWW comparison reads current `updated_at` and compares against body's `updated_at`. Future-skew clamp at +5 minutes (Decision #44). Stale writes return HTTP 200 with current server state (no error; client reconciles). Integration tests for happy path, stale-write reconciliation, future-skew clamp at boundary and above, missing-row 404. ~6 production behavior source files.
3. **DevTask M2-3 — DELETE /tasks/:id with tombstone semantics.** Soft-delete only — sets `deleted_at` from client-supplied value (subject to skew clamp). Default `GET /tasks` filters tombstones; new `?include_deleted=1` query param returns them for sync engine pull paths. Integration + Component contract tests. ~5 production behavior source files.
4. **DevTask M2-4 — Idempotency middleware.** New `idempotency` table (Drizzle migration 0003) keyed by `(user_id, idempotency_key)` with `response_snapshot` and `expires_at` columns. NestJS interceptor reads `Idempotency-Key` HTTP header on POST/PATCH/DELETE, dedupes within 24h TTL by returning the cached response without re-applying the write. NestJS scheduled task cleans up expired rows hourly. Integration tests for first-write, retry-within-TTL, retry-after-TTL, different-body-same-key (409). ~6 production behavior source files.

## Verification Steps

**Associated E2E test:** none directly in this Spec — Spec 6 (M2-13) covers the multi-device LWW + tombstone propagation E2E. This Spec ships Component-layer contract tests and Integration-layer tests against in-process pglite.

**Manual verification:**

_Setup / Preconditions_

- M1 close-out landed on `origin/main`; `v0.1.0` tag fired; M1 retrospective confirmed no M2 offline-first premise revision (per M2-P7).
- Spec branch `spec/m2-s1-service-task-patch-delete-lww-idempotency` cut from `main`; draft PR opened against `main`.
- `service-task` running locally on `:3000` via `pnpm --filter service-task dev`.
- An existing Task exists from M1 Create flow (POST `/tasks` with `X-User-Id: local`).

_Steps_

1. Run `pnpm --filter service-task test:integration` — all integration tests pass, including the LWW guard tests, idempotency dedupe tests, and tombstone filter tests.
2. Run `pnpm --filter service-task test:component` — Component contract tests pass: PATCH returns 200 with row body, DELETE sets `deleted_at` and `GET` filters it, Idempotency-Key retry returns cached response.
3. With service running, `curl -X PATCH http://localhost:3000/tasks/{id} -H 'X-User-Id: local' -H 'Idempotency-Key: 01HXXX-test-1' -H 'Content-Type: application/json' -d '{"title":"updated","updated_at":"2026-05-22T15:00:00Z"}'` — returns 200 with the updated row including `server_updated_at`.
4. Repeat step 3 with the same `Idempotency-Key` — returns the same cached response body without re-applying.
5. `curl -X PATCH ...` with an `updated_at` older than the current `updated_at` — returns 200 with the CURRENT server row (no error, stale-write silently reconciles).
6. `curl -X PATCH ...` with `updated_at` set to `2026-05-22T15:10:00Z` (5min+ in future, assuming server.now() is ~15:00) — server clamps to its own time; response `updated_at` is server-clamped, not 15:10.
7. `curl -X DELETE http://localhost:3000/tasks/{id} -H 'X-User-Id: local' -H 'Idempotency-Key: 01HXXX-test-del-1' -d '{"deleted_at":"2026-05-22T15:05:00Z"}'` — returns 204 (or 200 with row including `deleted_at`).
8. `curl http://localhost:3000/tasks -H 'X-User-Id: local'` — deleted task is filtered out.
9. `curl 'http://localhost:3000/tasks?include_deleted=1' -H 'X-User-Id: local'` — deleted task appears with `deleted_at` populated.
10. Inspect Drizzle migration files in `components/service-task/drizzle/migrations/`: two new SQL files (one for Task schema evolution, one for `idempotency` table), both checked in for replay.

_Expectation_
The PWA's future sync engine can safely create Tasks with stable client-generated UUID v7 entity IDs, PATCH/DELETE tasks with idempotent retries, observe LWW resolution against stale writes, and rely on tombstones for cross-device delete propagation. M1 rows survive the migration with sensible defaults populated. No data loss.

## Affected Components

- `components/service-task/` (extended):
  - `src/db/schema/task.ts` (extend Drizzle schema with `completedAt`, `updatedAt`, `serverUpdatedAt`, `deletedAt`).
  - `src/db/schema/idempotency.ts` (new Drizzle schema for the `idempotency` table).
  - `drizzle/migrations/0002_*.sql`, `drizzle/migrations/0003_*.sql` (generated by drizzle-kit; checked in).
  - `src/task/task.controller.ts` (add PATCH, DELETE; extend GET with `include_deleted` query handling).
  - `src/task/task.service.ts` (LWW guard, skew clamp, tombstone setter, server_updated_at stamping).
  - `src/task/task.controller.contract.test.ts` (Component-layer contract tests).
  - `src/idempotency/idempotency.interceptor.ts` (NestJS interceptor reading `Idempotency-Key`).
  - `src/idempotency/idempotency.service.ts` (dedupe + cleanup).
  - `tests/integration/task-lww.integration.test.ts`, `tests/integration/idempotency.integration.test.ts` (new integration tests).
- `packages/shared-types/` (extended):
  - `src/schemas/task.ts` (extend Zod schemas; add `TaskPatchInput`).
  - Affected unit tests for each new/extended schema's parsing.

## Design Decisions

From `docs/initiatives/m2-pwa-crud-offline/DESIGN.md` → Decisions appendix (#34-#55):

- **#34** `completed_at` shape: nullable `timestamptz`, no companion boolean.
- **#35** Completed tasks can be un-completed by setting `completed_at: null` (toggle freely).
- **#41** Idempotency wire format: HTTP header `Idempotency-Key: <UUID v7>`. 24h server-side TTL.
- **#42** Permanent-fail handling: client moves op to a `failed_ops` debug store; server-side error returns the response body unchanged on retry within TTL.
- **#43** LWW timestamp authority: hybrid `client_updated_at` (intent) + `server_updated_at` (audit). LWW comparison uses client time.
- **#44** Clock-skew guard: +5 minute future-skew clamp.
- **#45** Delete semantics: tombstones via `deleted_at`. `GET /tasks?include_deleted=1` exposes them.

Also references **M1 Decision #13** (Drizzle directory layout) and **M1 Decision #19** (UUID v7 client-generated `Task.id`) for migration mechanics.

## Architecture Decisions (ADR)

- **ADR-M2-001:** Idempotency layer lives at NestJS interceptor scope (request-cycle scoped), not at Drizzle/transaction scope. Reason: the response snapshot includes serialized DTO + headers, which is most accurately captured at the controller boundary. See Decision #41.
- **ADR-M2-002:** Soft-delete via `deleted_at` tombstones is the project-lifetime model for the `Task` entity. Hard-delete (garbage-collect old tombstones) is explicitly deferred — revisit only if storage becomes a concern. See Decision #45.
- **ADR-M2-003:** LWW comparison uses client-supplied `updated_at`, not `server_updated_at`. Server time is preserved only for audit. The PSYKL retrospective work (M3+) MUST query `updated_at` / `completed_at` for accurate energy-pattern signal, not server time. See Decision #43.
- **ADR-M2-004:** Migration 0002 backfills existing M1 rows in-place (UPDATE statement inside the migration SQL). No data migration script needed; the backfill is part of the migration itself. See M2 DESIGN.md Recommended Approach → Migration section.
- **ADR-M2-005:** `Task.id` is required in `POST /tasks` from M2 onward and must be UUID v7. This is the Task entity identity needed for offline create. `Idempotency-Key` remains a separate required header for mutation operation identity and retry dedupe.

## Change Log

| Date       | PR         | Summary    |
| ---------- | ---------- | ---------- |
| _none yet_ | _none yet_ | _none yet_ |
