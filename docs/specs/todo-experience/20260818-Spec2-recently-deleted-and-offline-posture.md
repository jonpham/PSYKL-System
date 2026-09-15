---
status: TODO
issue: P2
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 2
devtasks_total: 6
devtasks_complete: 0
honors_decisions:
  - offline-posture-deletes-are-moves
  - offline-posture-thresholds
  - offline-posture-no-foreign-keys
  - service-client-read-parity
---

# Recently Deleted + Offline Posture — Implementation Spec

> **DevTasks 7-12 are all expanded to per-Step TDD detail** (via `superpowers:writing-plans`, across several passes) against the interfaces Spec 1 actually shipped.

**Date:** 2026-08-18
**Initiative:** `todo-experience`
**Spec:** 2/7
**Spec User Story:** _As the operator, I can undo any deletion for 30 days, and the app tells me plainly when I have been offline too long, so that I never silently lose work._
**Time-box:** ~3 days human / ~1 Claude Code session
**Reads from:** [`DESIGN.md`](../../initiatives/todo-experience/DESIGN.md) → Offline Posture (LOCKED).

---

## Overview

Implements the offline posture the engineering review locked: deletes stop being destructive, and offline stops being unbounded.

Two halves:

1. **Recently Deleted.** A delete on the client is a _move_, not a destroy. The server hard-deletes only what has sat untouched for 30 days. This replaces the cascading list delete that would have queued one operation per task.
2. **Offline pressure.** A banner at 25 unsynced changes, a hard write ceiling at 100.

Components: `components/service-task`, `components/web_client`, `packages/shared-types`.

---

## Data Model

No new tables. `tasks.deleted_at` and `lists.deleted_at` already exist as tombstones (ADR-M2-004) — Recently Deleted is a _read_ over rows carrying a non-null `deleted_at`, not a new store.

Adds one server-side scheduled purge:

```sql
DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
DELETE FROM lists WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days';
```

**Restore** clears `deleted_at` and bumps `updated_at`, so it reconciles under Last-Write-Wins like any other patch.

---

## API

```
GET    /deleted                 → { lists: List[], tasks: Task[] }  (deleted_at not null, within 30d)
POST   /lists/{id}/restore      → 200 + List   Body: { updated_at }
POST   /tasks/{id}/restore      → 200 + Task   Body: { updated_at }
```

The purge runs as a NestJS scheduled job, not an endpoint.

---

## DevTasks

This Spec contains 6 DevTasks. Each DevTask is one Pull Request, ≤10 **production behavior source files** (tests, config, docs, lockfiles, and generated migrations are exempt — see AGENTS.md → Git Conventions). Each DevTask branches off the Spec integration branch `spec/todo-experience-s2-recently-deleted-and-offline-posture` and PRs into that branch, not into `main`.

**Trilemma split #1 (AGENTS.md → Design Doc Discipline):** the DESIGN.md breakdown's original DevTask 7 ("Restore endpoints + 30-day purge job") touches 11 production behavior source files once counted precisely — one over the ≤10 ceiling. Per the trilemma rule (prefer splitting DevTasks over bending the file-count rule or deferring tests), it is split here into **DevTask 7 (Restore endpoints + `GET /deleted`)** and a new **DevTask 8 (30-day purge job)**. The former DevTask 8 (Orphan sweep) and DevTask 9 (UI) and DevTask 10 (Offline pressure) shift to DevTask 9, 10, 11 respectively. This is a narrow-scope DevTask-count adjustment, not a decision re-open — DESIGN.md's Offline Posture decisions are unchanged.

**Trilemma split #2:** the former DevTask 10 ("Recently Deleted screen + restore UI") requires wiring `restore` into the offline sync queue as a new op type — 8 files (`idb.types.ts`, `sync-client.ts`, `service-client.ts`, `replay.transport.ts`, `task-service-client.ts`, `list-service-client.ts`, `tasks.api-client.ts`, `lists.api-client.ts`) — plus the UI screen itself (hook, component, entry point, index) — 4+ files. 12+ total, over the ≤10 ceiling. Split into **DevTask 10 (restore sync-queue plumbing, no UI)** and **DevTask 11 (Recently Deleted screen)**, the latter depending on the former. The former DevTask 11 (Offline pressure) shifts to DevTask 12. `devtasks_total` becomes 6.

**Entry-point scope decision:** UX.md's eventual `⋯` list overflow menu (hosting `New Section`, `Rename List`, `Delete List`, `Settings`, and presumably `Recently Deleted`) does not exist yet in the codebase — `App.tsx` is still the minimal bootstrap shell, and the overflow menu is unscoped, later Spec 3+ work. DevTask 11 adds a plain temporary "Recently Deleted" button next to the list-switcher button rather than building that menu now. Move it into the real overflow menu when that ships.

| #   | Title                                                   | Branch                                             | Files | Depends on                                                                                                |
| --- | ------------------------------------------------------- | -------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------- |
| 7   | Restore endpoints + `GET /deleted`                      | `feat/todo-experience-s2-dt7-restore-and-deleted`  | 10    | Spec 1 DevTask 3                                                                                          |
| 8   | 30-day purge job                                        | `feat/todo-experience-s2-dt8-purge-job`            | 2     | DevTask 7                                                                                                 |
| 9   | Orphan sweep heals dangling `list_id`                   | `feat/todo-experience-s2-dt9-orphan-sweep`         | 2     | DevTask 7                                                                                                 |
| 10  | Restore sync-queue plumbing                             | `feat/todo-experience-s2-dt10-restore-plumbing`    | 9     | DevTask 7                                                                                                 |
| 11  | Recently Deleted screen + read/write abstraction parity | `feat/todo-experience-s2-dt11-recently-deleted-ui` | 12    | DevTask 10                                                                                                |
| 12  | Offline pressure banner + write ceiling                 | `feat/todo-experience-s2-dt12-offline-pressure`    | 9     | Spec 1 DevTask 1 (documented); branches off DevTask 11 for sequencing (operator override — see Decisions) |

### DevTask 7: Restore endpoints + `GET /deleted`

> DevTask numbers are global across the initiative, matching (post-split) DESIGN.md's Spec/DevTask Breakdown.

**Files:** 10
**Branch:** `feat/todo-experience-s2-dt7-restore-and-deleted`
**PR:** _filled once the PR is opened_
**Affected:**

- `packages/shared-types/src/schemas/task.ts` (modify)
- `packages/shared-types/src/schemas/list.ts` (modify)
- `packages/shared-types/src/openapi/task-paths.ts` (modify)
- `packages/shared-types/src/openapi/list-paths.ts` (modify)
- `components/service-task/src/task/task.service.ts` (modify)
- `components/service-task/src/task/task.controller.ts` (modify)
- `components/service-task/src/list/list.service.ts` (modify)
- `components/service-task/src/list/list.controller.ts` (modify)
- `components/service-task/src/deleted/deleted.controller.ts` (create)
- `components/service-task/src/app.module.ts` (modify)

**Design notes carried into implementation:**

- **Existing idempotency asymmetry preserved, not fixed.** `IdempotencyInterceptor.requiresIdempotency` (`components/service-task/src/idempotency/idempotency.interceptor.ts:85-89`) only requires `Idempotency-Key` on routes whose path starts with `/tasks`. List mutations (`POST/PATCH/DELETE /lists*`) are not currently idempotency-protected. `POST /tasks/{id}/restore` therefore requires `Idempotency-Key`; `POST /lists/{id}/restore` does not — matching every existing List route. This is a pre-existing gap, out of scope for this DevTask.
- **Restore reconciles under Last-Write-Wins**, identical pattern to `patchTask`/`patchList`: an `updated_at` at or before the stored row's `updated_at` is a silent no-op returning the stored row, not an error.
- **`GET /deleted` filters to a 30-day window** (`deleted_at IS NOT NULL AND deleted_at >= now() - 30d`) even though nothing purges yet in this DevTask — DevTask 8 makes the purge and this filter agree by construction.
- **`DeletedController` is declared directly on `AppModule`**, not its own module — it only needs `TaskService`/`ListService`, both already exported by `TaskModule`/`ListModule`, which `AppModule` already imports. Avoids an 11th file.

**Steps:**

- [x] **Step 1: Shared-types — write failing unit tests for the three new schemas**

  Create `packages/shared-types/src/schemas/task-restore-input.unit.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';

  import { TaskRestoreInputSchema } from './task';

  describe('TaskRestoreInputSchema', () => {
    it('accepts updated_at', () => {
      const valid = { updated_at: '2026-05-20T12:00:00.000Z' };
      expect(TaskRestoreInputSchema.parse(valid)).toEqual(valid);
    });

    it('rejects missing updated_at', () => {
      expect(() => TaskRestoreInputSchema.parse({})).toThrow();
    });

    it('rejects unknown fields', () => {
      expect(() =>
        TaskRestoreInputSchema.parse({
          updated_at: '2026-05-20T12:00:00.000Z',
          deleted_at: '2026-05-20T12:00:00.000Z',
        }),
      ).toThrow();
    });
  });
  ```

  Create `packages/shared-types/src/schemas/list-restore-input.unit.test.ts` (same three cases, importing `ListRestoreInputSchema` from `./list`).

  Create `packages/shared-types/src/schemas/deleted-response.unit.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';

  import { DeletedResponseSchema } from './list';

  describe('DeletedResponseSchema', () => {
    it('accepts empty lists and tasks arrays', () => {
      expect(DeletedResponseSchema.parse({ lists: [], tasks: [] })).toEqual({ lists: [], tasks: [] });
    });

    it('rejects a missing tasks field', () => {
      expect(() => DeletedResponseSchema.parse({ lists: [] })).toThrow();
    });
  });
  ```

- [x] **Step 2: Run and verify all three fail**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: FAIL — `TaskRestoreInputSchema`, `ListRestoreInputSchema`, `DeletedResponseSchema` are not exported.

- [x] **Step 3: Implement the three schemas**

  In `packages/shared-types/src/schemas/task.ts`, after `TaskDeleteInputSchema`:

  ```ts
  export const TaskRestoreInputSchema = z.object({ updated_at: TimestampSchema }).strict();

  export type TaskRestoreInput = z.infer<typeof TaskRestoreInputSchema>;
  ```

  In `packages/shared-types/src/schemas/list.ts`: add `import { TaskSchema } from './task.js';` to the existing `import` from `./task.js`, then after `ListDeleteInputSchema`:

  ```ts
  export const ListRestoreInputSchema = z.object({ updated_at: TimestampSchema }).strict();

  export type ListRestoreInput = z.infer<typeof ListRestoreInputSchema>;

  /**
   * Response shape for GET /deleted — every List and Task tombstone within the
   * 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
   */
  export const DeletedResponseSchema = z.object({ lists: z.array(ListSchema), tasks: z.array(TaskSchema) }).strict();

  export type DeletedResponse = z.infer<typeof DeletedResponseSchema>;
  ```

- [x] **Step 4: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: PASS

  ```bash
  git add packages/shared-types/src/schemas/task.ts packages/shared-types/src/schemas/list.ts \
    packages/shared-types/src/schemas/task-restore-input.unit.test.ts \
    packages/shared-types/src/schemas/list-restore-input.unit.test.ts \
    packages/shared-types/src/schemas/deleted-response.unit.test.ts
  git commit -m "feat(shared-types): add restore input and deleted response schemas"
  ```

- [x] **Step 5: Write failing OpenAPI doc assertions**

  In `packages/shared-types/src/openapi.unit.test.ts`, add inside the `describe('buildOpenApiDocument', ...)` block:

  ```ts
  it('produces /tasks/{id}/restore, /lists/{id}/restore, and /deleted paths', () => {
    const doc = buildOpenApiDocument();
    expect(doc.paths?.['/tasks/{id}/restore']?.post).toBeDefined();
    expect(doc.paths?.['/lists/{id}/restore']?.post).toBeDefined();
    expect(doc.paths?.['/deleted']?.get).toBeDefined();
    expect(doc.components?.schemas?.TaskRestoreInput).toBeDefined();
    expect(doc.components?.schemas?.ListRestoreInput).toBeDefined();
    expect(doc.components?.schemas?.DeletedResponse).toBeDefined();
  });

  it('requires Idempotency-Key on /tasks/{id}/restore but not on /lists/{id}/restore', () => {
    const doc = buildOpenApiDocument();
    const taskRestoreParams = doc.paths?.['/tasks/{id}/restore']?.post?.parameters ?? [];
    const listRestoreParams = doc.paths?.['/lists/{id}/restore']?.post?.parameters ?? [];
    const findKey = (params: typeof taskRestoreParams) => params.find((p) => p.name === 'Idempotency-Key');
    expect(findKey(taskRestoreParams)).toMatchObject({ required: true });
    expect(findKey(listRestoreParams)).toBeUndefined();
  });
  ```

- [x] **Step 6: Run and verify it fails**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: FAIL — paths undefined.

- [x] **Step 7: Register the paths**

  In `packages/shared-types/src/openapi/task-paths.ts`, add to the top-level `const` block: `const taskRestoreInput = registry.register('TaskRestoreInput', TaskRestoreInputSchema);` (add `TaskRestoreInputSchema` to the existing import from `../schemas/task.js`). After the `delete` path registration, add:

  ```ts
  registry.registerPath({
    method: 'post',
    path: '/tasks/{id}/restore',
    summary: 'Restore a soft-deleted Task with Last-Write-Wins reconciliation',
    request: {
      params: taskIdParam,
      headers: mutatingHeaders,
      body: { content: { 'application/json': { schema: taskRestoreInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: taskResponse } } },
      400: { description: 'Bad request - body fails TaskRestoreInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'Task not found for current user' },
      409: { description: 'Same Idempotency-Key was used with a different request body' },
    },
  });
  ```

  In `packages/shared-types/src/openapi/list-paths.ts`, add `ListRestoreInputSchema` and `DeletedResponseSchema` to the existing import from `../schemas/list.js`, then after the top-level `const` block add:

  ```ts
  const listRestoreInput = registry.register('ListRestoreInput', ListRestoreInputSchema);
  const deletedResponse = registry.register('DeletedResponse', DeletedResponseSchema);
  ```

  After the `delete` path registration, add:

  ```ts
  registry.registerPath({
    method: 'post',
    path: '/lists/{id}/restore',
    summary: 'Restore a soft-deleted List with Last-Write-Wins reconciliation',
    request: {
      params: listIdParam,
      headers: userIdHeader,
      body: { content: { 'application/json': { schema: listRestoreInput } } },
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: listResponse } } },
      400: { description: 'Bad request - body fails ListRestoreInput validation' },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
      404: { description: 'List not found for current user' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/deleted',
    summary: 'List every List and Task tombstone within the 30-day Recently Deleted window',
    request: { headers: userIdHeader },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: deletedResponse } } },
      401: { description: 'Missing X-User-Id header' },
      403: { description: 'Malformed X-User-Id header' },
    },
  });
  ```

- [x] **Step 8: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: PASS

  ```bash
  git add packages/shared-types/src/openapi.unit.test.ts packages/shared-types/src/openapi/task-paths.ts \
    packages/shared-types/src/openapi/list-paths.ts
  git commit -m "feat(shared-types): register restore and deleted OpenAPI paths"
  ```

- [x] **Step 9: `TaskService.restoreTask` — write failing unit test**

  Create `components/service-task/src/task/__tests__/task.service.restore.unit.test.ts`, following the `mockDeleteDb` pattern in `task.service.delete.unit.test.ts`:

  ```ts
  import { describe, expect, it, vi } from 'vitest';

  import type { Db } from '../../db/index.js';
  import { TaskService } from '../task.service.js';
  import { taskRow } from './task.service.unit-support.js';

  function mockRestoreDb(selectRows: unknown[], updateSet: ReturnType<typeof vi.fn>): Db {
    const where = vi.fn(async () => selectRows);
    const from = vi.fn(() => ({ where }));
    return {
      select: vi.fn(() => ({ from })),
      update: vi.fn(() => ({ set: updateSet })),
    } as unknown as Db;
  }

  describe('TaskService.restoreTask', () => {
    it('clears deleted_at and bumps updated_at when the restore is newer', async () => {
      const currentRow = taskRow({
        updatedAt: new Date('2026-05-20T12:00:00.000Z'),
        deletedAt: new Date('2026-05-20T12:00:00.000Z'),
      });
      const restoredRow = taskRow({ updatedAt: new Date('2026-05-20T12:05:00.000Z'), deletedAt: null });
      const updateSet = vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(async () => [restoredRow]) })) }));
      const service = new TaskService(mockRestoreDb([currentRow], updateSet));

      // Given
      const restoreInput = { updated_at: '2026-05-20T12:05:00.000Z' };

      // When
      const restored = await service.restoreTask('local', currentRow.id, restoreInput);

      // Then
      expect(restored.deleted_at).toBeNull();
      expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: null }));
    });

    it('is a no-op returning the stored row when restore updated_at is not newer', async () => {
      const currentRow = taskRow({
        updatedAt: new Date('2026-05-20T12:05:00.000Z'),
        deletedAt: new Date('2026-05-20T12:05:00.000Z'),
      });
      const updateSet = vi.fn();
      const service = new TaskService(mockRestoreDb([currentRow], updateSet));

      // Given
      const staleRestoreInput = { updated_at: '2026-05-20T12:00:00.000Z' };

      // When
      const result = await service.restoreTask('local', currentRow.id, staleRestoreInput);

      // Then
      expect(result.deleted_at).toBe('2026-05-20T12:05:00.000Z');
      expect(updateSet).not.toHaveBeenCalled();
    });
  });
  ```

- [x] **Step 10: Run and verify it fails**

  Run: `pnpm --filter @psykl/service-task test:unit`
  Expected: FAIL — `restoreTask` is not a function.

- [x] **Step 11: Implement `TaskService.restoreTask` and `listDeletedTasks`**

  In `components/service-task/src/task/task.service.ts`, change the `drizzle-orm` import to `import { and, eq, gte, isNotNull, isNull } from 'drizzle-orm';`, add near the top of the file (after imports):

  ```ts
  // 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
  const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  ```

  Add to the `TaskService` class, after `deleteTask`:

  ```ts
  async restoreTask(userId: string, taskId: string, input: TaskRestoreInput): Promise<TaskResponse> {
    const current = await this.findTaskForUser(userId, taskId);
    const updatedAt = clampFutureTimestamp(new Date(input.updated_at));

    if (updatedAt.getTime() <= current.updatedAt!.getTime()) {
      return this.toResponse(current);
    }

    const [row] = await this.db
      .update(schema.tasks)
      .set({
        deletedAt: null,
        updatedAt,
        serverUpdatedAt: new Date(),
      })
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .returning();

    if (!row) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponse(row);
  }

  async listDeletedTasks(userId: string): Promise<TaskResponse[]> {
    const cutoff = new Date(Date.now() - RECENTLY_DELETED_WINDOW_MS);
    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.userId, userId), isNotNull(schema.tasks.deletedAt), gte(schema.tasks.deletedAt, cutoff)));

    return rows.map((row) => this.toResponse(row));
  }
  ```

  Add `TaskRestoreInput` to the existing `@psykl/shared-types` type import.

