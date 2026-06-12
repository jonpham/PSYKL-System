import { describe, expect, it } from 'vitest';
import {
  taskControllerHarness,
  taskCreateBody,
  taskPatchBody,
  validIdempotencyKey,
  validTaskId,
} from './task.controller.contract-support.js';

describe('TaskController contract: update', () => {
  const api = taskControllerHarness();

  describe('PATCH /tasks/:id', () => {
    /**
     * Client conflict resolution is owned by:
     * components/service-task/src/task/task.service.ts
     *
     * A PATCH body is older when its updated_at is before the Task row's stored updated_at.
     * Older client edits lose to the current stored Task state.
     */
    it('returns 200 and the patched record for a newer update', async () => {
      const id = validTaskId('010');
      await api
        .postTask({
          idempotencyKey: validIdempotencyKey('010'),
          body: taskCreateBody({ id, title: 'before', updated_at: '2026-05-20T12:00:00.000Z' }),
        })
        .expect(201);

      // Given
      const patchBody = taskPatchBody({ title: 'after', updated_at: '2026-05-20T12:05:00.000Z' });

      // When
      const res = await api.patchTask({ id, idempotencyKey: validIdempotencyKey('011'), body: patchBody }).expect(200);

      // Then
      expect(res.body).toMatchObject({
        id,
        user_id: 'local',
        title: 'after',
        updated_at: '2026-05-20T12:05:00.000Z',
      });
    });

    it('returns 200 and keeps the stored record when updated_at is older than the row', async () => {
      const id = validTaskId('011');
      await api
        .postTask({
          idempotencyKey: validIdempotencyKey('012'),
          body: taskCreateBody({ id, title: 'current', updated_at: '2026-05-20T12:05:00.000Z' }),
        })
        .expect(201);

      // Given
      const olderPatchBody = taskPatchBody({
        title: 'older client edit',
        updated_at: '2026-05-20T12:00:00.000Z',
      });

      // When
      const res = await api
        .patchTask({ id, idempotencyKey: validIdempotencyKey('013'), body: olderPatchBody })
        .expect(200);

      // Then
      expect(res.body).toMatchObject({
        id,
        title: 'current',
        updated_at: '2026-05-20T12:05:00.000Z',
      });
    });

    it('returns 400 when body is invalid', async () => {
      const id = validTaskId('012');

      // Given
      const invalidBody = { title: '' };

      // When / Then
      await api.patchTask({ id, idempotencyKey: validIdempotencyKey('014'), body: invalidBody }).expect(400);
    });

    it('returns 404 when task does not exist', async () => {
      const id = validTaskId('013');

      // Given
      const patchBody = taskPatchBody({ title: 'missing' });

      // When / Then
      await api.patchTask({ id, idempotencyKey: validIdempotencyKey('015'), body: patchBody }).expect(404);
    });
  });
});
