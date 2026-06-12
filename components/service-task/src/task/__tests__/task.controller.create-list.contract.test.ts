import { describe, expect, it } from 'vitest';
import { taskControllerHarness, taskCreateBody, validTaskId } from './task.controller.contract-support.js';

describe('TaskController contract: create and list', () => {
  const api = taskControllerHarness();

  describe('POST /tasks', () => {
    /**
     * Request body validation is owned by:
     * packages/shared-types/src/schemas/task.ts
     */
    it('returns 201 and the persisted record for a valid body', async () => {
      // Given
      const id = validTaskId('000');
      const title = 'first task';
      const updatedAt = '2026-05-20T12:00:00.000Z';

      // When
      const res = await api
        .postTask({
          idempotencyKey: 'contract-post-valid',
          body: taskCreateBody({ id, title, updated_at: updatedAt }),
        })
        .expect(201);

      // Then
      expect(res.body).toMatchObject({
        id,
        user_id: 'local',
        title,
        completed_at: null,
        updated_at: updatedAt,
        deleted_at: null,
      });
      expect(res.body.created_at).toEqual(expect.any(String));
      expect(res.body.server_updated_at).toEqual(expect.any(String));
    });

    it('returns 400 when title is empty', async () => {
      const id = validTaskId('001');
      const updatedAt = '2026-05-20T12:00:00.000Z';

      // Given
      const emptyTitle = '';

      // When / Then
      await api
        .postTask({
          idempotencyKey: 'contract-post-empty-title',
          body: taskCreateBody({ id, title: emptyTitle, updated_at: updatedAt }),
        })
        .expect(400);
    });

    it('returns 400 when id is not UUID v7', async () => {
      const title = 'bad id';
      const updatedAt = '2026-05-20T12:00:00.000Z';

      // Given
      const invalidId = '123e4567-e89b-12d3-a456-426614174000';

      // When / Then
      await api
        .postTask({
          idempotencyKey: 'contract-post-bad-id',
          body: taskCreateBody({ id: invalidId, title, updated_at: updatedAt }),
        })
        .expect(400);
    });

    it('returns 400 when body has extra fields', async () => {
      const id = validTaskId('002');
      const title = 'x';
      const updatedAt = '2026-05-20T12:00:00.000Z';

      // Given
      const bodyWithExtraField = {
        ...taskCreateBody({ id, title, updated_at: updatedAt }),
        user_id: 'spoofed',
      };

      // When / Then
      await api.postTask({ idempotencyKey: 'contract-post-extra-fields', body: bodyWithExtraField }).expect(400);
    });
  });

  describe('GET /tasks', () => {
    it('returns 200 and only the current user_id tasks', async () => {
      await api
        .postTask({
          userId: 'alice',
          idempotencyKey: 'contract-list-alice-1',
          body: taskCreateBody({ id: validTaskId('003'), title: 'a1' }),
        })
        .expect(201);
      await api
        .postTask({
          userId: 'alice',
          idempotencyKey: 'contract-list-alice-2',
          body: taskCreateBody({ id: validTaskId('004'), title: 'a2' }),
        })
        .expect(201);
      await api
        .postTask({
          userId: 'bob',
          idempotencyKey: 'contract-list-bob-1',
          body: taskCreateBody({ id: validTaskId('005'), title: 'b1' }),
        })
        .expect(201);

      // Given
      const currentUserId = 'alice';

      // When
      const res = await api.getTasks({ userId: currentUserId }).expect(200);

      // Then
      const titles = (res.body as Array<{ title: string }>).map((task) => task.title).sort();
      expect(titles).toEqual(expect.arrayContaining(['a1', 'a2']));
      expect(titles).not.toContain('b1');
    });

    it('returns 400 when include_deleted is unparseable', async () => {
      // Given
      const includeDeleted = 'true';

      // When / Then
      await api.getTasks({ includeDeleted }).expect(400);
    });
  });
});