- [x] **Step 12: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:unit`
  Expected: PASS

  ```bash
  git add components/service-task/src/task/task.service.ts \
    components/service-task/src/task/__tests__/task.service.restore.unit.test.ts
  git commit -m "feat(service-task): add TaskService.restoreTask and listDeletedTasks"
  ```

- [x] **Step 13: `ListService.restoreList` — write failing unit test, implement, verify, commit**

  Create `components/service-task/src/list/__tests__/list.service.restore.unit.test.ts` mirroring Step 9's two cases (`restoreList` clears `deletedAt` when newer; no-op when not newer), using a local `mockRestoreDb` helper built the same way (list rows have `position`, not `completedAt`).

  Run: `pnpm --filter @psykl/service-task test:unit` — verify FAIL (`restoreList` undefined).

  In `components/service-task/src/list/list.service.ts`, change the import to `import { and, eq, gte, isNotNull, isNull } from 'drizzle-orm';`, add near the top:

  ```ts
  // 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
  const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  ```

  Add to the `ListService` class, after `deleteList`:

  ```ts
  async restoreList(userId: string, id: string, input: ListRestoreInput): Promise<ListResponse> {
    const existing = await this.requireList(userId, id);
    const incoming = clampFutureTimestamp(new Date(input.updated_at));

    if (incoming.getTime() <= existing.updatedAt.getTime()) {
      return this.toResponse(existing);
    }

    const [row] = await this.db
      .update(schema.lists)
      .set({
        deletedAt: null,
        updatedAt: incoming,
        serverUpdatedAt: new Date(),
      })
      .where(and(eq(schema.lists.id, id), eq(schema.lists.userId, userId)))
      .returning();
    return this.toResponse(row!);
  }

  async listDeletedLists(userId: string): Promise<ListResponse[]> {
    const cutoff = new Date(Date.now() - RECENTLY_DELETED_WINDOW_MS);
    const rows = await this.db
      .select()
      .from(schema.lists)
      .where(and(eq(schema.lists.userId, userId), isNotNull(schema.lists.deletedAt), gte(schema.lists.deletedAt, cutoff)))
      .orderBy(schema.lists.position);
    return rows.map((row) => this.toResponse(row));
  }
  ```

  Add `ListRestoreInput` to the existing `@psykl/shared-types` type import.

  Run: `pnpm --filter @psykl/service-task test:unit` — verify PASS.

  ```bash
  git add components/service-task/src/list/list.service.ts \
    components/service-task/src/list/__tests__/list.service.restore.unit.test.ts
  git commit -m "feat(service-task): add ListService.restoreList and listDeletedLists"
  ```

- [x] **Step 14: Controller contract tests — write failing tests for both restore routes**

  Create `components/service-task/src/task/__tests__/task.controller.restore.contract.test.ts`, reusing `taskControllerHarness`/`taskCreateBody`/`validTaskId`/`validIdempotencyKey` from `task.controller.contract-support.js`. Add a `restoreTask` method to that harness file:

  ```ts
  restoreTask(input: { id: string; userId?: string; idempotencyKey?: string; body: RequestBody }) {
    const req = request(app.getHttpServer())
      .post(`/tasks/${input.id}/restore`)
      .set('X-User-Id', input.userId ?? 'local');
    if (input.idempotencyKey) {
      req.set('Idempotency-Key', input.idempotencyKey);
    }
    return req.send(input.body);
  },
  ```

  Test cases (`describe('POST /tasks/:id/restore')`):
  - creates a deleted task (via `postTask` + `deleteTask`), restores it, expects 200 with `deleted_at: null` and the new `updated_at`; a subsequent `getTasks()` (default, excludes deleted) includes it again.
  - restore with an older `updated_at` than the stored row returns 200 with the row unchanged (`deleted_at` still set).
  - restore without `Idempotency-Key` returns 400.
  - restore of a nonexistent id returns 404.

  Create `components/service-task/src/list/__tests__/list.controller.contract-support.ts` (this file doesn't exist yet — model it on `task.controller.contract-support.ts`, scoped to `ListController`'s four existing routes plus `restoreList`, with `deleteList`/`createList`/`restoreList` helpers hitting `/lists`, `/lists/:id`, `/lists/:id/restore`, no `Idempotency-Key` handling since List routes don't require it).

  Create `components/service-task/src/list/__tests__/list.controller.restore.contract.test.ts` with the same four cases as tasks, minus the `Idempotency-Key` case (list mutations never require it — add a case instead asserting restore succeeds with **no** `Idempotency-Key` header set, documenting the asymmetry inline per the ownership-comment convention, referencing `idempotency.interceptor.ts`).

- [x] **Step 15: Run and verify both fail**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: FAIL — no `/restore` route registered (404 instead of the expected status on every case).

- [x] **Step 16: Implement both controller routes**

  In `components/service-task/src/task/task.controller.ts`, add `TaskRestoreInputSchema`/`TaskRestoreInput` to the `@psykl/shared-types` import, then after the `delete` method:

  ```ts
  @Post(':id/restore')
  async restore(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TaskRestoreInputSchema)) body: TaskRestoreInput,
  ): Promise<TaskResponse> {
    return this.tasks.restoreTask(req.userId!, id, body);
  }
  ```

  In `components/service-task/src/list/list.controller.ts`, add `ListRestoreInputSchema`/`ListRestoreInput` to the `@psykl/shared-types` import, then after the `delete` method:

  ```ts
  @Post(':id/restore')
  async restore(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ListRestoreInputSchema)) body: ListRestoreInput,
  ): Promise<ListResponse> {
    return this.lists.restoreList(req.userId!, id, body);
  }
  ```

- [x] **Step 17: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: PASS

  ```bash
  git add components/service-task/src/task/task.controller.ts components/service-task/src/list/list.controller.ts \
    components/service-task/src/task/__tests__/task.controller.contract-support.ts \
    components/service-task/src/task/__tests__/task.controller.restore.contract.test.ts \
    components/service-task/src/list/__tests__/list.controller.contract-support.ts \
    components/service-task/src/list/__tests__/list.controller.restore.contract.test.ts
  git commit -m "feat(service-task): wire POST /tasks/:id/restore and POST /lists/:id/restore"
  ```

- [x] **Step 18: `GET /deleted` — write failing contract test**

  Create `components/service-task/src/deleted/__tests__/deleted.controller.contract.test.ts`:

  ```ts
  import request from 'supertest';
  import { describe, expect, it } from 'vitest';

  import { listControllerHarness } from '../../list/__tests__/list.controller.contract-support.js';
  import { taskControllerHarness } from '../../task/__tests__/task.controller.contract-support.js';

  describe('GET /deleted', () => {
    const tasks = taskControllerHarness();
    const lists = listControllerHarness();

    it('returns deleted Lists and Tasks for the current user, excluding live rows', async () => {
      const taskId = '0193e1c0-1234-7000-8000-000000000200';
      await tasks
        .postTask({
          idempotencyKey: '0193e1c0-5678-7000-8000-000000000200',
          body: { id: taskId, title: 'gone', updated_at: '2026-05-20T12:00:00.000Z' },
        })
        .expect(201);
      await tasks
        .deleteTask({
          id: taskId,
          idempotencyKey: '0193e1c0-5678-7000-8000-000000000201',
          body: { deleted_at: '2026-05-20T12:05:00.000Z', updated_at: '2026-05-20T12:05:00.000Z' },
        })
        .expect(200);

      // Given / When
      const res = await request(tasks.app.getHttpServer()).get('/deleted').set('X-User-Id', 'local').expect(200);

      // Then
      expect((res.body.tasks as Array<{ id: string }>).map((t) => t.id)).toContain(taskId);
      expect(res.body.lists).toEqual(expect.any(Array));
    });

    it('returns 401 with no X-User-Id header', async () => {
      await request(tasks.app.getHttpServer()).get('/deleted').expect(401);
    });
  });
  ```

  Add `get app() { return app; }` to the returned object of both `taskControllerHarness()` (`task.controller.contract-support.ts`) and the new `listControllerHarness()` (`list.controller.contract-support.ts`, created in Step 14) so this test can reach the raw Nest HTTP server for the one route (`/deleted`) that belongs to neither controller.

- [x] **Step 19: Run and verify it fails**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: FAIL — 404, no `/deleted` route.

- [x] **Step 20: Implement `DeletedController` and wire it into `AppModule`**

  Create `components/service-task/src/deleted/deleted.controller.ts`:

  ```ts
  import { Controller, Get, Inject, Req } from '@nestjs/common';
  import type { DeletedResponse } from '@psykl/shared-types';

  import { ListService } from '../list/list.service.js';
  import { TaskService } from '../task/task.service.js';

  interface RequestWithUser {
    userId?: string;
  }

  @Controller()
  export class DeletedController {
    constructor(
      @Inject(TaskService) private readonly tasks: TaskService,
      @Inject(ListService) private readonly lists: ListService,
    ) {}

    @Get('deleted')
    async listDeleted(@Req() req: RequestWithUser): Promise<DeletedResponse> {
      const [lists, tasks] = await Promise.all([
        this.lists.listDeletedLists(req.userId!),
        this.tasks.listDeletedTasks(req.userId!),
      ]);
      return { lists, tasks };
    }
  }
  ```

  In `components/service-task/src/app.module.ts`, add the import and register the controller:

  ```ts
  import { DeletedController } from './deleted/deleted.controller.js';
  // ...
  @Module({
    imports: [TaskModule, ListModule, IdempotencyModule, VersionModule],
    controllers: [DeletedController],
  })
  export class AppModule {}
  ```

- [x] **Step 21: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: PASS

  ```bash
  git add components/service-task/src/deleted/deleted.controller.ts \
    components/service-task/src/deleted/__tests__/deleted.controller.contract.test.ts \
    components/service-task/src/app.module.ts
  git commit -m "feat(service-task): add GET /deleted"
  ```

- [x] **Step 22: Extend user-id default-deny coverage**

  Add rows to the `it.each` table in `components/service-task/src/auth/__tests__/user-id.guard.contract.test.ts` for `POST /tasks/:id/restore` and `GET /deleted`; add a row to `components/service-task/src/list/__tests__/list.user-id.contract.test.ts` for `POST /lists/:id/restore`.

  Run: `pnpm --filter @psykl/service-task test:component` — verify PASS (the guard already applies globally; this step only adds coverage).

  ```bash
  git add components/service-task/src/auth/__tests__/user-id.guard.contract.test.ts \
    components/service-task/src/list/__tests__/list.user-id.contract.test.ts
  git commit -m "test(service-task): cover restore and deleted routes in user-id default-deny suite"
  ```

- [x] **Step 23: Integration test — restore + `GET /deleted` window filtering against real pglite**

  Create `components/service-task/tests/integration/recently-deleted-restore.integration.test.ts` using the `createIntegrationDb`/`insertTask`/`taskService` pattern from `task.integration-support.ts` (add an `insertList`/`listService` pair to a new `list.integration-support.ts`, modeled on the task one). Cases:
  - a task inserted with `deletedAt` 5 days ago is returned by `listDeletedTasks`; restoring it via `TaskService.restoreTask` clears `deletedAt` and it no longer appears.
  - a task inserted with `deletedAt` 31 days ago is **excluded** from `listDeletedTasks` (window filter working ahead of DevTask 8's purge job).
  - same two cases for `ListService.restoreList`/`listDeletedLists`.

  Run: `pnpm --filter @psykl/service-task test:integration` — verify PASS (implementation from Steps 11/13 already covers this; this step is characterization coverage, not new production code).

  ```bash
  git add components/service-task/tests/integration/recently-deleted-restore.integration.test.ts \
    components/service-task/tests/integration/list.integration-support.ts
  git commit -m "test(service-task): integration coverage for restore and 30-day deleted window"
  ```

- [x] **Step 24: Update this spec doc's checkbox state**

  Mark DevTask 7's Steps 1-23 complete above; do not touch `docs/features/` (feature doc is written once, at Spec 2's final DevTask). Commit as part of the DevTask 7 PR body, not a separate commit (per AGENTS.md → File & Status Discipline).

### DevTask 8: 30-day purge job

**Files:** 2
**Branch:** `feat/todo-experience-s2-dt8-purge-job` (stacked on DevTask 7's branch — hard dependency on `DB_TOKEN`/`schema` wiring already in `main` is not the blocker; the dependency is sequencing behind the DevTask 7 PR per the DESIGN.md breakdown's `Depends on` column, and this DevTask lands while DevTask 7 is still in review)
**PR:** _filled once the PR is opened; targets `feat/todo-experience-s2-dt7-restore-and-deleted`_
**Affected:**

- `components/service-task/src/purge/purge.service.ts` (create)
- `components/service-task/src/app.module.ts` (modify)
- `components/service-task/package.json` (modify — new `@nestjs/schedule` dependency; exempt from the file-count limit per AGENTS.md → Git Conventions)

**Design notes carried into implementation:**

- **Clock control via DI, not `vi.useFakeTimers`.** `PurgeService` takes a `CLOCK_TOKEN` provider (`type Clock = () => Date`), mirroring the `DB_TOKEN` pattern already in `task.service.ts`. Production wiring provides `() => new Date()`; the integration test constructs `PurgeService` directly with a fixed clock, so the purge boundary test runs instantly instead of waiting real days.
- **One log line per purged row**, per the Open Questions/Risks entry — `Logger.log` on each deleted task/list id before the query returns.
- **No separate `PurgeModule`.** `PurgeService` and `CLOCK_TOKEN`'s provider are registered directly on `AppModule`, same rationale as `DeletedController` in DevTask 7 — keeps this DevTask at 2 files instead of 3.
- **`@nestjs/schedule`'s `ScheduleModule.forRoot()`** is added to `AppModule`'s imports once; `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` drives the daily run in production. The Cron decorator does not fire during the integration test — the test calls `purgeExpiredTombstones()` directly.

**Steps:**

- [x] **Step 1: Write failing integration test for the purge boundary**

  Create `components/service-task/tests/integration/recently-deleted-purge.integration.test.ts`:

  ```ts
  import { v7 as uuidv7 } from 'uuid';
  import { beforeAll, describe, expect, it } from 'vitest';

  import type { Db } from '../../src/db/index.js';
  import { insertList, listService } from './list.integration-support.js';
  import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';
  import { PurgeService } from '../../src/purge/purge.service.js';

  describe('PurgeService.purgeExpiredTombstones', () => {
    let db: Db;

    beforeAll(async () => {
      db = await createIntegrationDb();
    });

    // Fixed "now" so the 30-day boundary is deterministic instead of drifting
    // with the real wall clock (see recently-deleted-restore.integration.test.ts
    // for why real-Date.now()-relative fixtures are needed elsewhere).
    const now = new Date('2026-06-20T00:00:00.000Z');
    const daysBefore = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    it('purges a Task tombstoned 31 days ago, keeps one tombstoned 29 days ago', async () => {
      const purgedId = uuidv7();
      const keptId = uuidv7();
      await insertTask(db, { id: purgedId, title: 'purge me', updatedAt: daysBefore(31), deletedAt: daysBefore(31) });
      await insertTask(db, { id: keptId, title: 'keep me', updatedAt: daysBefore(29), deletedAt: daysBefore(29) });

      // Given
      const purge = new PurgeService(db, () => now);

      // When
      const result = await purge.purgeExpiredTombstones();

      // Then
      expect(result.tasksPurged).toBeGreaterThanOrEqual(1);
      const remaining = await taskService(db).listTasks('local', { includeDeleted: true });
      expect(remaining.map((task) => task.id)).not.toContain(purgedId);
      expect(remaining.map((task) => task.id)).toContain(keptId);
    });

    it('purges a List tombstoned 31 days ago, keeps one tombstoned 29 days ago', async () => {
      const purgedId = uuidv7();
      const keptId = uuidv7();
      await insertList(db, { id: purgedId, title: 'purge me', updatedAt: daysBefore(31), deletedAt: daysBefore(31) });
      await insertList(db, { id: keptId, title: 'keep me', updatedAt: daysBefore(29), deletedAt: daysBefore(29) });

      // Given
      const purge = new PurgeService(db, () => now);

      // When
      const result = await purge.purgeExpiredTombstones();

      // Then
      expect(result.listsPurged).toBeGreaterThanOrEqual(1);
      const remainingKept = await listService(db).listDeletedLists('local');
      expect(remainingKept.map((list) => list.id)).toContain(keptId);
      expect(remainingKept.map((list) => list.id)).not.toContain(purgedId);
    });

    it('never purges a row restored before the 30-day boundary', async () => {
      const id = uuidv7();
      await insertTask(db, { id, title: 'restored in time', updatedAt: daysBefore(31), deletedAt: daysBefore(31) });
      await taskService(db).restoreTask('local', id, { updated_at: daysBefore(1).toISOString() });

      // Given
      const purge = new PurgeService(db, () => now);

      // When
      await purge.purgeExpiredTombstones();

      // Then
      const rows = await taskService(db).listTasks('local', { includeDeleted: true });
      expect(rows.map((task) => task.id)).toContain(id);
    });
  });
  ```

- [x] **Step 2: Run and verify it fails**

  Run: `pnpm --filter @psykl/service-task test:integration`
  Expected: FAIL — `../../src/purge/purge.service.js` does not exist.

- [x] **Step 3: Add the `@nestjs/schedule` dependency**

  ```bash
  pnpm --filter @psykl/service-task add @nestjs/schedule
  ```

- [x] **Step 4: Implement `PurgeService`**

  Create `components/service-task/src/purge/purge.service.ts`:

  ```ts
  import { Inject, Injectable, Logger } from '@nestjs/common';
  import { Cron, CronExpression } from '@nestjs/schedule';
  import { and, isNotNull, lt } from 'drizzle-orm';

  import { type Db, schema } from '../db/index.js';
  import { DB_TOKEN } from '../task/task.service.js';

  export const CLOCK_TOKEN = Symbol('CLOCK');
  export type Clock = () => Date;

  // 30-day Recently Deleted retention window. See DESIGN.md -> Offline Posture.
  const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

  export interface PurgeResult {
    tasksPurged: number;
    listsPurged: number;
  }

  @Injectable()
  export class PurgeService {
    private readonly logger = new Logger(PurgeService.name);

    constructor(
      @Inject(DB_TOKEN) private readonly db: Db,
      @Inject(CLOCK_TOKEN) private readonly clock: Clock,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async purgeExpiredTombstones(): Promise<PurgeResult> {
      const cutoff = new Date(this.clock().getTime() - RECENTLY_DELETED_WINDOW_MS);

      const purgedTasks = await this.db
        .delete(schema.tasks)
        .where(and(isNotNull(schema.tasks.deletedAt), lt(schema.tasks.deletedAt, cutoff)))
        .returning({ id: schema.tasks.id });
      for (const row of purgedTasks) {
        this.logger.log(`purged task ${row.id}`);
      }

      const purgedLists = await this.db
        .delete(schema.lists)
        .where(and(isNotNull(schema.lists.deletedAt), lt(schema.lists.deletedAt, cutoff)))
        .returning({ id: schema.lists.id });
      for (const row of purgedLists) {
        this.logger.log(`purged list ${row.id}`);
      }

      return { tasksPurged: purgedTasks.length, listsPurged: purgedLists.length };
    }
  }
  ```

- [x] **Step 5: Wire `ScheduleModule`, `PurgeService`, and `CLOCK_TOKEN` into `AppModule`**

  In `components/service-task/src/app.module.ts`:

  ```ts
  import { Module } from '@nestjs/common';
  import { ScheduleModule } from '@nestjs/schedule';

  import { DeletedController } from './deleted/deleted.controller.js';
  import { IdempotencyModule } from './idempotency/idempotency.module.js';
  import { ListModule } from './list/list.module.js';
  import { CLOCK_TOKEN, PurgeService } from './purge/purge.service.js';
  import { TaskModule } from './task/task.module.js';
  import { VersionModule } from './version/version.module.js';

  @Module({
    imports: [TaskModule, ListModule, IdempotencyModule, VersionModule, ScheduleModule.forRoot()],
    controllers: [DeletedController],
    providers: [PurgeService, { provide: CLOCK_TOKEN, useValue: () => new Date() }],
  })
  export class AppModule {}
  ```

- [x] **Step 6: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:integration`
  Expected: PASS

  ```bash
  git add components/service-task/src/purge/purge.service.ts components/service-task/src/app.module.ts \
    components/service-task/tests/integration/recently-deleted-purge.integration.test.ts \
    components/service-task/package.json
  git commit -m "feat(service-task): add PurgeService with daily 30-day tombstone purge"
  ```

- [x] **Step 7: Full verification pass**

  ```bash
  pnpm -r lint && pnpm -r typecheck && pnpm -r format:check
  pnpm --filter @psykl/service-task test:unit
  pnpm --filter @psykl/service-task test:integration
  pnpm --filter @psykl/service-task test:component
  ```

  Expected: all green.

- [x] **Step 8: Update this spec doc's checkbox state**

  Mark DevTask 8's Steps 1-7 complete above.

### DevTask 9: Orphan sweep heals dangling `list_id`

**Files:** 2 (revised from the planned 1 — see design notes)
**Branch:** `feat/todo-experience-s2-dt9-orphan-sweep` (stacked on DevTask 7's branch — hard dependency on DevTask 7 per the DESIGN.md breakdown's `Depends on` column; DevTask 7 is still unmerged, so this DevTask branches off it directly rather than off the Spec branch)
**PR:** _filled once the PR is opened; targets `feat/todo-experience-s2-dt7-restore-and-deleted`_
**Affected:**

- `components/service-task/src/task/task.service.ts` (modify)
- `components/service-task/src/task/task-orphan-sweep.ts` (create)

**Design notes carried into implementation:**

- **"Default list" = the earliest-position live list for the user**, matching the client's own definition in `components/web_client/src/hooks/useLists.default-list.ts:24-28` ("The earliest-position active list is the default list"). The server does NOT hardcode the client's well-known `DEFAULT_LIST_ID` constant — that ID is itself just the first list a device creates, and UX.md § 10 says a task whose original list is deleted "goes to the default list," which must still resolve correctly if the well-known list itself is ever deleted and a different list becomes earliest-position.
- **Heals by write, not by response-shaping.** An orphaned Task's `list_id` is persisted back to the default list's id on the next `listTasks` read — "heals without a background job" per the DESIGN.md decision — not just masked in the response while the stored row stays broken.
- **No live lists at all → no-op.** If a user has zero live lists (edge case; the client always bootstraps one), orphaned references are left as-is rather than crashing — there is nothing to heal into yet.
- **Scoped to `listTasks`'s default (non-deleted) rows.** Tombstoned Tasks (`includeDeleted: true`) are not healed — a deleted Task's `list_id` is inert; healing it would just be write amplification with no observable effect since deleted rows are excluded from the client's list views.
- **Healing logic lives in its own file, `task-orphan-sweep.ts`.** Inlining it in `task.service.ts` pushed that file over the project's `max-lines: 150` ESLint rule (caught by the pre-commit hook during execution) — split by responsibility, matching the existing `openapi/task-paths.ts` / `openapi/list-paths.ts` precedent in `packages/shared-types`. Revises the planned file count from 1 to 2; still well under the ≤10 DevTask ceiling.

**Steps:**

- [x] **Step 1: Write failing integration test for the orphan sweep**

  Create `components/service-task/tests/integration/task-orphan-sweep.integration.test.ts`:

  ```ts
  import { v7 as uuidv7 } from 'uuid';
  import { beforeAll, describe, expect, it } from 'vitest';

  import type { Db } from '../../src/db/index.js';
  import { insertList } from './list.integration-support.js';
  import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';

  describe('TaskService orphan sweep', () => {
    let db: Db;

    beforeAll(async () => {
      db = await createIntegrationDb();
    });

    it('reassigns a Task pointing at a deleted list to the earliest-position live list, persisting the fix', async () => {
      const defaultListId = await insertList(db, {
        title: 'Tasks',
        position: 'a0',
        updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      });
      const deletedListId = await insertList(db, {
        title: 'Gone',
        position: 'a1',
        updatedAt: new Date('2026-05-20T10:00:00.000Z'),
        deletedAt: new Date('2026-05-20T11:00:00.000Z'),
      });
      const taskId = await insertTask(db, {
        title: 'orphaned',
        updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      });
      await db.update((await import('../../src/db/index.js')).schema.tasks).set({ listId: deletedListId });

      // Given
      const service = taskService(db);

      // When
      const [firstRead] = await service.listTasks('local');

      // Then
      expect(firstRead).toMatchObject({ id: taskId, list_id: defaultListId });

      // And — the fix is persisted, not just shaped in the response
      const [secondRead] = await service.listTasks('local');
      expect(secondRead).toMatchObject({ id: taskId, list_id: defaultListId });
    });

    it('reassigns a Task pointing at a list id the server has never seen', async () => {
      const defaultListId = await insertList(db, {
        title: 'Tasks',
        position: 'a0',
        updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      });
      const unseenListId = uuidv7();
      const taskId = await insertTask(db, {
        id: uuidv7(),
        title: 'never-seen list',
        updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      });
      await db.update((await import('../../src/db/index.js')).schema.tasks).set({ listId: unseenListId });

      // Given
      const service = taskService(db);

      // When
      const rows = await service.listTasks('local');

      // Then
      expect(rows.find((task) => task.id === taskId)).toMatchObject({ list_id: defaultListId });
    });

    it('leaves a Task referencing a live list untouched', async () => {
      const liveListId = await insertList(db, {
        title: 'Live',
        position: 'a2',
        updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      });
      const taskId = await insertTask(db, { title: 'fine', updatedAt: new Date('2026-05-20T10:00:00.000Z') });
      await db.update((await import('../../src/db/index.js')).schema.tasks).set({ listId: liveListId });

      // Given
      const service = taskService(db);

      // When
      const rows = await service.listTasks('local');

      // Then
      expect(rows.find((task) => task.id === taskId)).toMatchObject({ list_id: liveListId });
    });
  });
  ```

  (Note: the awkward `db.update(...)` calls set `list_id` after insert because `insertTask` in `task.integration-support.ts` does not currently accept a `listId` field — Step 4 below extends that helper cleanly instead of leaving the inline `db.update` workaround in the final test; see Step 4.)

- [x] **Step 2: Run and verify it fails**

  Run: `pnpm --filter @psykl/service-task test:integration`
  Expected: FAIL — assertions on `list_id` don't match (no healing logic yet).

- [x] **Step 3: Extend `insertTask` to accept `listId`, and rewrite the test using it**

  In `components/service-task/tests/integration/task.integration-support.ts`, add `listId?: string` to `insertTask`'s input type and pass it through to `.values({ ..., listId: input.listId })`. Rewrite the three test bodies above to pass `listId` directly to `insertTask` instead of the inline `db.update(...)` workaround.

- [x] **Step 4: Implement the orphan sweep in `TaskService.listTasks`**

  In `components/service-task/src/task/task.service.ts`, add `import { schema } from '../db/index.js'` already exists; extend the `drizzle-orm` import with `inArray`. Replace `listTasks` with:

  ```ts
  async listTasks(userId: string, options: { includeDeleted?: boolean } = {}): Promise<TaskResponse[]> {
    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(
        options.includeDeleted
          ? eq(schema.tasks.userId, userId)
          : and(eq(schema.tasks.userId, userId), isNull(schema.tasks.deletedAt)),
      );

    const healedRows = options.includeDeleted ? rows : await this.healOrphanedListReferences(userId, rows);
    return healedRows.map((row) => this.toResponse(row));
  }

  private async healOrphanedListReferences(
    userId: string,
    rows: (typeof schema.tasks.$inferSelect)[],
  ): Promise<(typeof schema.tasks.$inferSelect)[]> {
    const referencedListIds = [...new Set(rows.map((row) => row.listId).filter((id): id is string => id !== null))];
    if (referencedListIds.length === 0) {
      return rows;
    }

    const liveLists = await this.db
      .select({ id: schema.lists.id })
      .from(schema.lists)
      .where(and(eq(schema.lists.userId, userId), isNull(schema.lists.deletedAt), inArray(schema.lists.id, referencedListIds)));
    const liveListIds = new Set(liveLists.map((list) => list.id));
    const orphans = rows.filter((row) => row.listId !== null && !liveListIds.has(row.listId));
    if (orphans.length === 0) {
      return rows;
    }

    const [defaultList] = await this.db
      .select({ id: schema.lists.id })
      .from(schema.lists)
      .where(and(eq(schema.lists.userId, userId), isNull(schema.lists.deletedAt)))
      .orderBy(schema.lists.position)
      .limit(1);
    if (!defaultList) {
      return rows;
    }

    const orphanIds = orphans.map((row) => row.id);
    await this.db.update(schema.tasks).set({ listId: defaultList.id }).where(inArray(schema.tasks.id, orphanIds));

    return rows.map((row) => (orphanIds.includes(row.id) ? { ...row, listId: defaultList.id } : row));
  }
  ```

- [x] **Step 5: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:integration`
  Expected: PASS

  ```bash
  git add components/service-task/src/task/task.service.ts \
    components/service-task/tests/integration/task-orphan-sweep.integration.test.ts \
    components/service-task/tests/integration/task.integration-support.ts
  git commit -m "feat(service-task): heal orphaned Task list_id references on read"
  ```

- [x] **Step 6: Full verification pass**

  ```bash
  pnpm -r lint && pnpm -r typecheck && pnpm -r format:check
  pnpm --filter @psykl/service-task test:unit
  pnpm --filter @psykl/service-task test:integration
  pnpm --filter @psykl/service-task test:component
  ```

  Expected: all green.

- [x] **Step 7: Update this spec doc's checkbox state**

  Mark DevTask 9's Steps 1-6 complete above.

### DevTask 10: Restore sync-queue plumbing

**Files:** 9 (revised from the planned 8 — `client.ts` needed the new `TaskRestoreInput`/`ListRestoreInput` type exports, missed when scoping the DevTask)
**Branch:** `feat/todo-experience-s2-dt10-restore-plumbing` (branches directly off the Spec branch — DevTask 7, its only dependency, is already merged there)
**PR:** _filled once the PR is opened_
**Affected:**

- `components/web_client/src/db/idb.types.ts` (modify)
- `components/web_client/src/sync/sync-client.ts` (modify)
- `components/web_client/src/services/service-client.ts` (modify)
- `components/web_client/src/sync/replay.transport.ts` (modify)
- `components/web_client/src/api/client.ts` (modify)
- `components/web_client/src/api/tasks.api-client.ts` (modify)
- `components/web_client/src/api/lists.api-client.ts` (modify)
- `components/web_client/src/services/task-service-client.ts` (modify)
- `components/web_client/src/services/list-service-client.ts` (modify)

**Deviations from plan during execution:**

- Test files landed in the existing `tasks.api-client.unit.test.ts`/`lists.api-client.unit.test.ts` (extending them) rather than new `*.restore.unit.test.ts` files, matching this codebase's one-file-per-module test convention.
- `replay.transport.restore.unit.test.ts` drives `sendEntry` against the real `msw` mock server (same pattern as the api-client tests) rather than `vi.spyOn`-ing module exports — more robust and consistent with how the rest of this test suite verifies HTTP dispatch. Required adding `POST /tasks/:id/restore` and `POST /lists/:id/restore` handlers to `msw-handlers.ts`/`msw-handlers.lists.ts` (test fixtures, exempt from the file-count limit).

**Design notes carried into implementation:**

- **No UI in this DevTask.** This is purely the write path: a `restore()` method that enqueues a `restore` sync-queue op the same way `patch()`/`delete()` do today, and a `replay.transport.ts` branch that dispatches queued `restore` ops to `POST /tasks/{id}/restore` / `POST /lists/{id}/restore`. DevTask 11 consumes `taskServiceClient.restore()`/`listServiceClient.restore()` from the UI.
- **`restore` joins the existing `'create' | 'patch' | 'delete'` op union** in `SyncQueueEntry`/`FailedOpEntry` (`idb.types.ts`). `SyncQueueEntryV1` (the pre-Spec-1 shape, migration-only) is untouched — restore never existed in that schema and the migration path only rewrites old rows into the current shape.
- **Body shape is `{ updated_at: string }`** for both entities, matching `TaskRestoreInputSchema`/`ListRestoreInputSchema` (`packages/shared-types`, already regenerated into `components/web_client/src/api/types.ts` — that file is gitignored per Decision #12/#25, so `pnpm --filter @psykl/web-client codegen` must be run locally before any of this compiles; it is not a step here since it produces no diff to commit).
- **`writeBackResponse` and `emitStaleWriteIfSuperseded` need no changes.** Writeback just puts whatever the server returned, regardless of op; stale-write detection is explicitly `patch`-only (see its own doc comment) and a restore losing a Last-Write-Wins race is out of scope for this DevTask — no UX story calls for it.
- **List restore still sends an `Idempotency-Key` header** even though the server does not require it for `/lists/*` routes (existing asymmetry, DevTask 7) — matches every other List mutation in `lists.api-client.ts`, which all pass `idempotencyKey` uniformly for consistency.

**Interfaces produced for DevTask 11:**

- `taskServiceClient.restore(entityId: string, body: TaskRestoreInput, optimistic: Task): Promise<Task>`
- `listServiceClient.restore(entityId: string, body: ListRestoreInput, optimistic: List): Promise<List>`

**Steps:**

- [x] **Step 1: `idb.types.ts` — add `restore` to the op union**

  In `components/web_client/src/db/idb.types.ts`, change both `SyncQueueEntry.op` and `FailedOpEntry` (which extends `SyncQueueEntry`, so only one edit is needed) from:

  ```ts
  op: 'create' | 'patch' | 'delete';
  ```

  to:

  ```ts
  op: 'create' | 'patch' | 'delete' | 'restore';
  ```

  Leave `SyncQueueEntryV1.op` unchanged (pre-Spec-1 schema; restore never existed there).

- [x] **Step 2: `sync-client.ts` — write failing unit test for `restore()`**

  In `components/web_client/src/sync/__tests__/sync-client.unit.test.ts`, add to the task `describe` block:

  ```ts
  it('restore() writes the optimistic (un-deleted) Task then enqueues a restore op', async () => {
    // Given
    const deletedTask: Task = { ...optimisticTask, deleted_at: nowIso };
    await putTask(deletedTask);
    const restored: Task = { ...optimisticTask, deleted_at: null, updated_at: nowIso };

    // When
    await taskClient.restore(taskId, { updated_at: nowIso }, restored);

    // Then
    await expect(getTask(taskId)).resolves.toEqual(restored);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: taskId, entity_type: 'task', op: 'restore' }]);
  });
  ```

  Add to the list `describe` block:

  ```ts
  it('restore() writes the optimistic (un-deleted) List then enqueues a restore op', async () => {
    // Given
    const deletedList: List = { ...optimisticList, deleted_at: nowIso };
    await putList(deletedList);
    const restored: List = { ...optimisticList, deleted_at: null, updated_at: nowIso };

    // When
    await listClient.restore(listId, { updated_at: nowIso }, restored);

    // Then
    await expect(getList(listId)).resolves.toEqual(restored);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'restore' }]);
  });
  ```

- [x] **Step 3: Run and verify both fail**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `taskClient.restore`/`listClient.restore` are not functions.

- [x] **Step 4: Implement `SyncClient.restore()`**

  In `components/web_client/src/sync/sync-client.ts`, add `restore` to the `SyncClient` interface:

  ```ts
  interface SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
    patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
    delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
    restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
    hydrate(): Promise<void>;
  }
  ```

  Add to the object returned by `createSyncClient`, after `patch`:

  ```ts
  async restore(entityId, body, optimistic) {
    await enqueueOptimistic(config, entityId, body, 'restore', optimistic);
    return optimistic;
  },
  ```

- [x] **Step 5: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/db/idb.types.ts components/web_client/src/sync/sync-client.ts \
    components/web_client/src/sync/__tests__/sync-client.unit.test.ts
  git commit -m "feat(web-client): add SyncClient.restore()"
  ```

- [x] **Step 6: `service-client.ts` — write failing unit test for `restore()`**

  In `components/web_client/src/services/__tests__/service-client.unit.test.ts`, add `restore` to both `fakeApiClient` and `fakeSyncClient` factories:

  ```ts
  function fakeApiClient(overrides: Partial<EntityApiClient<Widget, unknown, unknown, unknown>> = {}) {
    return {
      create: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 201 })),
      delete: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
      list: vi.fn(() => Promise.resolve<EntityApiResult<Widget[]>>({ data: [widget], status: 200 })),
      patch: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
      restore: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
      ...overrides,
    };
  }

  function fakeSyncClient(overrides: Partial<SyncClient<Widget, unknown, unknown, unknown>> = {}) {
    return {
      create: vi.fn(() => Promise.resolve(widget)),
      delete: vi.fn(() => Promise.resolve()),
      hydrate: vi.fn(() => Promise.resolve()),
      patch: vi.fn(() => Promise.resolve(widget)),
      restore: vi.fn(() => Promise.resolve(widget)),
      ...overrides,
    };
  }
  ```

  Add to `'createServiceClient — offlineCapable: true'`'s existing test, after the `patch` assertions:

  ```ts
  await client.restore('w1', {}, widget);
  // ...
  expect(syncClient.restore).toHaveBeenCalledWith('w1', {}, widget);
  expect(apiClient.restore).not.toHaveBeenCalled();
  ```

  Add to `'createServiceClient — offlineCapable: false'`'s existing test, after the `patch` assertions:

  ```ts
  const restored = await client.restore('w1', {}, widget);
  // ...
  expect(restored).toEqual(widget);
  expect(apiClient.restore).toHaveBeenCalledWith('w1', {}, expect.any(String));
  ```

- [x] **Step 7: Run and verify it fails**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `EntityApiClient`/`ServiceClient` have no `restore`.

- [x] **Step 8: Implement `EntityApiClient.restore` and `ServiceClient.restore`**

  In `components/web_client/src/services/service-client.ts`, add `restore` to `EntityApiClient`:

  ```ts
  interface EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    create(input: TInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
    delete(id: string, input: TDeleteInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
    list(): Promise<EntityApiResult<TEntity[]>>;
    patch(id: string, input: TPatchInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
    restore(id: string, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
  }
  ```

  Add `restore` to `ServiceClient`:

  ```ts
  interface ServiceClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
    delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
    hydrate(): Promise<void>;
    patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
    restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
  }
  ```

  Add to the object `createServiceClient` returns, after `patch`:

  ```ts
  async restore(entityId, body, optimistic) {
    if (config.offlineCapable) {
      return config.syncClient.restore(entityId, body, optimistic);
    }
    return unwrap(await config.apiClient.restore(entityId, uuidv7()), 'restore');
  },
  ```

  Note `EntityApiClient.restore` takes no `body` parameter (unlike `patch`) — the server derives `updated_at` from the request the same way, but the offline-direct (non-`offlineCapable`) path has no use for the body since there is nothing to reconcile against locally; only `entityId` and `idempotencyKey` are needed to hit the endpoint. (No current entity uses `offlineCapable: false`, so this branch is exercised by the unit test only, not production code, at present.)

- [x] **Step 9: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/services/service-client.ts \
    components/web_client/src/services/__tests__/service-client.unit.test.ts
  git commit -m "feat(web-client): add ServiceClient.restore()"
  ```

- [x] **Step 10: `tasks.api-client.ts` / `lists.api-client.ts` — write failing unit tests**

  Create `components/web_client/src/api/__tests__/tasks.api-client.restore.unit.test.ts`:

  ```ts
  import { describe, expect, it, vi } from 'vitest';

  import { apiClient } from '../client';
  import { restoreTaskRemote } from '../tasks.api-client';

  vi.mock('../client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../client')>();
    return { ...actual, apiClient: { ...actual.apiClient, POST: vi.fn() } };
  });

  describe('restoreTaskRemote', () => {
    it('POSTs /tasks/{id}/restore with the id path param and Idempotency-Key header', async () => {
      // Given
      const mockPost = vi.mocked(apiClient.POST);
      mockPost.mockResolvedValue({
        data: { id: 'task-1', deleted_at: null },
        error: undefined,
        response: { status: 200 },
      } as never);

      // When
      const result = await restoreTaskRemote('task-1', 'idem-key-1');

      // Then
      expect(mockPost).toHaveBeenCalledWith(
        '/tasks/{id}/restore',
        expect.objectContaining({
          params: expect.objectContaining({
            header: expect.objectContaining({ 'Idempotency-Key': 'idem-key-1' }),
            path: { id: 'task-1' },
          }),
        }),
      );
      expect(result.status).toBe(200);
    });
  });
  ```

  Create `components/web_client/src/api/__tests__/lists.api-client.restore.unit.test.ts` with the same shape, asserting `POST /lists/{id}/restore` and NOT asserting an `Idempotency-Key` requirement (List routes send the header for consistency, per the design note, but the server does not require it — this test only checks the request shape, not server enforcement).

- [x] **Step 11: Run and verify both fail**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `restoreTaskRemote`/`restoreListRemote` are not exported.

- [x] **Step 12: Implement `restoreTaskRemote` and `restoreListRemote`**

  In `components/web_client/src/api/tasks.api-client.ts`, add `type TaskRestoreInput` to the import from `./client`, then add after `deleteTaskRemote`:

  ```ts
  async function restoreTaskRemote(id: string, idempotencyKey: string): Promise<EntityApiResult<Task>> {
    const { data, error, response } = await apiClient.POST('/tasks/{id}/restore', {
      body: { updated_at: new Date().toISOString() } satisfies TaskRestoreInput,
      params: { ...taskMutationRequestParams(idempotencyKey).params, path: { id } },
    });
    return { data, error, status: response.status };
  }
  ```

  Export `restoreTaskRemote` alongside the others.

  In `components/web_client/src/api/lists.api-client.ts`, add `type ListRestoreInput` to the import from `./client`, then add after `deleteListRemote`:

  ```ts
  async function restoreListRemote(id: string, idempotencyKey: string): Promise<EntityApiResult<List>> {
    const { data, error, response } = await apiClient.POST('/lists/{id}/restore', {
      body: { updated_at: new Date().toISOString() } satisfies ListRestoreInput,
      params: { ...taskMutationRequestParams(idempotencyKey).params, path: { id } },
    });
    return { data, error, status: response.status };
  }
  ```

  Export `restoreListRemote` alongside the others.

  Note both send `updated_at: new Date().toISOString()` at call time rather than accepting it as a parameter — `EntityApiClient.restore`'s signature (Step 8) has no body parameter, matching this. The sync-queue path (Step 4/14) instead sends the client's own recorded `updated_at` through `replay.transport.ts`'s `entry.body`, not through this function — these two paths diverge deliberately: the direct API-client path (used by non-offline-capable entities, currently none) always means "restore now," while the queued path preserves the original intent timestamp for correct Last-Write-Wins reconciliation after a delay.

- [x] **Step 13: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/api/tasks.api-client.ts components/web_client/src/api/lists.api-client.ts \
    components/web_client/src/api/__tests__/tasks.api-client.restore.unit.test.ts \
    components/web_client/src/api/__tests__/lists.api-client.restore.unit.test.ts
  git commit -m "feat(web-client): add restoreTaskRemote and restoreListRemote"
  ```

- [x] **Step 14: `replay.transport.ts` — write failing unit test for dispatching queued `restore` ops**

  Create `components/web_client/src/sync/__tests__/replay.transport.restore.unit.test.ts`:

  ```ts
  import { describe, expect, it, vi } from 'vitest';

  import * as tasksApiClient from '../../api/tasks.api-client';
  import * as listsApiClient from '../../api/lists.api-client';
  import type { SyncQueueEntry } from '../../db/idb.types';
  import { sendEntry } from '../replay.transport';

  describe('sendEntry — restore op', () => {
    it('dispatches a task restore entry to restoreTaskRemote', async () => {
      // Given
      const spy = vi
        .spyOn(tasksApiClient, 'restoreTaskRemote')
        .mockResolvedValue({ data: { id: 't1' } as never, status: 200 });
      const entry: SyncQueueEntry = {
        id: 'q1',
        entity_type: 'task',
        entity_id: 't1',
        op: 'restore',
        body: { updated_at: '2026-05-20T12:00:00.000Z' },
        idempotency_key: 'idem-1',
        attempts: 0,
        next_attempt_at: '2026-05-20T12:00:00.000Z',
        created_at: '2026-05-20T12:00:00.000Z',
      };

      // When
      const result = await sendEntry(entry);

      // Then
      expect(spy).toHaveBeenCalledWith('t1', 'idem-1');
      expect(result.status).toBe(200);
    });

    it('dispatches a list restore entry to restoreListRemote', async () => {
      // Given
      const spy = vi
        .spyOn(listsApiClient, 'restoreListRemote')
        .mockResolvedValue({ data: { id: 'l1' } as never, status: 200 });
      const entry: SyncQueueEntry = {
        id: 'q2',
        entity_type: 'list',
        entity_id: 'l1',
        op: 'restore',
        body: { updated_at: '2026-05-20T12:00:00.000Z' },
        idempotency_key: 'idem-2',
        attempts: 0,
        next_attempt_at: '2026-05-20T12:00:00.000Z',
        created_at: '2026-05-20T12:00:00.000Z',
      };

      // When
      const result = await sendEntry(entry);

      // Then
      expect(spy).toHaveBeenCalledWith('l1', 'idem-2');
      expect(result.status).toBe(200);
    });
  });
  ```

- [x] **Step 15: Run and verify it fails**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `sendEntry` falls through to the `delete` branch for an unrecognized `op`, calling `deleteTaskRemote`/`deleteListRemote` instead.

- [x] **Step 16: Implement the `restore` dispatch branch**

  In `components/web_client/src/sync/replay.transport.ts`, add `restoreTaskRemote` to the import from `../api/tasks.api-client.js` and `restoreListRemote` to the import from `../api/lists.api-client.js`. Change `sendTaskEntry`:

  ```ts
  async function sendTaskEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
    if (entry.op === 'create') {
      return withStatus(await createTaskRemote(entry.body as TaskInput, entry.idempotency_key));
    }
    if (entry.op === 'patch') {
      return withStatus(await patchTaskRemote(entry.entity_id, entry.body as TaskPatchInput, entry.idempotency_key));
    }
    if (entry.op === 'restore') {
      return withStatus(await restoreTaskRemote(entry.entity_id, entry.idempotency_key));
    }
    return withStatus(await deleteTaskRemote(entry.entity_id, entry.body as TaskDeleteInput, entry.idempotency_key));
  }
  ```

  Change `sendListEntry` the same way:

  ```ts
  async function sendListEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
    if (entry.op === 'create') {
      return withStatus(await createListRemote(entry.body as ListInput, entry.idempotency_key));
    }
    if (entry.op === 'patch') {
      return withStatus(await patchListRemote(entry.entity_id, entry.body as ListPatchInput, entry.idempotency_key));
    }
    if (entry.op === 'restore') {
      return withStatus(await restoreListRemote(entry.entity_id, entry.idempotency_key));
    }
    return withStatus(await deleteListRemote(entry.entity_id, entry.body as ListDeleteInput, entry.idempotency_key));
  }
  ```

  Note `entry.body`'s `updated_at` (the original intent timestamp recorded at restore time) is not passed to `restoreTaskRemote`/`restoreListRemote` here either — those functions always send `new Date().toISOString()` (Step 12). This is a known, accepted approximation for this DevTask: a restore replayed after a long offline period reconciles against "now," not the original tap time. Flagged in Open Questions/Risks below rather than solved here — fixing it means changing `EntityApiClient.restore`'s signature to accept a body, which ripples into Step 8's interface; out of scope for this DevTask's file budget.

- [x] **Step 17: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/sync/replay.transport.ts \
    components/web_client/src/sync/__tests__/replay.transport.restore.unit.test.ts
  git commit -m "feat(web-client): dispatch queued restore ops in replay.transport"
  ```

- [x] **Step 18: Wire `restore` into `task-service-client.ts` and `list-service-client.ts`**

  These two files only assemble existing pieces (`taskApiClient`/`listApiClient` objects, passed to `createServiceClient`) — no new test needed; DevTask 11's hook-level tests exercise this wiring end-to-end.

  In `components/web_client/src/services/task-service-client.ts`, add `restoreTaskRemote` to the import from `../api/tasks.api-client.js`, and add `restore: restoreTaskRemote` to the `taskApiClient` object:

  ```ts
  const taskApiClient: EntityApiClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput> = {
    create: createTaskRemote,
    delete: deleteTaskRemote,
    list: listTasksRemote,
    patch: patchTaskRemote,
    restore: restoreTaskRemote,
  };
  ```

  In `components/web_client/src/services/list-service-client.ts`, add `restoreListRemote` to the import from `../api/lists.api-client.js`, and add `restore: restoreListRemote` to the `listApiClient` object:

  ```ts
  const listApiClient: EntityApiClient<List, ListInput, ListPatchInput, ListDeleteInput> = {
    create: createListRemote,
    delete: deleteListRemote,
    list: listListsRemote,
    patch: patchListRemote,
    restore: restoreListRemote,
  };
  ```

- [x] **Step 19: Run the full unit suite and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS — including a type-check that `EntityApiClient<Task, ...>` and `EntityApiClient<List, ...>` are now fully satisfied (TypeScript would previously have rejected these objects for missing `restore` once `service-client.ts`'s interface required it in Step 8).

  ```bash
  git add components/web_client/src/services/task-service-client.ts components/web_client/src/services/list-service-client.ts
  git commit -m "feat(web-client): wire restore into taskServiceClient and listServiceClient"
  ```

- [x] **Step 20: Full verification pass**

  ```bash
  pnpm --filter @psykl/service-task build:openapi
  pnpm --filter @psykl/web-client codegen
  pnpm -r lint && pnpm -r typecheck && pnpm -r format:check
  pnpm --filter @psykl/web-client test:unit
  ```

  Expected: all green. (`build:openapi`/`codegen` regenerate the gitignored `openapi.json`/`types.ts` locally — required for `typecheck`/`test:unit` to see the restore routes' types; produces no diff to commit.)

- [x] **Step 21: Update this spec doc's checkbox state**

  Mark DevTask 10's Steps 1-20 complete above.

### DevTask 11: Recently Deleted screen + read/write abstraction parity

**Files:** 12 (bent past the ≤10 ceiling per explicit operator override during plan review — this DevTask absorbed a narrow-scope re-open of [ADR-TE-003](../../ARCHITECTURE.md) discovered while planning; see "Decisions made during spec drafting" below and new [ADR-TE-004](../../ARCHITECTURE.md))
**Branch:** `feat/todo-experience-s2-dt11-recently-deleted-ui` (depends on DevTask 10's `taskServiceClient.restore()`/`listServiceClient.restore()`; branches off DevTask 10's branch — DevTask 10 is unmerged when this starts)
**PR:** [#80](https://github.com/jonpham/PSYKL-System/pull/80) (targets DevTask 10's branch, per the stacking rule — retargets to the Spec branch once #79 merges)
**Affected:**

- `components/web_client/src/sync/sync-client.ts` (modify — `list()`, `listPending()`, `HydrationExhaustedError`; `hydrate()`/`absorb()` become private closure details, dropped from the exported interface)
- `components/web_client/src/services/service-client.ts` (modify — mirrors `SyncClient`: `list()`, `listPending()`; `hydrate()` dropped)
- `components/web_client/src/services/task-service-client.ts` (modify — wire `listLocal: listTasks`)
- `components/web_client/src/services/list-service-client.ts` (modify — wire `listLocal: listLists`)
- `components/web_client/src/hooks/useTasks.ts` (modify — drop `db/idb` import, read via `taskServiceClient.list()`)
- `components/web_client/src/hooks/useLists.ts` (modify — drop `db/idb` import, read via `listServiceClient.list()`, export `notifyListSubscribers`)
- `components/web_client/src/components/TaskList/TaskList.tsx` (modify — drop `db/idb` import, read pending-sync state via `taskServiceClient.listPending()`; fixes a latent bug where the pending check never filtered by `entity_type`)
- `components/web_client/src/api/deleted.api-client.ts` (create — the plain `GET /deleted` read, not queued)
- `components/web_client/src/hooks/useRecentlyDeleted.ts` (create)
- `components/web_client/src/components/RecentlyDeleted/RecentlyDeleted.tsx` (create)
- `components/web_client/src/components/RecentlyDeleted/index.ts` (create)
- `components/web_client/src/App.tsx` (modify — temporary entry-point button, per the Entry-point scope decision above)

**Design notes carried into implementation:**

- **Every layer now exposes the same five operation names** (`create`/`patch`/`delete`/`restore`/`list`, plus `listPending` on the local-optimistic layers only) with layer-appropriate signatures — see the interface tables in "Decisions made during spec drafting." `EntityApiClient` is unchanged (wire layer: needs `idempotencyKey`, returns the `EntityApiResult` envelope). `SyncClient`/`ServiceClient` lose `hydrate()`/`absorb()` from their exported shape entirely; `list()` now composes what `hydrate()` used to do (best-effort remote refresh, absorbed into IDB) invisibly, then returns local rows — hooks never call hydrate/absorb, and never import `db/idb`.
- **`list()` throws `HydrationExhaustedError` only when the remote refresh fails AND local cache is empty.** Any other outcome (remote succeeds; remote fails but local has rows) resolves normally. Hooks catch `HydrationExhaustedError` specifically to render their existing error UI (`useTasks.ts`'s `'Failed to load tasks'`); any other thrown error is a genuine bug and re-thrown.
- **Hydration is attempted at most once per page load**, tracked by a `hydrated` flag private to each `createSyncClient(...)` closure (one closure per entity type, since `taskServiceClient`/`listServiceClient` are module-level singletons) — this replaces the `hydrationStarted`/`hydrated` module-level flags that `useTasks.ts`/`useLists.ts` each duplicated before this refactor. The hooks' own flags are left in place unchanged (they still gate `setSnapshot({...snapshot, loading: true})` timing) — they are now redundant with the sync layer's guard for network-attempt purposes, but harmless, and removing them is out of scope (no behavior depends on it).
- **`useLists.ts`'s `hydrateThenEnsureDefaultList()` keeps its exact original ordering:** call `listServiceClient.list()` first (best-effort — this is what may throw `HydrationExhaustedError` on a genuinely first-ever run, since local is empty before `ensureDefaultList()` has created anything; caught and discarded, matching prior behavior), then `ensureDefaultList()`, then a second `listServiceClient.list()` inside `reloadListsSnapshot()` — this second call never throws in practice, since `ensureDefaultList()` guarantees at least one local List exists and the sync layer's `hydrated` flag is already set from the first call.
- **`useLists.default-list.ts` and `useActiveList.ts` are intentionally NOT touched.** `useLists.default-list.ts`'s `ensureDefaultList()` needs one atomic cross-store IndexedDB transaction (`sync_meta` + `lists` + `sync_queue`) to stay race-safe across two tabs racing to bootstrap the default list — no `ServiceClient` method can express that. `useActiveList.ts`'s `getMeta`/`putMeta` calls manage a device-local UI preference (which list is currently open) that is never synced to the server at all — there is no entity, no `SyncClient`, nothing to route through. Both are a genuinely different category ("local-only state" / "atomic bootstrap invariant") from "read/write this synced entity," which is what this DevTask's abstraction closes.
- **`TaskList.tsx`'s pending-sync check moves to `taskServiceClient.listPending()`**, which filters `listSyncQueue()`'s entries by `entry.entity_type === 'task'` — the existing code took every queued entity id regardless of type (harmless in practice since Task/List ids never collide, being separate UUID v7 sequences, but a real filtering gap). `ListSwitcher`/`ListRow` have no equivalent pending-sync UI today, so `listServiceClient.listPending()` exists on the interface (for consistency) but has no current caller.
- **`useRecentlyDeleted.ts` reads via `taskServiceClient.list()`/`listServiceClient.list()`** (which already return every row including tombstones — the hook filters `deleted_at !== null` and within the 30-day window client-side), matching UX.md's "a user deletes a task while offline and it moves to Recently Deleted without needing the network" story. Cross-device tombstones (deleted on another device, never synced to this one) are fetched via `listDeletedRemote()` (`GET /deleted`) and merged into the in-memory view by id. The hook itself never writes them to IDB — it only needs to render them, and `restore()`'s existing optimistic-write path (already part of `SyncClient.restore()`, unchanged by this DevTask) persists a row the moment the user actually restores it. In practice a remote-only row is often _also_ pulled into local IDB independently, as a side effect of `taskServiceClient.list()`'s own pre-existing entity hydrate (Spec 1's `listTasksRemote()` already requests `include_deleted=1`) — that's an unrelated, already-shipped behavior this DevTask doesn't rely on or need to prevent. Either way, no hook-facing "push these rows into the cache" primitive is needed (an `absorb()`-shaped method was considered and rejected during plan review — see Decisions below).
- **`useRecentlyDeleted.ts` subscribes to same-tab Task/List changes** via new `subscribeToTaskChanges` (`useTasks.ts`) / `subscribeToListChanges` (`useLists.sync.ts`) exports — both thin wrappers around each hook's existing `subscribers` Set — so a delete/restore happening elsewhere in the app while the screen is open is reflected live, not just at mount. Caught by the Storybook play function (Step 27), which keeps the screen open across a create→delete→restore sequence exercised through the real UI.
- **List restore calls `notifyListSubscribers()` explicitly** (now exported from `useLists.ts`) so the `ListSwitcher` picks up a restored List immediately, mirroring `useLists.ts`'s own `mutateList` helper for patch/delete.
- Rows show remaining days (`28d`) per UX.md § 6. Restore returns an item to its original `list_id`, or the default list if that list is itself deleted — reuses DevTask 9's server-side orphan sweep for the "list itself deleted" case rather than duplicating that logic client-side.
- Storybook play function + `e2e/recently_deleted.e2e.spec.ts` per the Spec's Test Plan.

**Interfaces produced:**

```ts
// sync/sync-client.ts
interface SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
  delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
  list(): Promise<TEntity[]>; // throws HydrationExhaustedError if remote fails AND local is empty
  listPending(): Promise<string[]>; // entity ids of this entityType currently queued
  patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
  restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
}
class HydrationExhaustedError extends Error {}

// services/service-client.ts — same five/six method names, same semantics, forwards to SyncClient
interface ServiceClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
  delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
  list(): Promise<TEntity[]>;
  listPending(): Promise<string[]>;
  patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
  restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
}

// hooks/useRecentlyDeleted.ts
function useRecentlyDeleted(): { items: DeletedItem[]; restore(item: DeletedItem): Promise<void> };
type DeletedItem = { daysRemaining: number; deletedAt: string; id: string; title: string; type: 'list' | 'task' };

// api/deleted.api-client.ts
function listDeletedRemote(): Promise<EntityApiResult<DeletedResponse>>;
```

**Steps:**

- [x] **Step 1: `sync-client.ts` — rewrite the failing unit tests for `list()`/`listPending()`/`HydrationExhaustedError`**

  Replace `components/web_client/src/sync/__tests__/sync-client.unit.test.ts`'s two `hydrate()` tests (in both the task and list `describe` blocks) and add `listLocal` to every existing `createSyncClient(...)` call in the file. Full replacement content:

  ```ts
  import 'fake-indexeddb/auto';

  import { deleteDB } from 'idb';
  import { afterEach, describe, expect, it } from 'vitest';

  import type { List, Task } from '../../api/client';
  import type { EntityApiResult } from '../../api/tasks.api-client';
  import { getList, getTask, listLists, listSyncQueue, listTasks, putList, putTask } from '../../db/idb';
  import { createSyncClient, HydrationExhaustedError } from '../sync-client';

  const databaseName = 'psykl';
  const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
  const listId = '0196f0a4-8b5a-7000-8000-000000000010';
  const nowIso = '2026-06-12T16:00:00.000Z';

  const optimisticTask: Task = {
    id: taskId,
    user_id: 'local',
    title: 'wash the car',
    created_at: nowIso,
    completed_at: null,
    updated_at: nowIso,
    server_updated_at: nowIso,
    deleted_at: null,
    list_id: null,
  };

  const optimisticList: List = {
    id: listId,
    user_id: 'local',
    title: 'Groceries',
    position: 'a0',
    created_at: nowIso,
    updated_at: nowIso,
    server_updated_at: nowIso,
    deleted_at: null,
  };

  afterEach(async () => {
    await deleteDB(databaseName);
  });

  describe('createSyncClient — task entity (atomic optimistic write)', () => {
    const taskClient = createSyncClient({
      entityType: 'task',
      listLocal: listTasks,
      listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<Task[]>>,
      put: putTask,
    });

    it('create() writes the optimistic Task and enqueues a create op in one call', async () => {
      // When
      const result = await taskClient.create(
        taskId,
        { id: taskId, title: 'wash the car', updated_at: nowIso },
        optimisticTask,
      );

      // Then
      expect(result).toEqual(optimisticTask);
      await expect(getTask(taskId)).resolves.toEqual(optimisticTask);
      const queue = await listSyncQueue();
      expect(queue).toMatchObject([{ entity_id: taskId, entity_type: 'task', op: 'create' }]);
    });

    it('list() absorbs each remote Task into IDB, then returns local rows', async () => {
      // Given
      const client = createSyncClient({
        entityType: 'task',
        listLocal: listTasks,
        listRemote: () => Promise.resolve({ data: [optimisticTask], status: 200 }),
        put: putTask,
      });

      // When
      const result = await client.list();

      // Then
      expect(result).toEqual([optimisticTask]);
      await expect(getTask(taskId)).resolves.toEqual(optimisticTask);
    });

    it('list() falls back to local rows when the remote refresh fails but local has data', async () => {
      // Given
      await putTask(optimisticTask);
      const client = createSyncClient({
        entityType: 'task',
        listLocal: listTasks,
        listRemote: () => Promise.resolve({ error: 'server exploded', status: 500 }),
        put: putTask,
      });

      // When / Then
      await expect(client.list()).resolves.toEqual([optimisticTask]);
    });

    it('list() throws HydrationExhaustedError when the remote refresh fails AND local is empty', async () => {
      // Given — mirrors what useTasks.ts's hydrateTasks required before this
      // refactor: a server error with no local fallback must surface to the
      // caller's error UI, not be treated as a calm, empty success.
      const client = createSyncClient({
        entityType: 'task',
        listLocal: listTasks,
        listRemote: () => Promise.resolve({ error: 'server exploded', status: 500 }),
        put: putTask,
      });

      // When / Then
      await expect(client.list()).rejects.toThrow(HydrationExhaustedError);
    });

    it("listPending() returns only this entityType's queued entity ids", async () => {
      // Given
      await taskClient.create(taskId, { id: taskId, title: 'wash the car', updated_at: nowIso }, optimisticTask);
      const listSyncClientForFilterCheck = createSyncClient({
        entityType: 'list',
        listLocal: listLists,
        listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<List[]>>,
        put: putList,
      });
      await listSyncClientForFilterCheck.create(
        listId,
        { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
        optimisticList,
      );

      // When
      const pending = await taskClient.listPending();

      // Then — the List's queue entry must not leak into the Task client's view.
      expect(pending).toEqual([taskId]);
    });

    it('restore() writes the optimistic (un-deleted) Task then enqueues a restore op', async () => {
      // Given
      const deletedTask: Task = { ...optimisticTask, deleted_at: nowIso };
      await putTask(deletedTask);
      const restored: Task = { ...optimisticTask, deleted_at: null, updated_at: nowIso };

      // When
      await taskClient.restore(taskId, { updated_at: nowIso }, restored);

      // Then
      await expect(getTask(taskId)).resolves.toEqual(restored);
      const queue = await listSyncQueue();
      expect(queue).toMatchObject([{ entity_id: taskId, entity_type: 'task', op: 'restore' }]);
    });
  });

  describe('createSyncClient — list entity (two-step, no atomic primitive exists)', () => {
    const listClient = createSyncClient({
      entityType: 'list',
      listLocal: listLists,
      listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<List[]>>,
      put: putList,
    });

    it('create() writes the optimistic List then enqueues a create op', async () => {
      // When
      const result = await listClient.create(
        listId,
        { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
        optimisticList,
      );

      // Then
      expect(result).toEqual(optimisticList);
      await expect(getList(listId)).resolves.toEqual(optimisticList);
      const queue = await listSyncQueue();
      expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'create' }]);
    });

    it('patch() writes the optimistic List then enqueues a patch op', async () => {
      // Given
      await putList(optimisticList);
      const patched: List = { ...optimisticList, title: 'Weekly Groceries', updated_at: nowIso };

      // When
      await listClient.patch(listId, { title: 'Weekly Groceries', updated_at: nowIso }, patched);

      // Then
      await expect(getList(listId)).resolves.toEqual(patched);
      const queue = await listSyncQueue();
      expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'patch' }]);
    });

    it('delete() writes the optimistic (soft-deleted) List then enqueues a delete op', async () => {
      // Given
      await putList(optimisticList);
      const deleted: List = { ...optimisticList, deleted_at: nowIso };

      // When
      await listClient.delete(listId, { deleted_at: nowIso }, deleted);

      // Then
      await expect(getList(listId)).resolves.toEqual(deleted);
      const queue = await listSyncQueue();
      expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'delete' }]);
    });

    it('list() absorbs each remote List into IDB — the hydration path that never existed before', async () => {
      // Given
      const client = createSyncClient({
        entityType: 'list',
        listLocal: listLists,
        listRemote: () => Promise.resolve({ data: [optimisticList], status: 200 }),
        put: putList,
      });

      // When
      const result = await client.list();

      // Then
      expect(result).toEqual([optimisticList]);
      await expect(getList(listId)).resolves.toEqual(optimisticList);
    });

    it('restore() writes the optimistic (un-deleted) List then enqueues a restore op', async () => {
      // Given
      const deletedList: List = { ...optimisticList, deleted_at: nowIso };
      await putList(deletedList);
      const restored: List = { ...optimisticList, deleted_at: null, updated_at: nowIso };

      // When
      await listClient.restore(listId, { updated_at: nowIso }, restored);

      // Then
      await expect(getList(listId)).resolves.toEqual(restored);
      const queue = await listSyncQueue();
      expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'restore' }]);
    });
  });
  ```

- [x] **Step 2: Run and verify it fails**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `createSyncClient` config requires `listLocal` (type error), `list`/`listPending`/`HydrationExhaustedError` don't exist yet.

- [x] **Step 3: Implement `sync-client.ts`**

  Replace `components/web_client/src/sync/sync-client.ts` in full:

  ```ts
  import type { Task } from '../api/client';
  import type { EntityApiResult } from '../api/tasks.api-client';
  import { listSyncQueue } from '../db/idb';
  import type { EntityType, PsyklDb, SyncQueueEntry } from '../db/idb.types';
  import { enqueue } from './replay';

  interface SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
    delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
    list(): Promise<TEntity[]>;
    listPending(): Promise<string[]>;
    patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
    restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
  }

  interface SyncClientConfig<TEntity> {
    entityType: EntityType;
    listLocal: () => Promise<TEntity[]>;
    listRemote: () => Promise<EntityApiResult<TEntity[]>>;
    put: (record: TEntity, db?: PsyklDb) => Promise<void>;
  }

  class HydrationExhaustedError extends Error {
    constructor(entityType: EntityType, cause: unknown) {
      super(`${entityType} hydrate failed and no local cache exists`);
      this.name = 'HydrationExhaustedError';
      this.cause = cause;
    }
  }

  function createSyncClient<TEntity, TInput, TPatchInput, TDeleteInput>(
    config: SyncClientConfig<TEntity>,
  ): SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    let hydrated = false;

    async function absorb(records: TEntity[]): Promise<void> {
      await Promise.all(records.map((record) => config.put(record)));
    }

    // Attempts a remote refresh at most once per page load — later calls
    // no-op here regardless of whether the first attempt succeeded, matching
    // this app's existing "never auto-retry hydrate mid-session" behavior.
    async function hydrateOnce(): Promise<void> {
      if (hydrated) {
        return;
      }
      hydrated = true;
      const result = await config.listRemote();
      if (result.error || !result.data) {
        throw new Error(`hydrate failed: ${JSON.stringify(result.error)}`);
      }
      await absorb(result.data);
    }

    return {
      async create(entityId, body, optimistic) {
        await enqueueOptimistic(config, entityId, body, 'create', optimistic);
        return optimistic;
      },
      async patch(entityId, body, optimistic) {
        await enqueueOptimistic(config, entityId, body, 'patch', optimistic);
        return optimistic;
      },
      async delete(entityId, body, optimistic) {
        await enqueueOptimistic(config, entityId, body, 'delete', optimistic);
      },
      async restore(entityId, body, optimistic) {
        await enqueueOptimistic(config, entityId, body, 'restore', optimistic);
        return optimistic;
      },
      async list() {
        try {
          await hydrateOnce();
        } catch (cause) {
          const local = await config.listLocal();
          if (local.length === 0) {
            throw new HydrationExhaustedError(config.entityType, cause);
          }
          return local;
        }
        return config.listLocal();
      },
      async listPending() {
        const queue = await listSyncQueue();
        return queue.filter((entry) => entry.entity_type === config.entityType).map((entry) => entry.entity_id);
      },
    };
  }

  // `enqueue()`'s `optimisticTask` writes the Task + its queue entry in one
  // IDB transaction (`putTaskAndEnqueueSyncOp`) — preserves the atomicity
  // Task mutations already had before this refactor. No equivalent primitive
  // exists for List (useLists.ts never had one either), so List falls
  // through to the two-step put-then-enqueue path, unchanged from today.
  async function enqueueOptimistic<TEntity>(
    config: Pick<SyncClientConfig<TEntity>, 'entityType' | 'put'>,
    entityId: string,
    body: unknown,
    op: SyncQueueEntry['op'],
    optimistic: TEntity,
  ): Promise<void> {
    if (config.entityType === 'task') {
      await enqueue({ body, entityId, entityType: 'task', op, optimisticTask: optimistic as unknown as Task });
      return;
    }
    await config.put(optimistic);
    await enqueue({ body, entityId, entityType: config.entityType, op });
  }

  export { createSyncClient, HydrationExhaustedError };
  export type { SyncClient, SyncClientConfig };
  ```

- [x] **Step 4: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/sync/sync-client.ts components/web_client/src/sync/__tests__/sync-client.unit.test.ts
  git commit -m "refactor(web-client): SyncClient exposes list()/listPending(), hydrate() goes private"
  ```

- [x] **Step 5: `service-client.ts` — rewrite the failing unit tests**

  Replace `components/web_client/src/services/__tests__/service-client.unit.test.ts` in full:

  ```ts
  import { describe, expect, it, vi } from 'vitest';

  import type { EntityApiResult } from '../../api/tasks.api-client';
  import type { SyncClient } from '../../sync/sync-client';
  import { createServiceClient, type EntityApiClient } from '../service-client';

  interface Widget {
    id: string;
    title: string;
  }

  const widget: Widget = { id: 'w1', title: 'Widget' };

  function fakeApiClient(overrides: Partial<EntityApiClient<Widget, unknown, unknown, unknown>> = {}) {
    return {
      create: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 201 })),
      delete: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
      list: vi.fn(() => Promise.resolve<EntityApiResult<Widget[]>>({ data: [widget], status: 200 })),
      patch: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
      restore: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ data: widget, status: 200 })),
      ...overrides,
    };
  }

  function fakeSyncClient(overrides: Partial<SyncClient<Widget, unknown, unknown, unknown>> = {}) {
    return {
      create: vi.fn(() => Promise.resolve(widget)),
      delete: vi.fn(() => Promise.resolve()),
      list: vi.fn(() => Promise.resolve([widget])),
      listPending: vi.fn(() => Promise.resolve(['w1'])),
      patch: vi.fn(() => Promise.resolve(widget)),
      restore: vi.fn(() => Promise.resolve(widget)),
      ...overrides,
    };
  }

  describe('createServiceClient — offlineCapable: true', () => {
    it('routes create/patch/delete/restore/list/listPending to the sync client, never the api client', async () => {
      // Given
      const apiClient = fakeApiClient();
      const syncClient = fakeSyncClient();
      const client = createServiceClient({ apiClient, offlineCapable: true, syncClient });

      // When
      await client.create('w1', {}, widget);
      await client.patch('w1', {}, widget);
      await client.delete('w1', {}, widget);
      await client.restore('w1', {}, widget);
      await client.list();
      await client.listPending();

      // Then
      expect(syncClient.create).toHaveBeenCalledWith('w1', {}, widget);
      expect(syncClient.patch).toHaveBeenCalledWith('w1', {}, widget);
      expect(syncClient.delete).toHaveBeenCalledWith('w1', {}, widget);
      expect(syncClient.restore).toHaveBeenCalledWith('w1', {}, widget);
      expect(syncClient.list).toHaveBeenCalled();
      expect(syncClient.listPending).toHaveBeenCalled();
      expect(apiClient.create).not.toHaveBeenCalled();
      expect(apiClient.patch).not.toHaveBeenCalled();
      expect(apiClient.delete).not.toHaveBeenCalled();
      expect(apiClient.restore).not.toHaveBeenCalled();
      expect(apiClient.list).not.toHaveBeenCalled();
    });
  });

  describe('createServiceClient — offlineCapable: false', () => {
    it('routes create/patch/delete/list directly to the api client and unwraps {data}', async () => {
      // Given
      const apiClient = fakeApiClient();
      const client = createServiceClient({ apiClient, offlineCapable: false });

      // When
      const created = await client.create('w1', {}, widget);
      const patched = await client.patch('w1', {}, widget);
      await client.delete('w1', {}, widget);
      const restored = await client.restore('w1', {}, widget);
      const listed = await client.list();

      // Then
      expect(created).toEqual(widget);
      expect(patched).toEqual(widget);
      expect(restored).toEqual(widget);
      expect(listed).toEqual([widget]);
      expect(apiClient.create).toHaveBeenCalledWith({}, expect.any(String));
      expect(apiClient.patch).toHaveBeenCalledWith('w1', {}, expect.any(String));
      expect(apiClient.delete).toHaveBeenCalledWith('w1', {}, expect.any(String));
      expect(apiClient.restore).toHaveBeenCalledWith('w1', expect.any(String));
      expect(apiClient.list).toHaveBeenCalled();
    });

    it('listPending() is empty — direct-mode entities are never locally queued', async () => {
      // Given
      const apiClient = fakeApiClient();
      const client = createServiceClient({ apiClient, offlineCapable: false });

      // When / Then
      await expect(client.listPending()).resolves.toEqual([]);
    });

    it('throws when the api client returns an error instead of data', async () => {
      // Given
      const apiClient = fakeApiClient({
        create: vi.fn(() => Promise.resolve<EntityApiResult<Widget>>({ error: 'boom', status: 400 })),
      });
      const client = createServiceClient({ apiClient, offlineCapable: false });

      // When / Then
      await expect(client.create('w1', {}, widget)).rejects.toThrow();
    });
  });
  ```

- [x] **Step 6: Run and verify it fails**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `ServiceClient` has no `list`/`listPending`; fake objects missing `hydrate` no longer matter since it's gone from the type, but `list`/`listPending` aren't implemented yet.

- [x] **Step 7: Implement `service-client.ts`**

  Replace `components/web_client/src/services/service-client.ts` in full:

  ```ts
  import { v7 as uuidv7 } from 'uuid';

  import type { EntityApiResult } from '../api/tasks.api-client';
  import type { SyncClient } from '../sync/sync-client';

  interface EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    create(input: TInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
    delete(id: string, input: TDeleteInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
    list(): Promise<EntityApiResult<TEntity[]>>;
    patch(id: string, input: TPatchInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
    restore(id: string, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
  }

  type ServiceClientConfig<TEntity, TInput, TPatchInput, TDeleteInput> =
    | {
        apiClient: EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput>;
        offlineCapable: true;
        syncClient: SyncClient<TEntity, TInput, TPatchInput, TDeleteInput>;
      }
    | {
        apiClient: EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput>;
        offlineCapable: false;
      };

  interface ServiceClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
    delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
    list(): Promise<TEntity[]>;
    listPending(): Promise<string[]>;
    patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
    restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
  }

  function createServiceClient<TEntity, TInput, TPatchInput, TDeleteInput>(
    config: ServiceClientConfig<TEntity, TInput, TPatchInput, TDeleteInput>,
  ): ServiceClient<TEntity, TInput, TPatchInput, TDeleteInput> {
    return {
      async create(entityId, body, optimistic) {
        if (config.offlineCapable) {
          return config.syncClient.create(entityId, body, optimistic);
        }
        return unwrap(await config.apiClient.create(body, uuidv7()), 'create');
      },
      async patch(entityId, body, optimistic) {
        if (config.offlineCapable) {
          return config.syncClient.patch(entityId, body, optimistic);
        }
        return unwrap(await config.apiClient.patch(entityId, body, uuidv7()), 'patch');
      },
      async delete(entityId, body, optimistic) {
        if (config.offlineCapable) {
          await config.syncClient.delete(entityId, body, optimistic);
          return;
        }
        unwrap(await config.apiClient.delete(entityId, body, uuidv7()), 'delete');
      },
      async restore(entityId, body, optimistic) {
        if (config.offlineCapable) {
          return config.syncClient.restore(entityId, body, optimistic);
        }
        return unwrap(await config.apiClient.restore(entityId, uuidv7()), 'restore');
      },
      async list() {
        if (config.offlineCapable) {
          return config.syncClient.list();
        }
        return unwrap(await config.apiClient.list(), 'list');
      },
      async listPending() {
        // Direct (offlineCapable: false) entities are never locally queued.
        if (config.offlineCapable) {
          return config.syncClient.listPending();
        }
        return [];
      },
    };
  }

  function unwrap<T>(result: EntityApiResult<T>, op: string): T {
    if (result.error || !result.data) {
      throw new Error(`${op} failed: ${JSON.stringify(result.error)}`);
    }
    return result.data;
  }

  export { createServiceClient };
  export type { EntityApiClient, ServiceClient, ServiceClientConfig };
  ```

- [x] **Step 8: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/services/service-client.ts components/web_client/src/services/__tests__/service-client.unit.test.ts
  git commit -m "refactor(web-client): ServiceClient mirrors SyncClient's list()/listPending()"
  ```

- [x] **Step 9: `task-service-client.ts`/`list-service-client.ts` — update tests and wiring**

  In `components/web_client/src/services/__tests__/task-service-client.unit.test.ts`, replace the `hydrate()` test:

  ```ts
  it('list() pulls tasks that already exist server-side into IDB', async () => {
    // Given — a task created directly on the server, bypassing the client entirely
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await taskServiceClient.list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: taskId, title: 'wash the car' })]));
    await expect(getTask(taskId)).resolves.toMatchObject({ id: taskId, title: 'wash the car' });
  });
  ```

  In `components/web_client/src/services/__tests__/list-service-client.unit.test.ts`, replace the `hydrate()` test:

  ```ts
  it('list() pulls lists that already exist server-side into IDB — this is the fix for the gap', async () => {
    // Given — a list created directly on the server (e.g. by another device),
    // never mutated by this device, so nothing would previously have pulled
    // it down.
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await listServiceClient.list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId, title: 'Groceries' })]));
    await expect(getList(listId)).resolves.toMatchObject({ id: listId, title: 'Groceries' });
  });
  ```

  In `components/web_client/src/services/task-service-client.ts`, add `listTasks` to the import from `../db/idb` and `listLocal: listTasks` to the `createSyncClient` config:

  ```ts
  import { listTasks, putTask } from '../db/idb';
  ...
  const taskSyncClient = createSyncClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput>({
    entityType: 'task',
    listLocal: listTasks,
    listRemote: listTasksRemote,
    put: putTask,
  });
  ```

  In `components/web_client/src/services/list-service-client.ts`, add `listLists` to the import from `../db/idb` and `listLocal: listLists` to the `createSyncClient` config:

  ```ts
  import { listLists, putList } from '../db/idb';
  ...
  const listSyncClient = createSyncClient<List, ListInput, ListPatchInput, ListDeleteInput>({
    entityType: 'list',
    listLocal: listLists,
    listRemote: listListsRemote,
    put: putList,
  });
  ```

- [x] **Step 10: Run and verify it fails, then implement, then verify green and commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL first (type error — `listLocal` missing from the config passed to `createSyncClient`), then PASS once the two `listLocal` wirings above land.

  ```bash
  git add components/web_client/src/services/task-service-client.ts components/web_client/src/services/list-service-client.ts \
    components/web_client/src/services/__tests__/task-service-client.unit.test.ts \
    components/web_client/src/services/__tests__/list-service-client.unit.test.ts
  git commit -m "feat(web-client): wire listLocal into task/list SyncClient configs"
  ```

- [x] **Step 11: `useTasks.ts` — drop `db/idb`, read via `taskServiceClient.list()`**

  Existing tests (`components/web_client/src/hooks/__tests__/useTasks.unit.test.tsx`) already characterize the exact behavior this step must preserve (loading/error semantics on hydrate success, offline-with-local-data, and offline-with-no-local-data) — this is a refactor, not new behavior, so no test changes are needed; Step 12 runs them unchanged to confirm nothing regressed.

  In `components/web_client/src/hooks/useTasks.ts`:
  - Remove `import { listTasks } from '../db/idb';`
  - Add `import { HydrationExhaustedError } from '../sync/sync-client';`
  - Replace `hydrateTasks()` and `reloadSnapshot()` with:

  ```ts
  async function hydrateTasks(): Promise<void> {
    if (hydrationStarted) {
      return;
    }

    hydrationStarted = true;
    setSnapshot({ ...snapshot, loading: true });
    await reloadSnapshot({ error: null, loading: false });
  }

  async function reloadSnapshot(
    overrides: Partial<Pick<TasksSnapshot, 'error' | 'loading'>> = {},
  ): Promise<TasksSnapshot> {
    try {
      const tasks = await taskServiceClient.list();
      const nextSnapshot: TasksSnapshot = {
        error: overrides.error ?? snapshot.error,
        loading: overrides.loading ?? snapshot.loading,
        tasks: tasks
          .filter((task) => task.deleted_at === null && isInActiveList(task))
          .sort((left, right) => right.created_at.localeCompare(left.created_at)),
      };
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    } catch (error) {
      if (!(error instanceof HydrationExhaustedError)) {
        throw error;
      }
      const nextSnapshot: TasksSnapshot = {
        error: 'Failed to load tasks',
        loading: overrides.loading ?? snapshot.loading,
        tasks: [],
      };
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    }
  }
  ```

  Everything else in the file (`useTasks()`, `createTask`/`patchTask`/`deleteTask`, `notifyTasksChanged`, `resetUseTasksForTest`, `subscribe`, `getSnapshot`, `isInActiveList`, `setSnapshot`, exports) is unchanged.

- [x] **Step 12: Run and verify still green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS — all five existing `useTasks` tests still pass unmodified.

  ```bash
  git add components/web_client/src/hooks/useTasks.ts
  git commit -m "refactor(web-client): useTasks reads via taskServiceClient.list(), drops db/idb import"
  ```

- [x] **Step 13: `useLists.ts` — drop `db/idb`, read via `listServiceClient.list()`, export `notifyListSubscribers`**

  Existing tests (`components/web_client/src/hooks/__tests__/useLists.unit.test.ts`) already characterize the hydrate-then-ensure-default-list behavior this must preserve — refactor only, no test changes needed here (Step 15's `useRecentlyDeleted` tests are the first real exercise of the new `notifyListSubscribers` export).

  In `components/web_client/src/hooks/useLists.ts`:
  - Remove `import { listLists } from '../db/idb';`
  - Add `import { HydrationExhaustedError } from '../sync/sync-client';`
  - Replace `hydrateThenEnsureDefaultList()` and `reloadListsSnapshot()` with:

  ```ts
  async function hydrateThenEnsureDefaultList(): Promise<void> {
    // Pull server-known lists down first (best-effort — offline is expected
    // and not an error here, matching useTasks.ts's hydrateTasks). Only after
    // that does ensureDefaultList() decide, from local IDB state, whether this
    // device still needs to bootstrap the default list itself.
    try {
      await listServiceClient.list();
    } catch {
      // Offline on first load — ensureDefaultList() below still makes the app
      // usable; the next successful list() call catches this device up.
    }
    await ensureDefaultList();
    await reloadListsSnapshot();
  }

  async function reloadListsSnapshot(): Promise<ListRecord[]> {
    try {
      const lists = await listServiceClient.list();
      hydrated = true;
      setSnapshot(lists.filter((list) => list.deleted_at === null));
    } catch (error) {
      if (!(error instanceof HydrationExhaustedError)) {
        throw error;
      }
      // Unreachable in production: ensureDefaultList() always runs before
      // this is called from hydrateThenEnsureDefaultList(), guaranteeing at
      // least one local List exists by the time this executes. Kept for
      // type-safety symmetry with useTasks.ts's reloadSnapshot().
      hydrated = true;
      setSnapshot([]);
    }
    return snapshot;
  }
  ```

  - Change the final export line from `export { resetUseListsForTest, useLists };` to `export { notifyListSubscribers, resetUseListsForTest, useLists };`

  Everything else in the file is unchanged.

- [x] **Step 14: Run and verify still green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS — all existing `useLists` tests still pass unmodified.

  ```bash
  git add components/web_client/src/hooks/useLists.ts
  git commit -m "refactor(web-client): useLists reads via listServiceClient.list(), exports notifyListSubscribers"
  ```

- [x] **Step 15: `TaskList.tsx` — read pending-sync state via `taskServiceClient.listPending()`**

  Step 1's `listPending()` test already covers the entity_type-filter fix at the `sync-client.ts` layer; `TaskList.tsx`'s existing Storybook play function (`TaskList.stories.tsx`, asserting `getByLabelText(/pending sync/i)`) already covers this component's UI outcome and needs no changes — Step 20 re-runs it to confirm.

  In `components/web_client/src/components/TaskList/TaskList.tsx`:
  - Remove `import { listSyncQueue } from '../../db/idb';`
  - Add `import { taskServiceClient } from '../../services/task-service-client';`
  - Replace the `useEffect` body's `void listSyncQueue().then((queue) => { ... })` with:

  ```tsx
  void taskServiceClient.listPending().then((ids) => {
    if (!cancelled) {
      setPendingTaskIds((current) => {
        if (ids.length === 0 && current.size === 0) {
          return current;
        }
        return new Set(ids);
      });
    }
  });
  ```

  Everything else in the file is unchanged.

- [x] **Step 16: Run and verify still green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS (no unit test exercises this path directly; type-checking + the existing `TaskList.unit.test.tsx` suite must still pass).

  ```bash
  git add components/web_client/src/components/TaskList/TaskList.tsx
  git commit -m "refactor(web-client): TaskList reads pending-sync state via taskServiceClient.listPending()"
  ```

- [x] **Step 17: `GET /deleted` msw fixture + `deleted.api-client.ts`**

  In `components/web_client/src/test/msw-handlers.lists.ts`, export the list store's deleted rows:

  ```ts
  export type { List };

  export function getDeletedLists(): List[] {
    return listStore.filter((list) => list.deleted_at !== null);
  }
  ```

  In `components/web_client/src/test/msw-handlers.ts`, import `getDeletedLists` from `./msw-handlers.lists` and add a handler (after the task `restore` handler, before `...listHandlers`):

  ```ts
  http.get('*/deleted', ({ request }) => {
    if (request.headers.get('x-user-id') !== 'local') {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      lists: getDeletedLists(),
      tasks: store.filter((task) => task.deleted_at !== null),
    });
  }),
  ```

  Create `components/web_client/src/api/__tests__/deleted.api-client.unit.test.ts`:

  ```ts
  import { v7 as uuidv7 } from 'uuid';
  import { describe, expect, it } from 'vitest';

  import { createTaskRemote, deleteTaskRemote } from '../tasks.api-client';
  import { listDeletedRemote } from '../deleted.api-client';

  describe('listDeletedRemote', () => {
    it('GETs /deleted and returns the tombstoned Tasks and Lists', async () => {
      // Given
      const taskId = uuidv7();
      const now = new Date().toISOString();
      await createTaskRemote({ id: taskId, title: 'Milk', updated_at: now }, uuidv7());
      await deleteTaskRemote(taskId, { deleted_at: now, updated_at: now }, uuidv7());

      // When
      const result = await listDeletedRemote();

      // Then
      expect(result.status).toBe(200);
      expect(result.data?.tasks).toEqual([expect.objectContaining({ id: taskId, deleted_at: now })]);
      expect(result.data?.lists).toEqual([]);
    });
  });
  ```

  Run and verify it fails: `pnpm --filter @psykl/web-client test:unit` — FAIL, `../deleted.api-client` doesn't exist.

  Create `components/web_client/src/api/deleted.api-client.ts`:

  ```ts
  import { apiClient, taskRequestParams } from './client';
  import type { EntityApiResult } from './tasks.api-client';
  import type { components } from './types';

  type DeletedResponse = components['schemas']['DeletedResponse'];

  async function listDeletedRemote(): Promise<EntityApiResult<DeletedResponse>> {
    const { data, error, response } = await apiClient.GET('/deleted', {
      params: taskRequestParams.params,
    });
    return { data, error, status: response.status };
  }

  export { listDeletedRemote };
  export type { DeletedResponse };
  ```

  Run and verify green, then commit:

  ```bash
  git add components/web_client/src/api/deleted.api-client.ts \
    components/web_client/src/api/__tests__/deleted.api-client.unit.test.ts \
    components/web_client/src/test/msw-handlers.ts components/web_client/src/test/msw-handlers.lists.ts
  git commit -m "feat(web-client): add listDeletedRemote GET /deleted client"
  ```

- [x] **Step 18: `useRecentlyDeleted.ts` — write failing unit tests**

  Create `components/web_client/src/hooks/__tests__/useRecentlyDeleted.unit.test.ts`:

  ```ts
  import 'fake-indexeddb/auto';

  import { renderHook, waitFor } from '@testing-library/react';
  import { deleteDB } from 'idb';
  import { v7 as uuidv7 } from 'uuid';
  import { afterEach, describe, expect, it, vi } from 'vitest';

  import { createListRemote, deleteListRemote } from '../../api/lists.api-client';
  import { createTaskRemote, deleteTaskRemote } from '../../api/tasks.api-client';
  import { getList, getTask, listSyncQueue, putTask } from '../../db/idb';
  import { useRecentlyDeleted } from '../useRecentlyDeleted';

  const databaseName = 'psykl';
  const dayMs = 24 * 60 * 60 * 1000;
  const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

  vi.mock('../../sync/replay', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../sync/replay')>();
    return { ...actual, replay: mockReplay };
  });

  afterEach(async () => {
    mockReplay.mockReset();
    await deleteDB(databaseName);
  });

  function deletedTask(overrides: { deleted_at: string; id?: string }) {
    return {
      id: overrides.id ?? uuidv7(),
      user_id: 'local',
      title: 'Milk',
      created_at: overrides.deleted_at,
      completed_at: null,
      updated_at: overrides.deleted_at,
      server_updated_at: overrides.deleted_at,
      deleted_at: overrides.deleted_at,
      list_id: null,
    };
  }

  describe('useRecentlyDeleted', () => {
    it('shows a Task deleted 2 days ago with 28 days remaining', async () => {
      // Given
      await putTask(deletedTask({ deleted_at: new Date(Date.now() - 2 * dayMs).toISOString() }));

      // When
      const { result } = renderHook(() => useRecentlyDeleted());

      // Then
      await waitFor(() => {
        expect(result.current.items).toEqual([
          expect.objectContaining({ daysRemaining: 28, title: 'Milk', type: 'task' }),
        ]);
      });
    });

    it('excludes a Task deleted more than 30 days ago', async () => {
      // Given
      await putTask(deletedTask({ deleted_at: new Date(Date.now() - 31 * dayMs).toISOString() }));

      // When
      const { result } = renderHook(() => useRecentlyDeleted());

      // Then
      await waitFor(() => expect(result.current.items).toEqual([]));
    });

    it('merges in a Task deleted on another device, never persisting it until restored', async () => {
      // Given — GET /deleted's msw fixture reflects whatever createTaskRemote
      // + deleteTaskRemote left server-side; nothing local yet.
      const taskId = uuidv7();
      const now = new Date().toISOString();
      await createTaskRemote({ id: taskId, title: 'Bread', updated_at: now }, uuidv7());
      await deleteTaskRemote(taskId, { deleted_at: now, updated_at: now }, uuidv7());

      // When
      const { result } = renderHook(() => useRecentlyDeleted());

      // Then
      await waitFor(() => {
        expect(result.current.items).toEqual([expect.objectContaining({ id: taskId, title: 'Bread' })]);
      });
      await expect(getTask(taskId)).resolves.toBeUndefined();
    });

    it('restore() on a local Task clears deleted_at and enqueues a restore op', async () => {
      // Given
      const taskId = uuidv7();
      await putTask(deletedTask({ deleted_at: new Date(Date.now() - 2 * dayMs).toISOString(), id: taskId }));
      const { result } = renderHook(() => useRecentlyDeleted());
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      // When
      await result.current.restore(result.current.items[0]!);

      // Then
      await waitFor(async () => {
        expect(await getTask(taskId)).toEqual(expect.objectContaining({ deleted_at: null }));
      });
      const queue = await listSyncQueue();
      expect(queue).toEqual([expect.objectContaining({ entity_id: taskId, op: 'restore' })]);
      await waitFor(() => expect(result.current.items).toEqual([]));
    });

    it('restore() on a remote-only Task persists it for the first time', async () => {
      // Given — never seen locally before restore, per the previous test's
      // "merges ... never persisting it until restored" case.
      const taskId = uuidv7();
      const now = new Date().toISOString();
      await createTaskRemote({ id: taskId, title: 'Bread', updated_at: now }, uuidv7());
      await deleteTaskRemote(taskId, { deleted_at: now, updated_at: now }, uuidv7());
      const { result } = renderHook(() => useRecentlyDeleted());
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      // When
      await result.current.restore(result.current.items[0]!);

      // Then
      await waitFor(async () => {
        expect(await getTask(taskId)).toEqual(expect.objectContaining({ deleted_at: null, title: 'Bread' }));
      });
    });

    it('restore() on a List clears deleted_at and enqueues a restore op', async () => {
      // Given
      const listId = uuidv7();
      const deletedAt = new Date(Date.now() - 2 * dayMs).toISOString();
      await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: deletedAt }, uuidv7());
      await deleteListRemote(listId, { deleted_at: deletedAt }, uuidv7());
      const { result } = renderHook(() => useRecentlyDeleted());
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      // When
      await result.current.restore(result.current.items[0]!);

      // Then
      await waitFor(async () => {
        expect(await getList(listId)).toEqual(expect.objectContaining({ deleted_at: null }));
      });
    });
  });
  ```

- [x] **Step 19: Run and verify it fails, then implement**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `../useRecentlyDeleted` does not exist.

  Create `components/web_client/src/hooks/useRecentlyDeleted.ts`:

  ```ts
  import { useCallback, useEffect, useState } from 'react';

  import type { Task } from '../api/client';
  import { listDeletedRemote } from '../api/deleted.api-client';
  import type { ListRecord } from '../db/idb.types';
  import { listServiceClient } from '../services/list-service-client';
  import { taskServiceClient } from '../services/task-service-client';
  import { notifyListSubscribers } from './useLists';

  // 30-day Recently Deleted retention window — mirrors service-task's
  // RECENTLY_DELETED_WINDOW_MS (duplicated per-file there too, across
  // purge.service.ts / task.service.ts / list.service.ts; no shared export
  // exists for it yet, so this is a third client-side copy of the same value).
  const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  interface DeletedItem {
    daysRemaining: number;
    deletedAt: string;
    id: string;
    title: string;
    type: 'list' | 'task';
  }

  interface UseRecentlyDeletedResult {
    items: DeletedItem[];
    restore(item: DeletedItem): Promise<void>;
  }

  function useRecentlyDeleted(): UseRecentlyDeletedResult {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lists, setLists] = useState<ListRecord[]>([]);

    const reload = useCallback(async () => {
      // list() already includes every row this device has ever seen,
      // deleted or not — no separate "local" primitive needed. Rows
      // tombstoned on another device and never synced here are merged in
      // from GET /deleted purely in memory below; nothing is written to
      // IDB until the user restores one (restore()'s existing optimistic
      // write persists it then, same as any other restore).
      const [localTasks, localLists, remoteDeleted] = await Promise.all([
        taskServiceClient.list().catch(() => [] as Task[]),
        listServiceClient.list().catch(() => [] as ListRecord[]),
        listDeletedRemote()
          .then((result) => result.data ?? null)
          .catch(() => null),
      ]);
      setTasks(mergeById(localTasks, remoteDeleted?.tasks ?? []));
      setLists(mergeById(localLists, remoteDeleted?.lists ?? []));
    }, []);

    useEffect(() => {
      void reload();
    }, [reload]);

    const restore = useCallback(
      async (item: DeletedItem): Promise<void> => {
        const now = new Date().toISOString();
        if (item.type === 'task') {
          const existing = tasks.find((task) => task.id === item.id);
          if (!existing) {
            return;
          }
          await taskServiceClient.restore(
            item.id,
            { updated_at: now },
            { ...existing, deleted_at: null, updated_at: now },
          );
        } else {
          const existing = lists.find((list) => list.id === item.id);
          if (!existing) {
            return;
          }
          await listServiceClient.restore(
            item.id,
            { updated_at: now },
            { ...existing, deleted_at: null, updated_at: now },
          );
          await notifyListSubscribers();
        }
        await reload();
      },
      [tasks, lists, reload],
    );

    return { items: toDeletedItems(tasks, lists), restore };
  }

  function mergeById<T extends { id: string }>(local: T[], remoteOnly: T[]): T[] {
    const byId = new Map(local.map((row) => [row.id, row]));
    for (const row of remoteOnly) {
      if (!byId.has(row.id)) {
        byId.set(row.id, row);
      }
    }
    return [...byId.values()];
  }

  function toDeletedItems(tasks: Task[], lists: ListRecord[]): DeletedItem[] {
    const now = Date.now();
    const taskItems = tasks
      .filter((task) => task.deleted_at !== null && withinWindow(task.deleted_at, now))
      .map((task) => toItem(task.id, 'task', task.title, task.deleted_at as string, now));
    const listItems = lists
      .filter((list) => list.deleted_at !== null && withinWindow(list.deleted_at, now))
      .map((list) => toItem(list.id, 'list', list.title, list.deleted_at as string, now));
    return [...taskItems, ...listItems].sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
  }

  function withinWindow(deletedAt: string, now: number): boolean {
    return now - new Date(deletedAt).getTime() < RECENTLY_DELETED_WINDOW_MS;
  }

  function toItem(id: string, type: 'list' | 'task', title: string, deletedAt: string, now: number): DeletedItem {
    const elapsedMs = now - new Date(deletedAt).getTime();
    const daysRemaining = Math.max(0, Math.ceil((RECENTLY_DELETED_WINDOW_MS - elapsedMs) / MS_PER_DAY));
    return { daysRemaining, deletedAt, id, title, type };
  }

  export { useRecentlyDeleted };
  export type { DeletedItem };
  ```

- [x] **Step 20: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/hooks/useRecentlyDeleted.ts \
    components/web_client/src/hooks/__tests__/useRecentlyDeleted.unit.test.ts
  git commit -m "feat(web-client): add useRecentlyDeleted hook"
  ```

