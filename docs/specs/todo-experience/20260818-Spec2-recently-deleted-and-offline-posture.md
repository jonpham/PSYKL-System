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

This Spec contains 6 DevTasks. Each DevTask is one Pull Request, ≤10 **production behavior source files** (tests, config, docs, lockfiles, and generated migrations are exempt — see AGENTS.md → Git Conventions). Each DevTask branches off the Spec integration branch `spec/todo-experience-s2-recently-deleted-and-offline-posture` and PRs into that branch, not into `main`.

**Trilemma split #1 (AGENTS.md → Design Doc Discipline):** the DESIGN.md breakdown's original DevTask 7 ("Restore endpoints + 30-day purge job") touches 11 production behavior source files once counted precisely — one over the ≤10 ceiling. Per the trilemma rule (prefer splitting DevTasks over bending the file-count rule or deferring tests), it is split here into **DevTask 7 (Restore endpoints + `GET /deleted`)** and a new **DevTask 8 (30-day purge job)**. The former DevTask 8 (Orphan sweep) and DevTask 9 (UI) and DevTask 10 (Offline pressure) shift to DevTask 9, 10, 11 respectively. This is a narrow-scope DevTask-count adjustment, not a decision re-open — DESIGN.md's Offline Posture decisions are unchanged.

**Trilemma split #2:** the former DevTask 10 ("Recently Deleted screen + restore UI") requires wiring `restore` into the offline sync queue as a new op type — 8 files (`idb.types.ts`, `sync-client.ts`, `service-client.ts`, `replay.transport.ts`, `task-service-client.ts`, `list-service-client.ts`, `tasks.api-client.ts`, `lists.api-client.ts`) — plus the UI screen itself (hook, component, entry point, index) — 4+ files. 12+ total, over the ≤10 ceiling. Split into **DevTask 10 (restore sync-queue plumbing, no UI)** and **DevTask 11 (Recently Deleted screen)**, the latter depending on the former. The former DevTask 11 (Offline pressure) shifts to DevTask 12. `devtasks_total` becomes 6.

**Entry-point scope decision:** UX.md's eventual `⋯` list overflow menu (hosting `New Section`, `Rename List`, `Delete List`, `Settings`, and presumably `Recently Deleted`) does not exist yet in the codebase — `App.tsx` is still the minimal bootstrap shell, and the overflow menu is unscoped, later Spec 3+ work. DevTask 11 adds a plain temporary "Recently Deleted" button next to the list-switcher button rather than building that menu now. Move it into the real overflow menu when that ships.

| #   | Title                                   | Branch                                             | Files | Depends on       |
| --- | --------------------------------------- | -------------------------------------------------- | ----- | ---------------- |
| 7   | Restore endpoints + `GET /deleted`      | `feat/todo-experience-s2-dt7-restore-and-deleted`  | 10    | Spec 1 DevTask 3 |
| 8   | 30-day purge job                        | `feat/todo-experience-s2-dt8-purge-job`            | 2     | DevTask 7        |
| 9   | Orphan sweep heals dangling `list_id`   | `feat/todo-experience-s2-dt9-orphan-sweep`         | 2     | DevTask 7        |
| 10  | Restore sync-queue plumbing             | `feat/todo-experience-s2-dt10-restore-plumbing`    | 8     | DevTask 7        |
| 11  | Recently Deleted screen                 | `feat/todo-experience-s2-dt11-recently-deleted-ui` | ~5    | DevTask 10       |
| 12  | Offline pressure banner + write ceiling | `feat/todo-experience-s2-dt12-offline-pressure`    | ~4    | Spec 1 DevTask 1 |

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

**Files:** 8
**Branch:** `feat/todo-experience-s2-dt10-restore-plumbing` (branches directly off the Spec branch — DevTask 7, its only dependency, is already merged there)
**PR:** _filled once the PR is opened_
**Affected:**

- `components/web_client/src/db/idb.types.ts` (modify)
- `components/web_client/src/sync/sync-client.ts` (modify)
- `components/web_client/src/services/service-client.ts` (modify)
- `components/web_client/src/sync/replay.transport.ts` (modify)
- `components/web_client/src/api/tasks.api-client.ts` (modify)
- `components/web_client/src/api/lists.api-client.ts` (modify)
- `components/web_client/src/services/task-service-client.ts` (modify)
- `components/web_client/src/services/list-service-client.ts` (modify)

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

- [ ] **Step 1: `idb.types.ts` — add `restore` to the op union**

  In `components/web_client/src/db/idb.types.ts`, change both `SyncQueueEntry.op` and `FailedOpEntry` (which extends `SyncQueueEntry`, so only one edit is needed) from:

  ```ts
  op: 'create' | 'patch' | 'delete';
  ```

  to:

  ```ts
  op: 'create' | 'patch' | 'delete' | 'restore';
  ```

  Leave `SyncQueueEntryV1.op` unchanged (pre-Spec-1 schema; restore never existed there).

- [ ] **Step 2: `sync-client.ts` — write failing unit test for `restore()`**

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

- [ ] **Step 3: Run and verify both fail**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `taskClient.restore`/`listClient.restore` are not functions.

- [ ] **Step 4: Implement `SyncClient.restore()`**

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

