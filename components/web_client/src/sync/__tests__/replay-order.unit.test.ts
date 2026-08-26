import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enqueueSyncOp, listSyncQueue } from '../../db/idb';
import { replay } from '../replay';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const nowIso = '2026-06-12T16:00:00.000Z';

afterEach(async () => {
  vi.restoreAllMocks();
  await deleteDB(databaseName);
});

describe('replay FIFO retry ordering', () => {
  it('stops replaying due entries after the first transient failure', async () => {
    // Given
    await enqueueSyncOp({
      id: 'op-1',
      entity_type: 'task',
      entity_id: taskId,
      op: 'create',
      body: { id: taskId, title: 'first', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      attempts: 0,
      next_attempt_at: nowIso,
      created_at: '2026-06-12T16:00:01.000Z',
    });
    await enqueueSyncOp({
      id: 'op-2',
      entity_type: 'task',
      entity_id: taskId,
      op: 'patch',
      body: { title: 'second', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000003',
      attempts: 0,
      next_attempt_at: nowIso,
      created_at: '2026-06-12T16:00:02.000Z',
    });
    const transport = vi.fn().mockResolvedValue({ error: 'server unavailable', status: 503 });

    // When
    const result = await replay({
      now: () => new Date(nowIso),
      owner: 'page',
      transport,
    });

    // Then
    expect(result).toEqual({ failed: 0, replayed: 0, retried: 1 });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[0].id).toBe('op-1');
    expect((await listSyncQueue()).map((entry) => entry.id)).toEqual(['op-1', 'op-2']);
  });
});