- [x] **Step 21: `RecentlyDeleted.tsx` — write failing unit tests**

  Create `components/web_client/src/components/RecentlyDeleted/__tests__/RecentlyDeleted.unit.test.tsx`:

  ```tsx
  import 'fake-indexeddb/auto';

  import { render, screen, waitFor } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { deleteDB } from 'idb';
  import { v7 as uuidv7 } from 'uuid';
  import { afterEach, describe, expect, it, vi } from 'vitest';

  import { putTask } from '../../../db/idb';
  import { RecentlyDeleted } from '../RecentlyDeleted';

  const databaseName = 'psykl';
  const dayMs = 24 * 60 * 60 * 1000;
  const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

  vi.mock('../../../sync/replay', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../sync/replay')>();
    return { ...actual, replay: mockReplay };
  });

  afterEach(async () => {
    mockReplay.mockReset();
    await deleteDB(databaseName);
  });

  describe('RecentlyDeleted', () => {
    it('shows "Nothing deleted in the last 30 days." when empty', async () => {
      // Arrange / Act
      render(<RecentlyDeleted open />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
      });
    });

    it('shows a deleted Task with its remaining days and restores it', async () => {
      // Arrange
      const taskId = uuidv7();
      const deletedAt = new Date(Date.now() - 2 * dayMs).toISOString();
      await putTask({
        id: taskId,
        user_id: 'local',
        title: 'Milk',
        created_at: deletedAt,
        completed_at: null,
        updated_at: deletedAt,
        server_updated_at: deletedAt,
        deleted_at: deletedAt,
        list_id: null,
      });
      render(<RecentlyDeleted open />);
      await waitFor(() => {
        expect(screen.getByRole('listitem', { name: 'Milk' })).toBeVisible();
      });
      expect(screen.getByText('28d')).toBeVisible();

      // Act
      await userEvent.click(screen.getByRole('button', { name: 'Restore Milk' }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
      });
    });
  });
  ```

