---
status: TODO
issue: P2
pr:
completed_at:
created_at: 2026-08-18
initiative: todo-experience
spec_number: 2
devtasks_total: 5
devtasks_complete: 0
honors_decisions:
  - offline-posture-deletes-are-moves
  - offline-posture-thresholds
  - offline-posture-no-foreign-keys
---

# Recently Deleted + Offline Posture — Implementation Spec

> **DevTask 7 expanded to per-Step TDD detail** (via `superpowers:writing-plans`, this pass) against the interfaces Spec 1 actually shipped. DevTasks 8-11 remain outline-only and get expanded when each starts.

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

This Spec contains 5 DevTasks. Each DevTask is one Pull Request, ≤10 **production behavior source files** (tests, config, docs, lockfiles, and generated migrations are exempt — see AGENTS.md → Git Conventions). Each DevTask branches off the Spec integration branch `spec/todo-experience-s2-recently-deleted-and-offline-posture` and PRs into that branch, not into `main`.

**Trilemma split (AGENTS.md → Design Doc Discipline):** the DESIGN.md breakdown's original DevTask 7 ("Restore endpoints + 30-day purge job") touches 11 production behavior source files once counted precisely — one over the ≤10 ceiling. Per the trilemma rule (prefer splitting DevTasks over bending the file-count rule or deferring tests), it is split here into **DevTask 7 (Restore endpoints + `GET /deleted`)** and a new **DevTask 8 (30-day purge job)**. The former DevTask 8 (Orphan sweep) and DevTask 9 (UI) and DevTask 10 (Offline pressure) shift to DevTask 9, 10, 11 respectively. This is a narrow-scope DevTask-count adjustment, not a decision re-open — DESIGN.md's Offline Posture decisions are unchanged.

| #   | Title                                   | Branch                                             | Files | Depends on       |
| --- | --------------------------------------- | -------------------------------------------------- | ----- | ---------------- |
| 7   | Restore endpoints + `GET /deleted`      | `feat/todo-experience-s2-dt7-restore-and-deleted`  | 10    | Spec 1 DevTask 3 |
| 8   | 30-day purge job                        | `feat/todo-experience-s2-dt8-purge-job`            | 2     | DevTask 7        |
| 9   | Orphan sweep heals dangling `list_id`   | `feat/todo-experience-s2-dt9-orphan-sweep`         | ~3    | DevTask 7        |
| 10  | Recently Deleted screen + restore UI    | `feat/todo-experience-s2-dt10-recently-deleted-ui` | ~5    | DevTask 7        |
| 11  | Offline pressure banner + write ceiling | `feat/todo-experience-s2-dt11-offline-pressure`    | ~4    | Spec 1 DevTask 1 |

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

- [ ] **Step 1: Shared-types — write failing unit tests for the three new schemas**

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

- [ ] **Step 2: Run and verify all three fail**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: FAIL — `TaskRestoreInputSchema`, `ListRestoreInputSchema`, `DeletedResponseSchema` are not exported.

- [ ] **Step 3: Implement the three schemas**

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

- [ ] **Step 4: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: PASS

  ```bash
  git add packages/shared-types/src/schemas/task.ts packages/shared-types/src/schemas/list.ts \
    packages/shared-types/src/schemas/task-restore-input.unit.test.ts \
    packages/shared-types/src/schemas/list-restore-input.unit.test.ts \
    packages/shared-types/src/schemas/deleted-response.unit.test.ts
  git commit -m "feat(shared-types): add restore input and deleted response schemas"
  ```

- [ ] **Step 5: Write failing OpenAPI doc assertions**

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

- [ ] **Step 6: Run and verify it fails**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: FAIL — paths undefined.

- [ ] **Step 7: Register the paths**

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

- [ ] **Step 8: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/shared-types test:unit`
  Expected: PASS

  ```bash
  git add packages/shared-types/src/openapi.unit.test.ts packages/shared-types/src/openapi/task-paths.ts \
    packages/shared-types/src/openapi/list-paths.ts
  git commit -m "feat(shared-types): register restore and deleted OpenAPI paths"
  ```

- [ ] **Step 9: `TaskService.restoreTask` — write failing unit test**

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

- [ ] **Step 10: Run and verify it fails**

  Run: `pnpm --filter @psykl/service-task test:unit`
  Expected: FAIL — `restoreTask` is not a function.

- [ ] **Step 11: Implement `TaskService.restoreTask` and `listDeletedTasks`**

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

- [ ] **Step 12: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:unit`
  Expected: PASS

  ```bash
  git add components/service-task/src/task/task.service.ts \
    components/service-task/src/task/__tests__/task.service.restore.unit.test.ts
  git commit -m "feat(service-task): add TaskService.restoreTask and listDeletedTasks"
  ```

- [ ] **Step 13: `ListService.restoreList` — write failing unit test, implement, verify, commit**

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

- [ ] **Step 14: Controller contract tests — write failing tests for both restore routes**

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

