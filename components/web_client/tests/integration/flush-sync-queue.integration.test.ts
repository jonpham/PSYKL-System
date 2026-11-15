import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { enqueueSyncOp, listFailedOps, listSyncQueue } from '../../src/db/idb';
import { flushSyncQueue } from '../../src/services/flush-sync-queue';
import { enqueue, MAX_REPLAY_ATTEMPTS } from '../../src/sync/replay';
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

  it('spends one attempt per waiting write, so one flush in an outage never empties the queue into Failed', async () => {
    // Given — two writes queued at different times, so their attempt counts differ
    server.use(http.post('*/tasks', () => new HttpResponse(null, { status: 503 })));
    const queued = (id: string, attempts: number) => ({
      attempts,
      body: { id, title: id, updated_at: '2026-11-14T10:00:00.000Z' },
      created_at: '2026-11-14T10:00:00.000Z',
      entity_id: id,
      entity_type: 'task' as const,
      id: `op-${id}`,
      idempotency_key: `key-${id}`,
      next_attempt_at: '2026-11-14T10:00:00.000Z',
      op: 'create' as const,
    });
    await enqueueSyncOp(queued('0199eeee-0000-7000-8000-000000000009', MAX_REPLAY_ATTEMPTS - 1));
    await enqueueSyncOp(queued('0199eeee-0000-7000-8000-000000000005', 5));

    // When
    await flushSyncQueue();

    // Then — the one on its last attempt gave up; the other used one attempt, not all of them
    expect((await listFailedOps()).map((entry) => entry.entity_id)).toEqual(['0199eeee-0000-7000-8000-000000000009']);
    expect((await listSyncQueue()).map((entry) => [entry.entity_id, entry.attempts])).toEqual([
      ['0199eeee-0000-7000-8000-000000000005', 6],
    ]);
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