- [x] **Step 22: Run and verify it fails, then implement**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `../RecentlyDeleted` does not exist.

  Create `components/web_client/src/components/RecentlyDeleted/RecentlyDeleted.tsx`:

  ```tsx
  import { useRecentlyDeleted } from '../../hooks/useRecentlyDeleted';

  interface RecentlyDeletedProps {
    onClose?: () => void;
    open: boolean;
  }

  export function RecentlyDeleted({ onClose, open }: RecentlyDeletedProps) {
    const { items, restore } = useRecentlyDeleted();

    if (!open) {
      return null;
    }

    return (
      <div
        aria-label="Recently Deleted"
        role="dialog"
        style={{ border: '1px solid #ccc', borderRadius: 4, padding: '1rem' }}
      >
        {items.length === 0 ? (
          <p>Nothing deleted in the last 30 days.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((item) => (
              <li
                aria-label={item.title}
                key={`${item.type}-${item.id}`}
                style={{
                  alignItems: 'center',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '0.5rem 0',
                }}
              >
                <span style={{ flex: 1 }}>{item.title}</span>
                <span style={{ color: '#666', fontSize: '0.85em' }}>{item.daysRemaining}d</span>
                <button aria-label={`Restore ${item.title}`} onClick={() => void restore(item)} type="button">
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
        {onClose ? (
          <button onClick={onClose} style={{ marginTop: '0.5rem' }} type="button">
            Close
          </button>
        ) : null}
      </div>
    );
  }
  ```

  Create `components/web_client/src/components/RecentlyDeleted/index.ts`:

  ```ts
  export { RecentlyDeleted } from './RecentlyDeleted';
  ```

