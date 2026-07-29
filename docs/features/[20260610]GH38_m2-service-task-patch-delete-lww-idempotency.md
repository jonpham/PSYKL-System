---
status: DONE
issue: [GH#38](https://github.com/jonpham/PSYKL-System/issues/38)
branches:
  - feat/m2-s1-dt1-task-schema-evolution
  - feat/m2-s1-dt2-task-patch-lww
  - feat/m2-s1-dt3-task-delete-tombstones
  - feat/m2-s1-dt4-idempotent-task-mutations
prs:
  - https://github.com/jonpham/PSYKL-System/pull/44
  - https://github.com/jonpham/PSYKL-System/pull/45
  - https://github.com/jonpham/PSYKL-System/pull/46
  - https://github.com/jonpham/PSYKL-System/pull/47
completed_at: 2026-06-10
created_at: 2026-06-10
initiative: m2-pwa-crud-offline
spec: consolidated-into-this-doc
---

# M2 Spec 1: service-task PATCH/DELETE + LWW + Idempotency

> Generated from `superpowers:writing-plans` artifacts and completed using `superpowers:executing-plans`.

## User Story

As a developer building the offline-first PWA sync engine, I want `service-task` to accept client-generated Task IDs, PATCH and DELETE Task mutations, Last-Write-Wins reconciliation, tombstone reads, and idempotent mutation retries so that queued offline writes can replay safely across flaky networks and multi-device editing resolves deterministically.

## Features

1. `POST /tasks` now requires client-supplied UUID v7 `id` and `updated_at`; the ID is Task entity identity for offline creates.
2. Task rows include `completed_at`, `updated_at`, `server_updated_at`, and `deleted_at`, with an additive migration that backfills existing M1 rows.
3. `PATCH /tasks/:id` applies title and completion changes when the incoming `updated_at` is newer than the stored row.
4. Stale PATCH and DELETE writes return `200` with the current server row so clients can reconcile without treating the write as transport failure.
5. Future client timestamps more than five minutes ahead are clamped before Last-Write-Wins comparison.
6. `DELETE /tasks/:id` is a soft delete that writes a tombstone through `deleted_at`; default `GET /tasks` hides tombstones.
7. `GET /tasks?include_deleted=1` returns tombstoned rows for future sync pull paths; unparseable values return `400`.
8. `POST`, `PATCH`, and `DELETE` require `Idempotency-Key`; retries with the same user/key/body replay the cached response for 24 hours.
9. Reusing the same `Idempotency-Key` with a different request body before expiry returns `409`.
10. The PWA create flow sends a UUID v7 operation idempotency key in addition to the UUID v7 Task entity ID.

## Source Artifacts Consolidated

- Initiative design: consolidated into this feature doc, `docs/ARCHITECTURE.md`, and `docs/retrospectives/2026-07-29-m2-pwa-crud-offline.md`; deleted at M2 initiative close-out.
- Original issue brief: `docs/initiatives/m2-pwa-crud-offline/issues/[20260522]P1_m2-service-task-patch-delete-lww-idempotency.md` (deleted by this PR).
- Execution spec: `docs/specs/m2-pwa-crud-offline/20260610-S1-service-task-patch-delete-lww-idempotency.md` (deleted by this PR).
- GitHub issue: [#38](https://github.com/jonpham/PSYKL-System/issues/38).
- Constituent DevTask PRs: [#44](https://github.com/jonpham/PSYKL-System/pull/44), [#45](https://github.com/jonpham/PSYKL-System/pull/45), [#46](https://github.com/jonpham/PSYKL-System/pull/46), [#47](https://github.com/jonpham/PSYKL-System/pull/47).

## Implementation Notes

- **M2-1 (PR #44)** evolved the shared Task schemas, Drizzle task table, and M1-row migration. `TaskInputSchema` now requires client-supplied UUID v7 `id` and `updated_at`.
- **M2-2 (PR #45)** added `TaskService.patchTask`, `PATCH /tasks/:id`, Last-Write-Wins comparison, stale-write reconciliation, five-minute future-skew clamping, and OpenAPI coverage.
- **M2-3 (PR #46)** added `TaskService.deleteTask`, `DELETE /tasks/:id`, tombstone filtering by default, `include_deleted=1` reads, and strict query parsing.
- **M2-4** added the `idempotency` table, request-hash persistence, a NestJS global interceptor for mutating Task routes, 24-hour response replay, `409` body-conflict handling, and generated OpenAPI header requirements.
- The idempotency key is operation identity. It is deliberately separate from `Task.id`, which is entity identity.

## Verification Steps

**Associated End-to-End test:** none in this Spec. Multi-device offline behavior is covered by M2 Spec 6 after the PWA consumes these endpoints.

**Manual verification**

Setup / Preconditions:

- Node 24 LTS is active.
- Dependencies are installed with `pnpm install`.
- Generated artifacts are refreshed with `pnpm verify:prepare`.

Steps:

1. Run `pnpm verify:static`.
2. Run `pnpm verify:unit`.
3. Run `pnpm verify:integration`.
4. Run `pnpm verify:component`.
5. Start `service-task` with `pnpm --filter @psykl/service-task dev`.
6. Create a Task with `POST /tasks`, `X-User-Id: local`, `Idempotency-Key: <uuid-v7>`, and body `{ "id": "<uuid-v7>", "title": "first", "updated_at": "<iso timestamp>" }`.
7. Repeat the exact POST with the same idempotency key and body; confirm the same response is replayed.
8. PATCH the Task with a newer `updated_at`; confirm the row updates.
9. PATCH with an older `updated_at`; confirm the current row is returned unchanged.
10. DELETE with a newer `updated_at` and `deleted_at`; confirm the response includes `deleted_at`.
11. `GET /tasks` hides the deleted Task; `GET /tasks?include_deleted=1` includes it.

Expectation: offline clients can generate stable Task IDs, replay mutation operations safely, reconcile stale writes deterministically, and observe tombstones for delete propagation.

## Affected Components

- `packages/shared-types`: Task schemas and OpenAPI builder.
- `components/service-task`: Task schema/migrations, Task service/controller, idempotency schema/service/interceptor/module, contract tests, integration tests.
- `components/web_client`: Task create request now sends an `Idempotency-Key` required by the service OpenAPI contract.

## Design Decisions

- **Decision #34:** `completed_at` is nullable timestamp state.
- **Decision #35:** completed Tasks can be uncompleted by setting `completed_at: null`.
- **Decision #41:** idempotency uses `Idempotency-Key` with a 24-hour server-side time to live.
- **Decision #43:** Last-Write-Wins compares client intent timestamps (`updated_at`).
- **Decision #44:** future-skew guard clamps client timestamps more than five minutes ahead.
- **Decision #45:** deletes are tombstones exposed by `include_deleted=1`.
- **Decision #56:** M1 rows are backfilled in migration before `updated_at` becomes required.

## Architecture Decisions (ADR)

- **ADR-M2-001:** `Task.id` is required on create from M2 onward and must be UUID v7. It is entity identity for offline-created rows.
- **ADR-M2-002:** `Idempotency-Key` is required on mutating Task routes and represents operation identity, not entity identity.
- **ADR-M2-003:** Idempotency is implemented as a NestJS interceptor so it can cache the serialized controller response and status code.
- **ADR-M2-004:** Idempotency persistence is scoped by `(user_id, idempotency_key)` and stores request hash, response body, status code, and expiry.
- **ADR-M2-005:** Soft-delete tombstones are the Task delete model for M2 sync; hard-delete garbage collection is deferred.

## Change Log

| Date       | PR                                                     | Summary                                                               |
| ---------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 2026-06-10 | [#44](https://github.com/jonpham/PSYKL-System/pull/44) | M2-1: Task schema evolution, UUID v7 create identity, migration.      |
| 2026-06-10 | [#45](https://github.com/jonpham/PSYKL-System/pull/45) | M2-2: PATCH route with Last-Write-Wins guard and skew clamp.          |
| 2026-06-10 | [#46](https://github.com/jonpham/PSYKL-System/pull/46) | M2-3: DELETE tombstones and `include_deleted=1` reads.                |
| 2026-06-10 | [#47](https://github.com/jonpham/PSYKL-System/pull/47) | M2-4: Idempotency table, interceptor, required mutation header, docs. |
