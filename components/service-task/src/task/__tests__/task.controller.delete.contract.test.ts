import { describe, expect, it } from 'vitest';
import {
  taskControllerHarness,
  taskCreateBody,
  taskDeleteBody,
  validTaskId,
} from './task.controller.contract-support.js';

describe('TaskController contract: delete', () => {
  const api = taskControllerHarness();

  describe('DELETE /tasks/:id', () => {
    /**
     * Soft delete behavior is owned by:
     * components/service-task/src/task/task.service.ts
     *
     * DELETE marks the Task with deleted_at instead of removing the row.
     * Default list responses hide deleted Tasks; include_deleted=1 includes them for sync.
     */
    it('returns 200, marks the Task deleted, and default GET hides it', async () => {
      const id = validTaskId('020');
      await api
        .postTask({
          idempotencyKey: 'contract-delete-create-success',
          body: taskCreateBody({ id, title: 'to delete', updated_at: '2026-05-20T12:00:00.000Z' }),
        })
        .expect(201);

      // Given
      const deleteBody = taskDeleteBody({
        deleted_at: '2026-05-20T12:05:00.000Z',
        updated_at: '2026-05-20T12:05:00.000Z',
      });

      // When
      const deleteRes = await api
        .deleteTask({ id, idempotencyKey: 'contract-delete-success', body: deleteBody })
        .expect(200);

      // Then
      expect(deleteRes.body).toMatchObject({
        id,
        deleted_at: '2026-05-20T12:05:00.000Z',
        updated_at: '2026-05-20T12:05:00.000Z',
      });

      const defaultGet = await api.getTasks().expect(200);
      expect((defaultGet.body as Array<{ id: string }>).map((task) => task.id)).not.toContain(id);

      const withDeleted = await api.getTasks({ includeDeleted: '1' }).expect(200);
      expect((withDeleted.body as Array<{ id: string }>).map((task) => task.id)).toContain(id);
    });

    it('returns 200 and keeps the stored row when delete updated_at is older than the row', async () => {
      const id = validTaskId('021');
      await api
        .postTask({
          idempotencyKey: 'contract-delete-create-stale',
          body: taskCreateBody({ id, title: 'current', updated_at: '2026-05-20T12:05:00.000Z' }),
        })
        .expect(201);

      // Given
      const olderDeleteBody = taskDeleteBody({
        deleted_at: '2026-05-20T12:00:00.000Z',
        updated_at: '2026-05-20T12:00:00.000Z',
      });

      // When
      const deleteRes = await api
        .deleteTask({ id, idempotencyKey: 'contract-delete-stale', body: olderDeleteBody })
        .expect(200);

      // Then
      expect(deleteRes.body).toMatchObject({
        id,
        title: 'current',
        deleted_at: null,
        updated_at: '2026-05-20T12:05:00.000Z',
      });
    });

    it('returns 404 when task does not exist', async () => {
      const id = validTaskId('022');

      // Given
      const deleteBody = taskDeleteBody();

      // When / Then
      await api.deleteTask({ id, idempotencyKey: 'contract-delete-missing', body: deleteBody }).expect(404);
    });
  });
});