- [ ] **Step 15: Run and verify both fail**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: FAIL — no `/restore` route registered (404 instead of the expected status on every case).

- [ ] **Step 16: Implement both controller routes**

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

- [ ] **Step 17: Run and verify green, then commit**

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

- [ ] **Step 18: `GET /deleted` — write failing contract test**

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

- [ ] **Step 19: Run and verify it fails**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: FAIL — 404, no `/deleted` route.

- [ ] **Step 20: Implement `DeletedController` and wire it into `AppModule`**

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

- [ ] **Step 21: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/service-task test:component`
  Expected: PASS

  ```bash
  git add components/service-task/src/deleted/deleted.controller.ts \
    components/service-task/src/deleted/__tests__/deleted.controller.contract.test.ts \
    components/service-task/src/app.module.ts
  git commit -m "feat(service-task): add GET /deleted"
  ```

- [ ] **Step 22: Extend user-id default-deny coverage**

  Add rows to the `it.each` table in `components/service-task/src/auth/__tests__/user-id.guard.contract.test.ts` for `POST /tasks/:id/restore` and `GET /deleted`; add a row to `components/service-task/src/list/__tests__/list.user-id.contract.test.ts` for `POST /lists/:id/restore`.

  Run: `pnpm --filter @psykl/service-task test:component` — verify PASS (the guard already applies globally; this step only adds coverage).

  ```bash
  git add components/service-task/src/auth/__tests__/user-id.guard.contract.test.ts \
    components/service-task/src/list/__tests__/list.user-id.contract.test.ts
  git commit -m "test(service-task): cover restore and deleted routes in user-id default-deny suite"
  ```

- [ ] **Step 23: Integration test — restore + `GET /deleted` window filtering against real pglite**

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

- [ ] **Step 24: Update this spec doc's checkbox state**

  Mark DevTask 7's Steps 1-23 complete above; do not touch `docs/features/` (feature doc is written once, at Spec 2's final DevTask). Commit as part of the DevTask 7 PR body, not a separate commit (per AGENTS.md → File & Status Discipline).

---

## Test Plan

- **Unit:** schema validation for `TaskRestoreInput`/`ListRestoreInput`/`DeletedResponse` (DevTask 7); `TaskService.restoreTask`/`ListService.restoreList` LWW arithmetic (DevTask 7); purge boundary arithmetic (DevTask 8); `useSyncPressure` threshold transitions at 24/25/99/100 (DevTask 11).
- **Integration:** restore clears the tombstone + 30-day window filtering on `listDeletedTasks`/`listDeletedLists` (DevTask 7); purge with a controlled clock (DevTask 8); orphan sweep (DevTask 9).
- **Component:** restore + `GET /deleted` route contracts incl. `user_id` default-deny (DevTask 7); Storybook play function for the Recently Deleted list (DevTask 10).
- **E2E:** `recently_deleted.e2e.spec.ts` (DevTask 10), `offline_pressure.e2e.spec.ts` (DevTask 11).

New user stories to add to `UX.md` § 5 are already written there under Spec 1 and Spec 2 headings.

---

## Decisions made during spec drafting

- **DevTask 7 split from DESIGN.md's combined "Restore endpoints + 30-day purge job."** See the Trilemma split note under `## DevTasks`. Restore endpoints + `GET /deleted` is now DevTask 7 (10 files); the purge job is a new DevTask 8 (2 files). DevTasks previously numbered 8/9/10 (Orphan sweep / UI / Offline pressure) shift to 9/10/11. No DESIGN.md decision content changed — this is DevTask-count/boundary reshaping only, pre-authorized by AGENTS.md → Design Doc Discipline.
- **`DeletedController` has no dedicated `DeletedModule`.** Declared directly on `AppModule`'s `controllers` array since it only consumes `TaskService`/`ListService`, already exported by `TaskModule`/`ListModule`. Keeps DevTask 7 at exactly 10 files instead of 11.
- **Idempotency asymmetry between `/tasks/*` and `/lists/*` is preserved as-is**, not fixed in this DevTask — see `IdempotencyInterceptor.requiresIdempotency`. Flagged as a pre-existing gap, out of scope.

---

## Open Questions / Risks

- **The purge is destructive and scheduled (DevTask 8).** It needs a dry-run mode and a log line per purged row before it runs against robin.
- **Clock control in tests (DevTask 8).** `service-task` has no time-mocking helper yet; DevTask 8 introduces one (e.g. a `CLOCK_TOKEN` DI provider on `PurgeService`, mirroring the `DB_TOKEN` pattern) and later Specs reuse it.
- **The 25/100 thresholds are guesses (DevTask 11).** Premise P3 says live with them and change them if real use disagrees.
- **List mutation idempotency gap.** `/lists/*` routes (including the new restore route) are not idempotency-protected, unlike `/tasks/*`. Not this Spec's scope to fix; noted for awareness.

## Affected by / Depends on

- **Depends on:** Spec 1 (List entity, generalized queue).
- **Blocks:** nothing. Specs 3-7 are independent of this one.
