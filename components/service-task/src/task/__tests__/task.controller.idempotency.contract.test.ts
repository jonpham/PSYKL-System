import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  taskControllerHarness,
  taskCreateBody,
  taskDeleteBody,
  taskPatchBody,
  validTaskId,
} from './task.controller.contract-support.js';
import { schema } from '../../db/index.js';

describe('TaskController contract: idempotency', () => {
  const api = taskControllerHarness();

  /**
   * Behavior enforced by:
   * components/service-task/src/idempotency/idempotency.interceptor.ts
   */
  describe('Idempotency-Key behavior', () => {
    it('requires Idempotency-Key on POST /tasks', async () => {
      // Given
      const body = taskCreateBody({ id: validTaskId('030'), title: 'missing key' });

      // When / Then
      await api.postTask({ body }).expect(400);
    });

    it('requires Idempotency-Key on PATCH /tasks/:id', async () => {
      const id = validTaskId('031');

      // Given
      const body = taskPatchBody({ title: 'missing key' });

      // When / Then
      await api.patchTask({ id, body }).expect(400);
    });

    it('requires Idempotency-Key on DELETE /tasks/:id', async () => {
      const id = validTaskId('032');

      // Given
      const body = taskDeleteBody();

      // When / Then
      await api.deleteTask({ id, body }).expect(400);
    });

    it('replays the cached response for the same key and request body within 24 hours', async () => {
      const body = taskCreateBody({ id: validTaskId('033'), title: 'replayed' });

      // Given
      const idempotencyKey = 'contract-post-replay';

      // When
      const first = await api.postTask({ idempotencyKey, body }).expect(201);
      const second = await api.postTask({ idempotencyKey, body }).expect(201);

      // Then
      expect(second.body).toEqual(first.body);
    });

    it('returns 409 when the same key is reused with a different request body before expiry', async () => {
      await api
        .postTask({
          idempotencyKey: 'contract-post-conflict',
          body: taskCreateBody({ id: validTaskId('034'), title: 'first' }),
        })
        .expect(201);

      // Given
      const differentBody = taskCreateBody({ id: validTaskId('035'), title: 'different' });

      // When / Then
      await api.postTask({ idempotencyKey: 'contract-post-conflict', body: differentBody }).expect(409);
    });

    it('applies a reused key again after the cached response expires', async () => {
      await api
        .postTask({
          idempotencyKey: 'contract-post-expired',
          body: taskCreateBody({ id: validTaskId('036'), title: 'expired first' }),
        })
        .expect(201);
      await api.db
        .update(schema.idempotency)
        .set({ expiresAt: new Date('2026-05-20T11:00:00.000Z') })
        .where(eq(schema.idempotency.idempotencyKey, 'contract-post-expired'));

      // Given
      const bodyAfterExpiry = taskCreateBody({ id: validTaskId('037'), title: 'expired second' });

      // When / Then
      await api.postTask({ idempotencyKey: 'contract-post-expired', body: bodyAfterExpiry }).expect(201);
    });
  });
});
