import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { getList, getTask, listSyncQueue } from '../../src/db/idb';
import { enqueue, replay } from '../../src/sync/replay';
import { server } from '../../src/test/setup';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const listId = '0196f0a4-8b5a-7000-8000-000000000002';
const nowIso = '2026-06-12T16:00:00.000Z';
const serverIso = '2026-06-12T16:00:01.000Z';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('sync replay integration', () => {
  it('sends Idempotency-Key, stores the server Task, and deletes the queue row', async () => {
    // Given
    let idempotencyKey: string | null = null;
    server.use(
      http.post('*/tasks', async ({ request }) => {
        idempotencyKey = request.headers.get('idempotency-key');
        const body = (await request.json()) as { id: string; title: string; updated_at: string };

        return HttpResponse.json(
          {
            id: body.id,
            user_id: 'local',
            title: body.title,
            created_at: serverIso,
            completed_at: null,
            updated_at: body.updated_at,
            server_updated_at: serverIso,
            deleted_at: null,
          },
          { status: 201 },
        );
      }),
    );
    await enqueue(
      {
        body: { id: taskId, title: 'queued create', updated_at: nowIso },
        entityId: taskId,
        entityType: 'task',
        op: 'create',
      },
      {
        now: () => new Date(nowIso),
      },
    );

    // When
    const result = await replay({
      now: () => new Date(serverIso),
      owner: 'page',
    });

    // Then
    expect(result).toEqual({ failed: 0, replayed: 1, retried: 0 });
    expect(idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    await expect(getTask(taskId)).resolves.toEqual({
      id: taskId,
      user_id: 'local',
      title: 'queued create',
      created_at: serverIso,
      completed_at: null,
      updated_at: nowIso,
      server_updated_at: serverIso,
      deleted_at: null,
    });
    await expect(listSyncQueue()).resolves.toEqual([]);
  });

  it('sends Idempotency-Key, stores the server List, and deletes the queue row', async () => {
    // Given
    let idempotencyKey: string | null = null;
    server.use(
      http.post('*/lists', async ({ request }) => {
        idempotencyKey = request.headers.get('idempotency-key');
        const body = (await request.json()) as { id: string; position: string; title: string; updated_at: string };

        return HttpResponse.json(
          {
            id: body.id,
            user_id: 'local',
            title: body.title,
            position: body.position,
            created_at: serverIso,
            updated_at: body.updated_at,
            server_updated_at: serverIso,
            deleted_at: null,
          },
          { status: 201 },
        );
      }),
    );
    await enqueue(
      {
        body: { id: listId, title: 'queued list create', position: 'a0', updated_at: nowIso },
        entityId: listId,
        entityType: 'list',
        op: 'create',
      },
      {
        now: () => new Date(nowIso),
      },
    );

    // When
    const result = await replay({
      now: () => new Date(serverIso),
      owner: 'page',
    });

    // Then
    expect(result).toEqual({ failed: 0, replayed: 1, retried: 0 });
    expect(idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    await expect(getList(listId)).resolves.toEqual({
      id: listId,
      user_id: 'local',
      title: 'queued list create',
      position: 'a0',
      created_at: serverIso,
      updated_at: nowIso,
      server_updated_at: serverIso,
      deleted_at: null,
    });
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