- [x] **Step 23: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/components/RecentlyDeleted/RecentlyDeleted.tsx \
    components/web_client/src/components/RecentlyDeleted/index.ts \
    components/web_client/src/components/RecentlyDeleted/__tests__/RecentlyDeleted.unit.test.tsx
  git commit -m "feat(web-client): add RecentlyDeleted screen"
  ```

- [x] **Step 24: `App.tsx` — write failing test for the entry-point button**

  In `components/web_client/src/__tests__/App.unit.test.tsx`, add the import `import userEvent from '@testing-library/user-event';` and this test:

  ```tsx
  it('opens and closes the Recently Deleted screen from a temporary button', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Recently Deleted' }));
    expect(await screen.findByRole('dialog', { name: 'Recently Deleted' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Recently Deleted' })).toBeNull();
  });
  ```

- [x] **Step 25: Run and verify it fails, then wire the button and dialog into `App.tsx`**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — no button named "Recently Deleted".

  In `components/web_client/src/App.tsx`, add `import { RecentlyDeleted } from './components/RecentlyDeleted';` and `const [recentlyDeletedOpen, setRecentlyDeletedOpen] = useState(false);`. After the existing list-switcher `<button>` and before `<ListSwitcher .../>`:

  ```tsx
  <button
    onClick={() => setRecentlyDeletedOpen(true)}
    style={{
      background: 'none',
      border: '1px solid #ccc',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: '1rem',
      margin: '1rem 0 0 0.5rem',
      padding: '0.5rem 0.75rem',
    }}
    type="button"
  >
    Recently Deleted
  </button>
  ```

  After `<ListSwitcher ... />`:

  ```tsx
  <RecentlyDeleted onClose={() => setRecentlyDeletedOpen(false)} open={recentlyDeletedOpen} />
  ```

  Per the Entry-point scope decision above, this button is temporary — it moves into the `⋯` overflow menu once that ships in a later Spec.

- [x] **Step 26: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/App.tsx components/web_client/src/__tests__/App.unit.test.tsx
  git commit -m "feat(web-client): add temporary Recently Deleted entry point"
  ```

- [x] **Step 27: Write the Storybook Component-layer play function**

  Create `components/web_client/src/components/RecentlyDeleted/__tests__/RecentlyDeleted.stories.tsx`:

  ```tsx
  import type { Meta, StoryObj } from '@storybook/react';
  import { expect, userEvent, waitFor, within } from '@storybook/test';
  import { useState } from 'react';

  import { TaskCreateForm } from '../../TaskCreateForm';
  import { TaskList } from '../../TaskList';
  import { RecentlyDeleted } from '../RecentlyDeleted';

  /** Composes the real capture + list surfaces so the story can delete a Task
   * through the actual UI, then verify Recently Deleted picks it up — the
   * same "drive it for real, stub only the network" approach as
   * `ListSwitcher.stories.tsx`. */
  function RecentlyDeletedHarness() {
    const [open, setOpen] = useState(true);

    return (
      <div>
        <TaskCreateForm />
        <TaskList />
        <button onClick={() => setOpen(true)} type="button">
          Recently Deleted
        </button>
        <RecentlyDeleted onClose={() => setOpen(false)} open={open} />
      </div>
    );
  }

  const meta: Meta<typeof RecentlyDeletedHarness> = {
    title: 'PSYKL/RecentlyDeleted',
    component: RecentlyDeletedHarness,
    parameters: { layout: 'centered' },
  };

  export default meta;

  type Story = StoryObj<typeof RecentlyDeletedHarness>;

  export const RestoresADeletedTask: Story = {
    play: async ({ canvasElement, step }) => {
      const canvas = within(canvasElement);

      await step('Create a task', async () => {
        await userEvent.type(canvas.getByPlaceholderText('What needs doing?'), 'Milk{Enter}');
        await waitFor(() => expect(canvas.getByText('Milk')).toBeVisible());
      });

      await step('Delete it (two-tap confirm)', async () => {
        await userEvent.click(canvas.getByRole('button', { name: 'Delete Milk' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Confirm delete Milk' }));
        await waitFor(() => expect(canvas.queryByText('Milk')).toBeNull());
      });

      await step('It appears in Recently Deleted', async () => {
        await waitFor(() => {
          expect(canvas.getByRole('listitem', { name: 'Milk' })).toBeVisible();
        });
      });

      await step('Restore it and it returns to the list', async () => {
        await userEvent.click(canvas.getByRole('button', { name: 'Restore Milk' }));
        await waitFor(() => {
          expect(canvas.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
        });
        await waitFor(() => expect(canvas.getByText('Milk')).toBeVisible());
      });
    },
  };
  ```

- [x] **Step 28: Verify the story, then commit**

  Run: `pnpm --filter @psykl/web-client storybook` and open `PSYKL/RecentlyDeleted` to confirm the play function completes without a red interactions panel (CI runs the equivalent headlessly via `pnpm --filter @psykl/web-client test:component:stories`).

  ```bash
  git add components/web_client/src/components/RecentlyDeleted/__tests__/RecentlyDeleted.stories.tsx
  git commit -m "test(web-client): add RecentlyDeleted Storybook play function"
  ```

- [x] **Step 29: Write `e2e/recently_deleted.e2e.spec.ts`**

  Create `e2e/recently_deleted.e2e.spec.ts`:

  ```ts
  import { expect, test } from '@playwright/test';

  test.describe('recently deleted', () => {
    test('a user sees how many days remain before a deleted task is purged, then restores it', async ({ page }) => {
      await page.goto('/');
      await page.getByPlaceholder('What needs doing?').fill('Milk');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Milk')).toBeVisible();

      await page.getByRole('button', { name: 'Delete Milk' }).click();
      await page.getByRole('button', { name: 'Confirm delete Milk' }).click();
      await expect(page.getByText('Milk')).toHaveCount(0);

      await page.getByRole('button', { name: 'Recently Deleted' }).click();
      await expect(page.getByRole('listitem', { name: 'Milk' })).toBeVisible();
      await expect(page.getByText('30d')).toBeVisible();

      await page.getByRole('button', { name: 'Restore Milk' }).click();
      await expect(page.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByText('Milk')).toBeVisible();
    });

    test('a user restores a deleted list and its tasks come back', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Open list switcher' }).click();
      await page.getByRole('button', { name: 'New List' }).click();
      await page.getByLabel('List name').fill('Groceries');
      await page.keyboard.press('Enter');
      await page.getByRole('listitem', { name: 'Groceries' }).click();
      await page.getByPlaceholder('What needs doing?').fill('Bread');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Bread')).toBeVisible();

      await page.getByRole('button', { name: 'Open list switcher' }).click();
      await page.getByRole('button', { name: 'Delete Groceries' }).click();
      await expect(page.getByRole('listitem', { name: 'Groceries' })).toHaveCount(0);

      await page.getByRole('button', { name: 'Recently Deleted' }).click();
      await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
      await page.getByRole('button', { name: 'Restore Groceries' }).click();
      await page.getByRole('button', { name: 'Close' }).click();

      await page.getByRole('button', { name: 'Open list switcher' }).click();
      await expect(page.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
      await page.getByRole('listitem', { name: 'Groceries' }).click();
      await expect(page.getByText('Bread')).toBeVisible();
    });
  });
  ```

- [x] **Step 30: Run and verify, then commit**

  Run: `pnpm --filter e2e test recently_deleted`
  Expected: PASS (both scenarios)

  ```bash
  git add e2e/recently_deleted.e2e.spec.ts
  git commit -m "test(e2e): cover Recently Deleted restore for tasks and lists"
  ```

- [x] **Step 31: Update spec doc bookkeeping**

  Mark DevTask 11's Steps 1-30 complete above.

---

### DevTask 12: Offline pressure banner + write ceiling

**Files:** 9 (`sync/sync-pressure.ts`, `sync/sync-client.ts`, `hooks/useSyncPressure.ts`, `components/SyncPressureBanner/SyncPressureBanner.tsx`, `components/SyncPressureBanner/index.ts`, `App.tsx`, `components/TaskCreateForm/TaskCreateForm.tsx`, `e2e/offline_pressure.e2e.spec.ts`, `e2e/helpers/idb-storage.ts`)
**Branch:** `feat/todo-experience-s2-dt12-offline-pressure` — branches off DevTask 11's branch (`feat/todo-experience-s2-dt11-recently-deleted-ui`, PR [#80](https://github.com/jonpham/PSYKL-System/pull/80)), **not** off the Spec branch, and **not** off DevTask 11's actual diff. **Operator-directed sequencing exception, not a code dependency** — see "Decisions made during spec drafting" below. Retargets to the Spec integration branch once DevTasks 10 and 11 merge.
**PR:** not yet opened
**Reads from:** [`DESIGN.md`](../../initiatives/todo-experience/DESIGN.md) → Offline Posture (LOCKED) thresholds table (nag at 25, hard ceiling at 100); `UX.md` § "Offline, few queued writes" / "Offline, 25+ queued writes" / "Offline, 100+ queued writes" rows.
**Affected:**

- `components/web_client/src/sync/sync-pressure.ts` (create — pure thresholds + `SyncWriteCeilingError`)
- `components/web_client/src/sync/sync-client.ts` (modify — `enqueueOptimistic` throws `SyncWriteCeilingError` at the ceiling)
- `components/web_client/src/hooks/useSyncPressure.ts` (create — live queue-depth hook)
- `components/web_client/src/components/SyncPressureBanner/SyncPressureBanner.tsx` (create)
- `components/web_client/src/components/SyncPressureBanner/index.ts` (create)
- `components/web_client/src/App.tsx` (modify — mount the banner above the capture field)
- `components/web_client/src/components/TaskCreateForm/TaskCreateForm.tsx` (modify — disable the capture field at the ceiling)
- `e2e/offline_pressure.e2e.spec.ts` (create)
- `e2e/helpers/idb-storage.ts` (modify — add a direct-IDB `seedSyncQueue` helper; seeding 100 real tasks through the UI per test run is too slow for CI)

**Design notes carried into implementation:**

- **Single choke point.** `service-client.ts` always routes every mutation (create/patch/delete/restore, for both Task and List) through `SyncClient`, which always calls `enqueueOptimistic` (`sync-client.ts:enqueueOptimistic`) — confirmed by reading `service-client.ts`'s `offlineCapable: true` branch, which never calls the wire `apiClient` directly. This one function is therefore the only place that needs the ceiling check; no per-entity or per-hook duplication.
- **Queue depth = `(await listSyncQueue()).length`.** No new counter/store — `listSyncQueue()` already exists (`db/idb.ts`) and is already used by `SyncClient.listPending()`.
- **Live updates reuse existing change notifications**, not a new subscription primitive. `enqueueWithReplay` (`sync/page-triggers.ts`) already calls `notify()` right after enqueue and again after every `replay()` drain. `useSyncPressure` subscribes to the same `subscribeToTaskChanges`/`subscribeToListChanges` exports `useRecentlyDeleted.ts` already uses (DevTask 11) — no IDB change-event API needed.
- **`SyncWriteCeilingError` is a distinct type/name from `MAX_REPLAY_ATTEMPTS`'s "replay ceiling"** (`sync/replay.ts`, unrelated: exhausted retry count, not queue depth) — chosen specifically to avoid the naming collision.
- **Banner (nag, ≥25) vs. capture-field disable (ceiling, ≥100) are two different UI treatments**, matching UX.md's two distinct table rows verbatim: banner text `"<n> changes waiting to sync. Reconnect to save them."` stays constant across nag and ceiling (it's still true at 100+, and UX.md doesn't specify separate banner copy for the ceiling); the capture field additionally goes `disabled` with placeholder `"Reconnect to keep adding."` only at the ceiling. The field is disabled **proactively** (checked before submit, via `useSyncPressure`'s `level`), not reactively via catching `SyncWriteCeilingError` after a failed submit — matches UX.md's "capture field is disabled and reads..." (present tense, not an error state).
- **Patch/delete/restore ceiling enforcement has no dedicated per-row UI in this DevTask.** `SyncWriteCeilingError` thrown from `enqueueOptimistic` still propagates to every caller (`TaskList`'s complete-toggle, `RecentlyDeleted`'s restore, etc.) and surfaces as a generic thrown error — functionally "refused," per UX.md's "writes to existing rows are refused with the same message," but without bespoke messaging on every row type. Covered by a unit test on `enqueueOptimistic`, not a dedicated E2E scenario per row type. Out of scope: wiring a shared error-toast for all patch/delete/restore call sites (no such shared surface exists yet; would be a larger refactor, not this DevTask's "~4 files" scope).
- **Banner is not gated on `navigator.onLine`.** Queue depth can back up from a stalled server too, not only real offline — DESIGN.md's threshold table keys off unsynced-change count, not connectivity state.
- E2E scenarios seed the queue directly via IndexedDB (`seedSyncQueue`) then `page.reload()` so `useSyncPressure`'s mount-time `reload()` picks up the seeded count — mirrors `reloadAndExpectTaskVisible` (`e2e/helpers/multi-device.ts`) already used by `task_list-offline-sync.e2e.spec.ts`.

