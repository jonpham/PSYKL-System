import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enqueueSyncOp, getMeta } from '../../db/idb';
import { replay } from '../replay';

const databaseName = 'psykl';
const nowIso = '2026-06-12T16:00:00.000Z';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';

afterEach(async () => {
  vi.restoreAllMocks();
  await deleteDB(databaseName);
});

describe('replay heartbeat', () => {
  it('refreshes the replay lock heartbeat while a transport is still pending', async () => {
    // Given
    let currentNow = new Date(nowIso);
    let resolveTransport: (value: { error: string; status: number }) => void = () => undefined;
    await enqueueSyncOp({
      id: 'op-1',
      task_id: taskId,
      op: 'patch',
      body: { title: 'long replay', updated_at: nowIso },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      attempts: 0,
      next_attempt_at: nowIso,
      created_at: nowIso,
    });
    const transport = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveTransport = resolve;
      }),
    );

    // When
    const replayPromise = replay({
      now: () => currentNow,
      owner: 'page',
      heartbeatIntervalMs: 1,
      transport,
    });
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
    currentNow = new Date('2026-06-12T16:00:10.000Z');

    // Then
    await vi.waitFor(async () => {
      await expect(getMeta('replay_lock')).resolves.toMatchObject({
        value: {
          heartbeat_at: '2026-06-12T16:00:10.000Z',
          owner: 'page',
        },
      });
    });

    resolveTransport({ error: 'server unavailable', status: 503 });
    await replayPromise;
  });
});
