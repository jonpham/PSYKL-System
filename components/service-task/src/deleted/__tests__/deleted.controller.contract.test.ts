import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { listCreateBody, listDeleteBody } from '../../list/__tests__/list.controller.contract-support.js';
import {
  taskControllerHarness,
  taskCreateBody,
  taskDeleteBody,
  validIdempotencyKey,
} from '../../task/__tests__/task.controller.contract-support.js';

/**
 * Uses only taskControllerHarness — TaskController and ListController share one
 * AppModule/DB instance in production, but taskControllerHarness and
 * listControllerHarness each spin up their OWN app + in-memory pglite DB in
 * tests. Mixing the two harnesses in one test would create a List the /deleted
 * request (issued against a different app instance) could never see. All
 * requests here go through `tasks.app.getHttpServer()` directly.
 */
describe('GET /deleted', () => {
  const tasks = taskControllerHarness();

  it('returns deleted Tasks and Lists for the current user, excluding live rows', async () => {
    // listDeletedTasks/listDeletedLists filter against a real Date.now() cutoff, so
    // fixture timestamps must be near "now" rather than the fixed 2026-05-20 dates
    // used elsewhere in this suite — a hardcoded past date would age out of the
    // 30-day window as real time passes.
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

    const taskId = '0193e1c0-1234-7000-8000-000000000200';
    await tasks
      .postTask({
        idempotencyKey: validIdempotencyKey('200'),
        body: taskCreateBody({ id: taskId, title: 'gone', updated_at: createdAt }),
      })
      .expect(201);
    await tasks
      .deleteTask({
        id: taskId,
        idempotencyKey: validIdempotencyKey('201'),
        body: taskDeleteBody({ deleted_at: fiveDaysAgo, updated_at: fiveDaysAgo }),
      })
      .expect(200);

    const listId = '0193e1c0-9abc-7000-8000-000000000200';
    await request(tasks.app.getHttpServer())
      .post('/lists')
      .set('X-User-Id', 'local')
      .send(listCreateBody({ id: listId, title: 'gone list', updated_at: createdAt }))
      .expect(201);
    await request(tasks.app.getHttpServer())
      .delete(`/lists/${listId}`)
      .set('X-User-Id', 'local')
      .send(listDeleteBody({ deleted_at: fiveDaysAgo }))
      .expect(200);

    // Given / When
    const res = await request(tasks.app.getHttpServer()).get('/deleted').set('X-User-Id', 'local').expect(200);

    // Then
    expect((res.body.tasks as Array<{ id: string }>).map((t) => t.id)).toContain(taskId);
    expect((res.body.lists as Array<{ id: string }>).map((l) => l.id)).toContain(listId);
  });

  it('returns 401 with no X-User-Id header', async () => {
    await request(tasks.app.getHttpServer()).get('/deleted').expect(401);
  });
});
