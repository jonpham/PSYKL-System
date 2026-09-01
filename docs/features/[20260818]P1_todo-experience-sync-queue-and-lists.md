---
status: DONE
issue: P1
branches:
  - spec/todo-experience-s1-sync-queue-and-lists
  - feat/todo-experience-s1-dt7-service-client-layer
  - feat/todo-experience-s1-dt8-rewire-task-components
prs:
  - https://github.com/jonpham/PSYKL-System/pull/70
  - https://github.com/jonpham/PSYKL-System/pull/71
  - https://github.com/jonpham/PSYKL-System/pull/72
completed_at: 2026-09-01
created_at: 2026-08-18
initiative: todo-experience
spec: docs/specs/todo-experience/20260818-Spec1-sync-queue-generalization-and-lists.md
---

# todo-experience Spec 1 — Generalized Sync Queue + Lists

> Filename convention: `[{YYYYMMDD}]{ISSUE_REF}_{feature-slug}.md` — see [`AGENTS.md`](../../AGENTS.md#naming-convention).

## User Story

As the operator, I organize my tasks into named lists that survive being created offline on one device and opened on another, so that the app stops being a single flat pile.

## Features

1. The sync queue and failed-ops store are entity-agnostic (`entity_type` + `entity_id`), not Task-only — the prerequisite for any second syncable entity.
2. Replay is order-independent: a due row's transient failure no longer halts the whole pass; an entry that exhausts its retry ceiling moves to `failed_ops` instead of blocking everything behind it.
3. Lists exist end to end: a `lists` table server-side, a `lists` IndexedDB store client-side, full create/rename/reorder/delete, and a `ListSwitcher` UI.
4. Tasks carry a nullable `list_id`; pre-existing tasks (`list_id: null`) resolve to the default list.
5. A device's default "Tasks" list uses a deterministic well-known id, not a random one — closes a real multi-device bug where two devices could each bootstrap a different "Tasks" list.
6. Lists hydrate from the server on hook mount — closes a gap where a device that never itself mutated a given list would never see it.
7. A layered `Service Client` / `Sync Client` / `API Client` architecture replaces UI Components/Hooks calling the sync layer directly.

## Verification Steps

**Associated E2E tests:** `e2e/lists.e2e.spec.ts`, `e2e/task_list-offline-sync.e2e.spec.ts`, `e2e/task_list.e2e.spec.ts` — all active, 14/14 passing against the Docker Compose stack.

**Manual verification**

_Setup / Preconditions_ — two browser profiles (or Playwright contexts) against one running stack (`docker compose up`).

_Steps_

1. On device A, create a list "Groceries" and add a task to it while it's the active list.
2. On device B, open the app **without ever touching "Groceries."**
3. Open the list switcher on device B.

_Expectation_ — "Groceries" appears in device B's list switcher (the hydration-gap fix), and both devices' default "Tasks" list is the same list (the deterministic-id fix) — not two different lists that happen to share a name.

## Affected Components

- `packages/shared-types` — `List`/`ListInput`/`ListPatchInput`/`ListDeleteInput` Zod schemas + OpenAPI paths
- `components/service-task` — `lists` table/migration, `ListModule`/`ListController`/`ListService`, `Task.list_id`
- `components/web_client` — IndexedDB v2 migration, `useLists`/`useTasks` hooks, `ListSwitcher`/`ListRow` UI, the new `services/`, `sync/sync-client.ts`, and `api/*.api-client.ts` layer
- `e2e/` — `lists.e2e.spec.ts`, multi-device offline-sync coverage

## Design Decisions

- **No foreign keys on `Task.list_id`** — consistent with the project's offline posture; the server accepts a `list_id` it has never seen.
- **`offlineCapable` is a constructor-time discriminated union**, not a per-call flag — every entity here is offline-first for its whole lifetime; see ADR-TE-003.
- **Task's atomic optimistic-write path (`putTaskAndEnqueueSyncOp`) was preserved exactly**, not generalized to List — List never had that atomicity guarantee before this Spec either, and `db/idb.ts`/`useLists.default-list.ts`'s multi-store bootstrap transaction is explicitly out of scope for the generic Sync Client.
- **DevTasks 7-8 were discovered via PR #70's code review, not planned in the original 6-DevTask breakdown** — permitted per AGENTS.md ("a design doc's DevTask Breakdown is an authoritative starting suggestion, not a rigid contract"). Landed as stacked PRs off the merged Spec branch since GitHub had already retargeted them to `main`.

## Architecture Decisions (ADR)

- [ADR-TE-001](../ARCHITECTURE.md): Entity-Agnostic Sync Queue and Order-Independent Replay
- [ADR-TE-002](../ARCHITECTURE.md): Deterministic Well-Known ID for the Default List
- [ADR-TE-003](../ARCHITECTURE.md): Layered Service/Sync/API Client Over Direct Sync-Layer Calls

## Change Log

| Date       | PR                                                     | Summary                                                                |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 2026-09-01 | [#70](https://github.com/jonpham/PSYKL-System/pull/70) | DevTasks 1-6: entity-agnostic queue, List entity, ListSwitcher UI, e2e |
| 2026-09-01 | [#71](https://github.com/jonpham/PSYKL-System/pull/71) | DevTask 7: layered Service/Sync/API Client architecture                |
| 2026-09-01 | [#72](https://github.com/jonpham/PSYKL-System/pull/72) | DevTask 8: rewire `TaskCreateForm`/`TaskRow` off the sync layer        |