**Interfaces produced:**

```ts
// sync/sync-pressure.ts
type SyncPressureLevel = 'ok' | 'nag' | 'ceiling';
const NAG_THRESHOLD = 25;
const WRITE_CEILING = 100;
function syncPressureLevel(queueLength: number): SyncPressureLevel;
class SyncWriteCeilingError extends Error {}

// hooks/useSyncPressure.ts
interface UseSyncPressureResult {
  count: number;
  level: SyncPressureLevel;
}
function useSyncPressure(): UseSyncPressureResult;
```

- [ ] **Step 1: Write the failing unit test for `syncPressureLevel`**

  ```ts
  // components/web_client/src/sync/__tests__/sync-pressure.unit.test.ts
  import { describe, expect, it } from 'vitest';

  import { NAG_THRESHOLD, syncPressureLevel, WRITE_CEILING } from '../sync-pressure';

  describe('syncPressureLevel', () => {
    it('is ok below the nag threshold', () => {
      // Given/When/Then: 24 queued changes, one below the nag threshold
      expect(syncPressureLevel(NAG_THRESHOLD - 1)).toBe('ok');
    });

    it('is nag at the nag threshold', () => {
      expect(syncPressureLevel(NAG_THRESHOLD)).toBe('nag');
    });

    it('is nag just below the ceiling', () => {
      expect(syncPressureLevel(WRITE_CEILING - 1)).toBe('nag');
    });

    it('is ceiling at the write ceiling', () => {
      expect(syncPressureLevel(WRITE_CEILING)).toBe('ceiling');
    });
  });
  ```

  Run: `pnpm --filter @psykl/web-client test:unit sync-pressure`
  Expected: FAIL — `../sync-pressure` has no exported member `syncPressureLevel`/`NAG_THRESHOLD`/`WRITE_CEILING`.

