import { describe, expect, it } from 'vitest';

import {
  taskControllerHarness,
  taskCreateBody,
  taskDeleteBody,
  taskRestoreBody,
  validIdempotencyKey,
  validTaskId,
} from './task.controller.contract-support.js';

describe('TaskController contract: restore', () => {
  const api = taskControllerHarness();

  describe('POST /tasks/:id/restore', () => {
    it('returns 200, clears deleted_at, and default GET includes it again', async () => {
      const id = validTaskId('040');
      await api
        .postTask({
          idempotencyKey: validIdempotencyKey('040'),
          body: taskCreateBody({ id, title: 'restore me', updated_at: '2026-05-20T12:00:00.000Z' }),
        })
        .expect(201);
      await api
        .deleteTask({
          id,
          idempotencyKey: validIdempotencyKey('041'),
          body: taskDeleteBody({ deleted_at: '2026-05-20T12:05:00.000Z', updated_at: '2026-05-20T12:05:00.000Z' }),
        })
        .expect(200);

      // Given
      const restoreBody = taskRestoreBody({ updated_at: '2026-05-20T12:10:00.000Z' });

      // When
      const restoreRes = await api
        .restoreTask({ id, idempotencyKey: validIdempotencyKey('042'), body: restoreBody })
        .expect(200);

      // Then
      expect(restoreRes.body).toMatchObject({ id, deleted_at: null, updated_at: '2026-05-20T12:10:00.000Z' });
      const defaultGet = await api.getTasks().expect(200);
      expect((defaultGet.body as Array<{ id: string }>).map((task) => task.id)).toContain(id);
    });

    it('returns 200 and keeps the row deleted when restore updated_at is older than the row', async () => {
      const id = validTaskId('041');
      await api
        .postTask({
          idempotencyKey: validIdempotencyKey('043'),
          body: taskCreateBody({ id, title: 'stays deleted', updated_at: '2026-05-20T12:00:00.000Z' }),
        })
        .expect(201);
      await api
        .deleteTask({
          id,
          idempotencyKey: validIdempotencyKey('044'),
          body: taskDeleteBody({ deleted_at: '2026-05-20T12:10:00.000Z', updated_at: '2026-05-20T12:10:00.000Z' }),
        })
        .expect(200);

      // Given
      const staleRestoreBody = taskRestoreBody({ updated_at: '2026-05-20T12:05:00.000Z' });

      // When
      const restoreRes = await api
        .restoreTask({ id, idempotencyKey: validIdempotencyKey('045'), body: staleRestoreBody })
        .expect(200);

      // Then
      expect(restoreRes.body).toMatchObject({ id, deleted_at: '2026-05-20T12:10:00.000Z' });
    });

    it('returns 400 without an Idempotency-Key header', async () => {
      const id = validTaskId('042');

      // Given / When / Then
      await api.restoreTask({ id, body: taskRestoreBody() }).expect(400);
    });

    it('returns 404 when task does not exist', async () => {
      const id = validTaskId('043');

      // Given / When / Then
      await api.restoreTask({ id, idempotencyKey: validIdempotencyKey('046'), body: taskRestoreBody() }).expect(404);
    });
  });
});
