import { describe, expect, it } from 'vitest';

import {
  listControllerHarness,
  listCreateBody,
  listDeleteBody,
  listRestoreBody,
  validListId,
} from './list.controller.contract-support.js';

describe('ListController contract: restore', () => {
  const api = listControllerHarness();

  describe('POST /lists/:id/restore', () => {
    it('returns 200, clears deleted_at, and default GET includes it again — with no Idempotency-Key header', async () => {
      const id = validListId('040');
      await api
        .createList({ body: listCreateBody({ id, title: 'restore me', updated_at: '2026-05-20T12:00:00.000Z' }) })
        .expect(201);
      await api.deleteList({ id, body: listDeleteBody({ deleted_at: '2026-05-20T12:05:00.000Z' }) }).expect(200);

      // Given
      const restoreBody = listRestoreBody({ updated_at: '2026-05-20T12:10:00.000Z' });

      // When — no Idempotency-Key header set; List routes never require one.
      const restoreRes = await api.restoreList({ id, body: restoreBody }).expect(200);

      // Then
      expect(restoreRes.body).toMatchObject({ id, deleted_at: null, updated_at: '2026-05-20T12:10:00.000Z' });
      const defaultGet = await api.getLists().expect(200);
      expect((defaultGet.body as Array<{ id: string }>).map((list) => list.id)).toContain(id);
    });

    it('returns 200 and keeps the list deleted when restore updated_at is older than the row', async () => {
      const id = validListId('041');
      // ListService.deleteList sets deleted_at but does NOT bump updated_at (unlike
      // TaskService.deleteTask) — see list.service.ts. The row's LWW clock therefore
      // stays at the create-time updated_at (12:00), not the delete time (12:10).
      await api
        .createList({ body: listCreateBody({ id, title: 'stays deleted', updated_at: '2026-05-20T12:00:00.000Z' }) })
        .expect(201);
      await api.deleteList({ id, body: listDeleteBody({ deleted_at: '2026-05-20T12:10:00.000Z' }) }).expect(200);

      // Given — older than the row's updated_at clock (12:00), not the deleted_at value.
      const staleRestoreBody = listRestoreBody({ updated_at: '2026-05-20T11:00:00.000Z' });

      // When
      const restoreRes = await api.restoreList({ id, body: staleRestoreBody }).expect(200);

      // Then
      expect(restoreRes.body).toMatchObject({ id, deleted_at: '2026-05-20T12:10:00.000Z' });
    });

    it('returns 404 when list does not exist', async () => {
      const id = validListId('042');

      // Given / When / Then
      await api.restoreList({ id, body: listRestoreBody() }).expect(404);
    });
  });
});
