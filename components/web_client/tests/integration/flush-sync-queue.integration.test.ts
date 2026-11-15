import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { listSyncQueue } from '../../src/db/idb';
import { flushSyncQueue } from '../../src/services/flush-sync-queue';
import { enqueue } from '../../src/sync/replay';
import { server } from '../../src/test/setup';

const taskId = '0199eeee-0000-7000-8000-000000000001';

afterEach(async () => {
  await deleteDB('psykl');
});

describe('flushSyncQueue', () => {
  it('sends a queued write that is still waiting out its retry delay', async () => {
    // Given — enqueued "in the future", so an ordinary replay would skip it
    let sentTitle = '';
    server.use(
      http.post('*/tasks', async ({ request }) => {
        const body = (await request.json()) as { id: string; title: string; updated_at: string };
        sentTitle = body.title;
        return HttpResponse.json(
          {
            completed_at: null,
            created_at: body.updated_at,
            deleted_at: null,
            id: body.id,
            list_id: null,
            server_updated_at: body.updated_at,
            title: body.title,
            updated_at: body.updated_at,
            user_id: 'local',
          },
          { status: 201 },
        );
      }),
    );
    await enqueue(
      {
        body: { id: taskId, title: 'waiting', updated_at: '2026-11-14T10:00:00.000Z' },
        entityId: taskId,
        entityType: 'task',
        op: 'create',
      },
      { now: () => new Date(Date.now() + 60_000) },
    );

    // When
    await flushSyncQueue();

    // Then
    expect(sentTitle).toBe('waiting');
    expect(await listSyncQueue()).toEqual([]);
  });

  it('keeps the write queued when the server cannot be reached', async () => {
    // Given
    server.use(http.post('*/tasks', () => HttpResponse.error()));
    await enqueue({
      body: { id: taskId, title: 'stuck', updated_at: '2026-11-14T10:00:00.000Z' },
      entityId: taskId,
      entityType: 'task',
      op: 'create',
    });

    // When
    await flushSyncQueue();

    // Then
    expect((await listSyncQueue()).map((entry) => entry.entity_id)).toEqual([taskId]);
  });
});