- [ ] **Step 2: Implement `sync-pressure.ts`**

  ```ts
  // components/web_client/src/sync/sync-pressure.ts
  const NAG_THRESHOLD = 25;
  const WRITE_CEILING = 100;

  type SyncPressureLevel = 'ok' | 'nag' | 'ceiling';

  function syncPressureLevel(queueLength: number): SyncPressureLevel {
    if (queueLength >= WRITE_CEILING) {
      return 'ceiling';
    }
    if (queueLength >= NAG_THRESHOLD) {
      return 'nag';
    }
    return 'ok';
  }

  /**
   * Thrown by `sync-client.ts`'s `enqueueOptimistic` when the local queue is
   * already at `WRITE_CEILING` — offline is a degraded mode and new writes
   * are refused until the queue drains, per DESIGN.md's Offline Posture.
   */
  class SyncWriteCeilingError extends Error {
    constructor() {
      super('Reconnect to keep adding.');
      this.name = 'SyncWriteCeilingError';
    }
  }

  export { NAG_THRESHOLD, syncPressureLevel, SyncWriteCeilingError, WRITE_CEILING };
  export type { SyncPressureLevel };
  ```

  Run: `pnpm --filter @psykl/web-client test:unit sync-pressure`
  Expected: PASS

  ```bash
  git add components/web_client/src/sync/sync-pressure.ts components/web_client/src/sync/__tests__/sync-pressure.unit.test.ts
  git commit -m "feat(web-client): add sync pressure thresholds and ceiling error"
  ```

- [ ] **Step 3: Write the failing unit test enforcing the ceiling in `enqueueOptimistic`**

  Read `components/web_client/src/sync/__tests__/sync-client.unit.test.ts` first for the existing mock-`config`/fake-IDB setup this test must match.

  ```ts
  // components/web_client/src/sync/__tests__/sync-client.write-ceiling.unit.test.ts
  import 'fake-indexeddb/auto';

  import { deleteDB } from 'idb';
  import { afterEach, describe, expect, it } from 'vitest';

  import { enqueueSyncOp, listSyncQueue } from '../../db/idb';
  import { WRITE_CEILING } from '../sync-pressure';
  import { createSyncClient } from '../sync-client';

  const databaseName = 'psykl';

  afterEach(async () => {
    await deleteDB(databaseName);
  });

  describe('SyncClient write ceiling', () => {
    it('refuses a new write once the queue is at the ceiling', async () => {
      // Given a queue already at WRITE_CEILING entries
      for (let index = 0; index < WRITE_CEILING; index += 1) {
        await enqueueSyncOp({
          id: `seed-${index}`,
          entity_type: 'list',
          entity_id: `list-${index}`,
          op: 'create',
          body: {},
          idempotency_key: `idem-${index}`,
          attempts: 0,
          next_attempt_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
      const client = createSyncClient({
        entityType: 'list',
        listLocal: async () => [],
        listRemote: async () => ({ data: [] }),
        put: async () => undefined,
      });

      // When creating one more
      const attempt = client.create('list-new', {}, { id: 'list-new' });

      // Then it's refused and the queue does not grow
      await expect(attempt).rejects.toThrow('Reconnect to keep adding.');
      await expect(listSyncQueue()).resolves.toHaveLength(WRITE_CEILING);
    });
  });
  ```

  Run: `pnpm --filter @psykl/web-client test:unit sync-client.write-ceiling`
  Expected: FAIL — the write is not currently refused; queue grows to `WRITE_CEILING + 1`.

- [ ] **Step 4: Enforce the ceiling in `enqueueOptimistic`**

  In `components/web_client/src/sync/sync-client.ts`, add the import and the check at the top of `enqueueOptimistic`:

  ```ts
  import { syncPressureLevel, SyncWriteCeilingError } from './sync-pressure';
  ```

  ```ts
  async function enqueueOptimistic<TEntity>(
    config: Pick<SyncClientConfig<TEntity>, 'entityType' | 'put'>,
    entityId: string,
    body: unknown,
    op: SyncQueueEntry['op'],
    optimistic: TEntity,
  ): Promise<void> {
    const queue = await listSyncQueue();
    if (syncPressureLevel(queue.length) === 'ceiling') {
      throw new SyncWriteCeilingError();
    }
    if (config.entityType === 'task') {
      await enqueue({ body, entityId, entityType: 'task', op, optimisticTask: optimistic as unknown as Task });
      return;
    }
    await config.put(optimistic);
    await enqueue({ body, entityId, entityType: config.entityType, op });
  }
  ```

  Run: `pnpm --filter @psykl/web-client test:unit sync-client.write-ceiling`
  Expected: PASS

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS — no regressions in the existing `sync-client.unit.test.ts`/`sync-client.list.unit.test.ts`.

  ```bash
  git add components/web_client/src/sync/sync-client.ts
  git commit -m "feat(web-client): refuse new writes at the sync queue's write ceiling"
  ```

- [ ] **Step 5: Write the failing unit test for `useSyncPressure`**

  ```ts
  // components/web_client/src/hooks/__tests__/useSyncPressure.unit.test.ts
  import 'fake-indexeddb/auto';

  import { deleteDB } from 'idb';
  import { act, renderHook, waitFor } from '@testing-library/react';
  import { afterEach, describe, expect, it } from 'vitest';

  import { enqueueSyncOp } from '../../db/idb';
  import { notifyTasksChanged } from '../useTasks';
  import { useSyncPressure } from '../useSyncPressure';

  const databaseName = 'psykl';

  afterEach(async () => {
    await deleteDB(databaseName);
  });

  describe('useSyncPressure', () => {
    it('reports the current queue depth and level, and updates on change notifications', async () => {
      // Given an empty queue
      const { result } = renderHook(() => useSyncPressure());
      await waitFor(() => expect(result.current.count).toBe(0));
      expect(result.current.level).toBe('ok');

      // When 25 entries are queued and a change notification fires
      for (let index = 0; index < 25; index += 1) {
        await enqueueSyncOp({
          id: `seed-${index}`,
          entity_type: 'task',
          entity_id: `task-${index}`,
          op: 'create',
          body: {},
          idempotency_key: `idem-${index}`,
          attempts: 0,
          next_attempt_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
      await act(async () => {
        await notifyTasksChanged();
      });

      // Then the hook reflects the new depth and level
      await waitFor(() => expect(result.current.count).toBe(25));
      expect(result.current.level).toBe('nag');
    });
  });
  ```

  Run: `pnpm --filter @psykl/web-client test:unit useSyncPressure`
  Expected: FAIL — `../useSyncPressure` module does not exist.