- [ ] **Step 5: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/db/idb.types.ts components/web_client/src/sync/sync-client.ts \
    components/web_client/src/sync/__tests__/sync-client.unit.test.ts
  git commit -m "feat(web-client): add SyncClient.restore()"
  ```

- [ ] **Step 6: `service-client.ts` — write failing unit test for `restore()`**

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

- [ ] **Step 7: Run and verify it fails**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `EntityApiClient`/`ServiceClient` have no `restore`.

- [ ] **Step 8: Implement `EntityApiClient.restore` and `ServiceClient.restore`**

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

- [ ] **Step 9: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/services/service-client.ts \
    components/web_client/src/services/__tests__/service-client.unit.test.ts
  git commit -m "feat(web-client): add ServiceClient.restore()"
  ```

- [ ] **Step 10: `tasks.api-client.ts` / `lists.api-client.ts` — write failing unit tests**

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

- [ ] **Step 11: Run and verify both fail**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `restoreTaskRemote`/`restoreListRemote` are not exported.

- [ ] **Step 12: Implement `restoreTaskRemote` and `restoreListRemote`**

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

- [ ] **Step 13: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/api/tasks.api-client.ts components/web_client/src/api/lists.api-client.ts \
    components/web_client/src/api/__tests__/tasks.api-client.restore.unit.test.ts \
    components/web_client/src/api/__tests__/lists.api-client.restore.unit.test.ts
  git commit -m "feat(web-client): add restoreTaskRemote and restoreListRemote"
  ```

- [ ] **Step 14: `replay.transport.ts` — write failing unit test for dispatching queued `restore` ops**

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

- [ ] **Step 15: Run and verify it fails**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: FAIL — `sendEntry` falls through to the `delete` branch for an unrecognized `op`, calling `deleteTaskRemote`/`deleteListRemote` instead.

- [ ] **Step 16: Implement the `restore` dispatch branch**

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

- [ ] **Step 17: Run and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS

  ```bash
  git add components/web_client/src/sync/replay.transport.ts \
    components/web_client/src/sync/__tests__/replay.transport.restore.unit.test.ts
  git commit -m "feat(web-client): dispatch queued restore ops in replay.transport"
  ```

- [ ] **Step 18: Wire `restore` into `task-service-client.ts` and `list-service-client.ts`**

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

- [ ] **Step 19: Run the full unit suite and verify green, then commit**

  Run: `pnpm --filter @psykl/web-client test:unit`
  Expected: PASS — including a type-check that `EntityApiClient<Task, ...>` and `EntityApiClient<List, ...>` are now fully satisfied (TypeScript would previously have rejected these objects for missing `restore` once `service-client.ts`'s interface required it in Step 8).

  ```bash
  git add components/web_client/src/services/task-service-client.ts components/web_client/src/services/list-service-client.ts
  git commit -m "feat(web-client): wire restore into taskServiceClient and listServiceClient"
  ```

- [ ] **Step 20: Full verification pass**

  ```bash
  pnpm --filter @psykl/service-task build:openapi
  pnpm --filter @psykl/web-client codegen
  pnpm -r lint && pnpm -r typecheck && pnpm -r format:check
  pnpm --filter @psykl/web-client test:unit
  ```

  Expected: all green. (`build:openapi`/`codegen` regenerate the gitignored `openapi.json`/`types.ts` locally — required for `typecheck`/`test:unit` to see the restore routes' types; produces no diff to commit.)

- [ ] **Step 21: Update this spec doc's checkbox state**

  Mark DevTask 10's Steps 1-20 complete above.

### DevTask 11: Recently Deleted screen

**Files:** ~5
**Branch:** `feat/todo-experience-s2-dt11-recently-deleted-ui` (depends on DevTask 10's `taskServiceClient.restore()`/`listServiceClient.restore()`; branches directly off the Spec branch once DevTask 10 merges there, or off DevTask 10's branch if still unmerged when this starts)
**PR:** _filled once the PR is opened_
**Affected (exact list finalized when this DevTask starts, per this doc's Outline convention):**

- `components/web_client/src/hooks/useRecentlyDeleted.ts` (create)
- `components/web_client/src/components/RecentlyDeleted/RecentlyDeleted.tsx` (create)
- `components/web_client/src/components/RecentlyDeleted/index.ts` (create)
- `components/web_client/src/api/deleted.api-client.ts` (create — the plain `GET /deleted` read, not queued)
- `components/web_client/src/App.tsx` (modify — temporary entry-point button, per the Entry-point scope decision above)

**Design notes carried into implementation (finalize at DevTask start):**

- Reads local IDB tombstones (`listTasks()`/`listLists()` already return deleted rows; the hook filters `deleted_at !== null` and within the 30-day window client-side) so the screen works offline, per UX.md's `a user deletes a task while offline and it moves to Recently Deleted without needing the network` story.
- Best-effort hydration via the new `GET /deleted` read on mount, written into local IDB via `putTask`/`putList` (same pattern as `hydrateTasks()`/`hydrateThenEnsureDefaultList()`), so a List deleted on another device becomes visible locally — `listListsRemote()` cannot surface deleted Lists (server's `GET /lists` has no `include_deleted` param), so this is the only path for that case.
- Rows show remaining days (`28d`) per UX.md § 6. Restore returns an item to its original `list_id`, or the default list if that list is itself deleted — reuses DevTask 9's server-side orphan sweep for the "list itself deleted" case rather than duplicating that logic client-side.
- Storybook play function + `e2e/recently_deleted.e2e.spec.ts` per the Spec's Test Plan.

**Steps:** expanded via `superpowers:writing-plans` when this DevTask starts, against DevTask 10's actually-shipped `restore()` signatures.

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
