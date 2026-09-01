import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enqueueSyncOp, listFailedOps, listSyncQueue } from '../../db/idb';
import { MAX_REPLAY_ATTEMPTS, replay } from '../replay';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const nowIso = '2026-08-26T12:00:00.000Z';

afterEach(async () => {
  vi.restoreAllMocks();
  await deleteDB(databaseName);
});

describe('replay attempt ceiling', () => {
  it('moves an entry to failed_ops once it exhausts its attempts', async () => {
    // Given an entry that has already failed the maximum number of times
    await enqueueSyncOp({
      id: 'op-doomed',
      entity_type: 'task',
      entity_id: taskId,
      op: 'create',
      body: { title: 'doomed', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      attempts: MAX_REPLAY_ATTEMPTS - 1,
      next_attempt_at: nowIso,
      created_at: '2026-08-26T12:00:01.000Z',
    });

    const transport = vi.fn(async () => ({ status: 503 }));

    // When replay runs and the transport fails again
    await replay({ now: () => new Date(nowIso), transport });

    // Then the entry is quarantined rather than rescheduled forever
    expect(await listSyncQueue()).toHaveLength(0);
    const failed = await listFailedOps();
    expect(failed).toHaveLength(1);
    expect(failed[0]!.error).toContain('attempts');
  });
});