- [ ] **Step 6: Implement `useSyncPressure`**

  ```ts
  // components/web_client/src/hooks/useSyncPressure.ts
  import { useCallback, useEffect, useState } from 'react';

  import { listSyncQueue } from '../db/idb';
  import { syncPressureLevel, type SyncPressureLevel } from '../sync/sync-pressure';
  import { subscribeToListChanges } from './useLists';
  import { subscribeToTaskChanges } from './useTasks';

  interface UseSyncPressureResult {
    count: number;
    level: SyncPressureLevel;
  }

  function useSyncPressure(): UseSyncPressureResult {
    const [count, setCount] = useState(0);

    const reload = useCallback(async () => {
      const queue = await listSyncQueue();
      setCount(queue.length);
    }, []);

    useEffect(() => {
      void reload();
      // Same live-update pattern as useRecentlyDeleted.ts (DevTask 11):
      // enqueueWithReplay's notify() fires right after every enqueue and
      // again after every replay() drain, so subscribing here catches both
      // queue growth and queue drain without a new IDB change-event API.
      const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
      const unsubscribeLists = subscribeToListChanges(() => void reload());
      return () => {
        unsubscribeTasks();
        unsubscribeLists();
      };
    }, [reload]);

    return { count, level: syncPressureLevel(count) };
  }

  export { useSyncPressure };
  export type { UseSyncPressureResult };
  ```

  Run: `pnpm --filter @psykl/web-client test:unit useSyncPressure`
  Expected: PASS

  ```bash
  git add components/web_client/src/hooks/useSyncPressure.ts components/web_client/src/hooks/__tests__/useSyncPressure.unit.test.ts
  git commit -m "feat(web-client): add useSyncPressure hook"
  ```

- [ ] **Step 7: Write the failing Storybook play-function test for `SyncPressureBanner`**

  ```tsx
  // components/web_client/src/components/SyncPressureBanner/__tests__/SyncPressureBanner.stories.tsx
  import type { Meta, StoryObj } from '@storybook/react';
  import { expect, within } from '@storybook/test';

  import { SyncPressureBanner } from '../SyncPressureBanner';

  const meta: Meta<typeof SyncPressureBanner> = {
    component: SyncPressureBanner,
    title: 'SyncPressureBanner',
  };
  export default meta;

  type Story = StoryObj<typeof SyncPressureBanner>;

  export const BelowThreshold: Story = {
    play: async ({ canvasElement }) => {
      // Arrange/Act: default fixture — empty queue
      const canvas = within(canvasElement);
      // Assert: no banner text below the nag threshold
      await expect(canvas.queryByRole('status')).toBeNull();
    },
  };
  ```

  Run: `pnpm --filter @psykl/web-client test:component SyncPressureBanner`
  Expected: FAIL — `../SyncPressureBanner` module does not exist.

- [ ] **Step 8: Implement `SyncPressureBanner`**

  ```tsx
  // components/web_client/src/components/SyncPressureBanner/SyncPressureBanner.tsx
  import { useSyncPressure } from '../../hooks/useSyncPressure';

  export function SyncPressureBanner() {
    const { count, level } = useSyncPressure();

    if (level === 'ok') {
      return null;
    }

    return (
      <p
        role="status"
        style={{
          background: '#fff3cd',
          border: '1px solid #ffe08a',
          borderRadius: 4,
          margin: '1rem 0 0',
          padding: '0.5rem 0.75rem',
        }}
      >
        {count} changes waiting to sync. Reconnect to save them.
      </p>
    );
  }
  ```

  ```ts
  // components/web_client/src/components/SyncPressureBanner/index.ts
  export { SyncPressureBanner } from './SyncPressureBanner';
  ```

  Run: `pnpm --filter @psykl/web-client test:component SyncPressureBanner`
  Expected: PASS

  ```bash
  git add components/web_client/src/components/SyncPressureBanner
  git commit -m "feat(web-client): add SyncPressureBanner component"
  ```

- [ ] **Step 9: Write the failing unit test for TaskCreateForm's ceiling behavior**

  Read `components/web_client/src/components/TaskCreateForm/__tests__/TaskCreateForm.unit.test.tsx` first — this test mocks `useSyncPressure` alongside the existing `useTasks` mock.

  ```tsx
  // Add to components/web_client/src/components/TaskCreateForm/__tests__/TaskCreateForm.unit.test.tsx
  import { useSyncPressure } from '../../../hooks/useSyncPressure';

  vi.mock('../../../hooks/useSyncPressure');

  it('disables the capture field at the write ceiling', () => {
    // Arrange
    vi.mocked(useSyncPressure).mockReturnValue({ count: 100, level: 'ceiling' });
    render(<TaskCreateForm />);

    // Assert
    expect(screen.getByLabelText('title')).toBeDisabled();
    expect(screen.getByLabelText('title')).toHaveAttribute('placeholder', 'Reconnect to keep adding.');
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });
  ```

  Run: `pnpm --filter @psykl/web-client test:unit TaskCreateForm`
  Expected: FAIL — `useSyncPressure` is not imported/used by `TaskCreateForm.tsx` yet, so the mock has no effect and the field is not disabled.

- [ ] **Step 10: Wire the ceiling into `TaskCreateForm`**

  In `components/web_client/src/components/TaskCreateForm/TaskCreateForm.tsx`:

  ```tsx
  import { useSyncPressure } from '../../hooks/useSyncPressure';
  ```

  ```tsx
  export function TaskCreateForm() {
    const { createTask } = useTasks();
    const { level } = useSyncPressure();
    const atCeiling = level === 'ceiling';
    const [title, setTitle] = useState('');
    // ...unchanged state...
  ```

  ```tsx
        <input
          id="task-title"
          aria-label="title"
          disabled={atCeiling}
          maxLength={200}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder={atCeiling ? 'Reconnect to keep adding.' : 'What needs doing?'}
          style={{ flex: 1, padding: '0.5rem' }}
          type="text"
          value={title}
        />
        <button type="submit" disabled={!title.trim() || submitting || atCeiling}>
          Create
        </button>
  ```

  Run: `pnpm --filter @psykl/web-client test:unit TaskCreateForm`
  Expected: PASS

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS — full unit suite green, no regressions.

  ```bash
  git add components/web_client/src/components/TaskCreateForm/TaskCreateForm.tsx components/web_client/src/components/TaskCreateForm/__tests__/TaskCreateForm.unit.test.tsx
  git commit -m "feat(web-client): disable task capture at the write ceiling"
  ```

- [ ] **Step 11: Mount the banner in `App.tsx`**

  In `components/web_client/src/App.tsx`, add the import and mount above `TaskCreateForm`:

  ```tsx
  import { SyncPressureBanner } from './components/SyncPressureBanner';
  ```

  ```tsx
      <RecentlyDeleted onClose={() => setRecentlyDeletedOpen(false)} open={recentlyDeletedOpen} />
      <SyncPressureBanner />
      <section data-testid="task-ui-slot">
  ```

  Run: `pnpm --filter @psykl/web-client typecheck && pnpm --filter @psykl/web-client lint`
  Expected: PASS

  ```bash
  git add components/web_client/src/App.tsx
  git commit -m "feat(web-client): mount SyncPressureBanner above the capture field"
  ```

- [ ] **Step 12: Add the `seedSyncQueue` E2E helper**

  In `e2e/helpers/idb-storage.ts`, add alongside the existing `readObjectStore`:

  ```ts
  async function seedSyncQueue(target: BrowserStorageTarget, count: number): Promise<void> {
    await target.page.evaluate(async (n) => {
      const browserIndexedDb = (
        globalThis as typeof globalThis & {
          indexedDB: { open: (databaseName: string, version: number) => any };
        }
      ).indexedDB;
      const request = browserIndexedDb.open('psykl', 2);
      const db: any = await new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        for (let index = 0; index < n; index += 1) {
          store.put({
            id: `e2e-seed-${index}-${Date.now()}`,
            entity_type: 'list',
            entity_id: `e2e-seed-list-${index}`,
            op: 'create',
            body: {},
            idempotency_key: `e2e-seed-idem-${index}`,
            attempts: 0,
            next_attempt_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    }, count);
  }
  ```

  Update the module's export line: `export { listLocalSyncQueue, listLocalTasks, seedSyncQueue };`

  No test run yet — exercised by Step 13's spec.

  ```bash
  git add e2e/helpers/idb-storage.ts
  git commit -m "test(e2e): add seedSyncQueue helper for offline-pressure fixtures"
  ```

- [ ] **Step 13: Write `offline_pressure.e2e.spec.ts` (inactive first, per TDD/E2E discipline)**

  ```ts
  // e2e/offline_pressure.e2e.spec.ts
  import { expect, test } from '@playwright/test';

  import { seedSyncQueue } from './helpers/idb-storage';
  import { openDevice, setOffline } from './helpers/multi-device';

  test.describe('Offline sync pressure', () => {
    test('a user offline with 25 queued changes sees a banner telling them to reconnect', async ({ browser }) => {
      const device = await openDevice(browser);
      await setOffline(device, true);

      await seedSyncQueue(device, 25);
      await device.page.reload();

      await expect(device.page.getByRole('status')).toContainText('25 changes waiting to sync');
    });

    test('a user offline with 100 queued changes cannot add a new task until they reconnect', async ({ browser }) => {
      const device = await openDevice(browser);
      await setOffline(device, true);

      await seedSyncQueue(device, 100);
      await device.page.reload();

      await expect(device.page.getByLabel('title')).toBeDisabled();
      await expect(device.page.getByLabel('title')).toHaveAttribute('placeholder', 'Reconnect to keep adding.');
    });
  });
  ```

  Do NOT run yet — commit skipped/inactive if the app doesn't yet reflect seeded state pre-Step-11; in this DevTask the UI pieces land first (Steps 1-11), so this spec is written active. Proceed directly to Step 14.

- [ ] **Step 14: Run the E2E spec against the real stack**

  Prerequisite: `docker compose up -d` (or the project's standard local stack) is running per `README.md` → Verify locally (UI/UX).

  Run: `pnpm --filter e2e test offline_pressure`
  Expected: PASS (both scenarios)

  ```bash
  git add e2e/offline_pressure.e2e.spec.ts
  git commit -m "test(e2e): cover offline sync pressure banner and write ceiling"
  ```

- [ ] **Step 15: Full verification pass**

  ```bash
  pnpm -r lint && pnpm -r typecheck && pnpm -r format:check
  pnpm --filter @psykl/web-client test:unit
  pnpm --filter @psykl/web-client test:component
  pnpm --filter e2e test
  ```

  Expected: all green — full E2E suite (18 specs now, up from 16), no regressions in Recently Deleted or restore-plumbing scenarios from DevTasks 10-11.

- [ ] **Step 16: Update this spec doc's checkbox state**

  Mark DevTask 12's Steps 1-15 complete above. Update frontmatter: `devtasks_complete: 6`.

---

## Test Plan

- **Unit:** schema validation for `TaskRestoreInput`/`ListRestoreInput`/`DeletedResponse` (DevTask 7); `TaskService.restoreTask`/`ListService.restoreList` LWW arithmetic (DevTask 7); purge boundary arithmetic (DevTask 8); orphan sweep healing (DevTask 9); `SyncClient`/`ServiceClient`/`replay.transport` restore-op plumbing (DevTask 10); `useSyncPressure` threshold transitions at 24/25/99/100 (DevTask 12).
- **Integration:** restore clears the tombstone + 30-day window filtering on `listDeletedTasks`/`listDeletedLists` (DevTask 7); purge with a controlled clock (DevTask 8); orphan sweep (DevTask 9).
- **Component:** restore + `GET /deleted` route contracts incl. `user_id` default-deny (DevTask 7); Storybook play function for the Recently Deleted list (DevTask 11).
- **E2E:** `recently_deleted.e2e.spec.ts` (DevTask 11), `offline_pressure.e2e.spec.ts` (DevTask 12).

New user stories to add to `UX.md` § 5 are already written there under Spec 1 and Spec 2 headings.

---

## Decisions made during spec drafting

- **DevTask 7 split from DESIGN.md's combined "Restore endpoints + 30-day purge job."** See Trilemma split #1 under `## DevTasks`. Restore endpoints + `GET /deleted` is now DevTask 7 (10 files); the purge job is a new DevTask 8 (2 files). DevTasks previously numbered 8/9/10 (Orphan sweep / UI / Offline pressure) shift to 9/10/11. No DESIGN.md decision content changed — this is DevTask-count/boundary reshaping only, pre-authorized by AGENTS.md → Design Doc Discipline.
- **`DeletedController` has no dedicated `DeletedModule`.** Declared directly on `AppModule`'s `controllers` array since it only consumes `TaskService`/`ListService`, already exported by `TaskModule`/`ListModule`. Keeps DevTask 7 at exactly 10 files instead of 11.
- **Idempotency asymmetry between `/tasks/*` and `/lists/*` is preserved as-is**, not fixed in this DevTask — see `IdempotencyInterceptor.requiresIdempotency`. Flagged as a pre-existing gap, out of scope.
- **Orphan sweep's healing logic split into `task-orphan-sweep.ts`** to satisfy the project's `max-lines: 150` ESLint rule. Revised DevTask 9's planned file count from 1 to 2.
- **The former "Recently Deleted screen + restore UI" DevTask split further, per Trilemma split #2 under `## DevTasks`.** Restore needed a new sync-queue op type (`'restore'`, joining `'create' | 'patch' | 'delete'`) touching 8 files across the API client, sync client, and service client layers, before any UI could be built on top of it. Split into DevTask 10 (plumbing, 8 files, no UI) and DevTask 11 (screen, ~5 files, depends on DevTask 10). Former DevTask 11 (Offline pressure) renumbers to DevTask 12.
- **Entry point for Recently Deleted is a temporary button, not the UX.md `⋯` overflow menu.** That menu (hosting `New Section`/`Rename List`/`Delete List`/`Settings`) does not exist in the codebase yet and is unscoped, later Spec 3+ work. Confirmed with the user before DevTask 11 starts (AGENTS.md → "stop and confirm key engineering decisions with tradeoffs").
- **Restore replayed from the offline sync queue reconciles against "now," not the original tap time.** `EntityApiClient.restore`'s signature (DevTask 10) takes no body — `restoreTaskRemote`/`restoreListRemote` always send `new Date().toISOString()`. A restore queued while offline and replayed hours later therefore wins any Last-Write-Wins race it wouldn't have won at tap time. Accepted for DevTask 10's file budget; flagged in Open Questions/Risks below rather than fixed by widening the interface.
- **`service-client-read-parity` (new decision, narrow-scope re-open of [ADR-TE-003](../../ARCHITECTURE.md)):** planning DevTask 11 surfaced that `SyncClient`/`ServiceClient` only ever grew mutation methods (`create`/`patch`/`delete`/`restore`) plus a write-only `hydrate()` side effect — no method ever returned local rows to a caller, so `useTasks.ts`/`useLists.ts` (predating ADR-TE-003) read `db/idb` directly, and the incoming `useRecentlyDeleted.ts` would have had to do the same. Resolved by adding `list()` (local-first read, transparently hydrating at most once per page load, throwing a new `HydrationExhaustedError` only when the remote refresh fails AND local is empty) and `listPending()` (local sync-queue status, filtered by `entityType` — fixing a latent gap where `TaskList.tsx`'s pending-check never filtered by entity type) to both `SyncClient` and `ServiceClient`; `hydrate()`/`absorb()` are removed from both public interfaces and become private closure details inside `sync-client.ts`. Documented as [ADR-TE-004](../../ARCHITECTURE.md), back-linked to ADR-TE-003. Narrow scope per AGENTS.md → Design Doc Discipline: no cross-component contract change, contained to `components/web_client`.
  - **`EntityApiClient`, `SyncClient`, and `ServiceClient` are NOT unified via `extends`/`implements`**, despite now sharing method names. Considered and rejected: each method's arity and return type differ meaningfully per layer (`EntityApiClient` needs `idempotencyKey` and returns the wire envelope `EntityApiResult<T>`; `SyncClient`/`ServiceClient` need `optimistic` instead and return/throw directly) — forcing a shared supertype would require widening to `unknown`, discarding the type safety this decision exists to add. The naming parallelism is intentional but stays a convention, not a type-level relationship.
  - **No `absorb()` (or any hook-facing "push these rows into the cache" primitive) was added**, despite being the initial approach considered for `useRecentlyDeleted.ts`'s cross-device tombstone case (`GET /deleted` doesn't map onto any single entity's `listRemote` config). Rejected once it became clear `restore()`'s existing optimistic-write path already persists a remote-only row the moment the user acts on it — the hook only ever needs to _render_ remote-only rows, which it does by merging `GET /deleted`'s response into in-memory state, never IDB, until restored.
  - **`AGENTS.md`'s ≤10 production-behavior-source-file ceiling is explicitly bent for this DevTask (12 files)**, by explicit operator instruction during plan review rather than the trilemma rule's default (split DevTasks). The refactor (`sync-client.ts`, `service-client.ts`, `task-service-client.ts`, `list-service-client.ts`, `useTasks.ts`, `useLists.ts`, `TaskList.tsx` — 7 files) and the Recently Deleted screen (`deleted.api-client.ts`, `useRecentlyDeleted.ts`, `RecentlyDeleted.tsx`, `RecentlyDeleted/index.ts`, `App.tsx` — 5 files) were judged not worth splitting into two DevTasks: the screen depends on the refactor's `list()` existing before it can avoid touching `db/idb` itself, and splitting would have produced an intermediate DevTask (the refactor alone) with no user-visible behavior change to review against.
- **DevTask 12 branches off DevTask 11's branch (`feat/todo-experience-s2-dt11-recently-deleted-ui`, PR #80) for sequencing convenience, not a code dependency — an explicit, documented exception to AGENTS.md → Git Conventions' "stacking is permitted only when a DevTask depends on another DevTask's unmerged changes."** Confirmed directly with the operator during plan review: DevTask 12's scope (`useSyncPressure`, `SyncPressureBanner`, the write-ceiling check, `TaskCreateForm`'s disabled state) has no code dependency on DevTask 11's diff — the dependency table's `Spec 1 DevTask 1` entry is the real technical dependency (Spec 1's sync queue foundation, already merged to `main`). This DevTask could equally be branched off the Spec integration branch. It is stacked on PR #80 purely so the operator can keep working at the current branch tip without rebasing onto the Spec branch mid-stream while DevTasks 10-11 are still under review. **Retarget to the Spec branch once DevTasks 10 and 11 merge** — do not carry the stacked base into the eventual DevTask 12 PR description without noting this is not a real dependency, so a reviewer doesn't go looking for one.

---

## Open Questions / Risks

- **The purge is destructive and scheduled (DevTask 8).** It needs a dry-run mode and a log line per purged row before it runs against robin.
- **Clock control in tests (DevTask 8).** `service-task` has no time-mocking helper yet; DevTask 8 introduces one (e.g. a `CLOCK_TOKEN` DI provider on `PurgeService`, mirroring the `DB_TOKEN` pattern) and later Specs reuse it.
- **The 25/100 thresholds are guesses (DevTask 12).** Premise P3 says live with them and change them if real use disagrees.
- **List mutation idempotency gap.** `/lists/*` routes (including the new restore route) are not idempotency-protected, unlike `/tasks/*`. Not this Spec's scope to fix; noted for awareness.
- **Queued restore reconciles against replay time, not tap time (DevTask 10).** See the Decisions entry above. Low risk in practice — restoring an item you just deleted, then going offline before it syncs, then having another device edit the same item in the interim, is a narrow window — but worth revisiting if it causes a real reported issue.

## Affected by / Depends on

- **Depends on:** Spec 1 (List entity, generalized queue).
- **Blocks:** nothing. Specs 3-7 are independent of this one.
