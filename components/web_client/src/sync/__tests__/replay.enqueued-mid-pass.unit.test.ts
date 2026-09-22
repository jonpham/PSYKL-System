import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { Task } from '../../api/client';
import { listSyncQueue } from '../../db/idb';
import { enqueue, replay } from '../replay';

const databaseName = 'psykl';
const firstTaskId = '0196f0a4-8b5a-7000-8000-000000000031';
const secondTaskId = '0196f0a4-8b5a-7000-8000-000000000032';
const nowIso = '2026-06-12T16:00:00.000Z';

function serverTask(id: string): Task {
  return {
    id,
    user_id: 'local',
    title: 'queued',
    created_at: nowIso,
    completed_at: null,
    updated_at: nowIso,
    server_updated_at: nowIso,
    deleted_at: null,
    list_id: null,
  };
}

function queueTask(id: string) {
  return enqueue({ body: { title: 'queued', updated_at: nowIso }, entityId: id, entityType: 'task', op: 'create' });
}

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('an operation enqueued while a replay is already running', () => {
  /**
   * Replay is only ever woken by a user action, an `online` event, or the page
   * becoming visible (page-triggers.ts) — there is no timer. A pass that reads
   * the queue once therefore strands anything enqueued after that read: the
   * wake-up the new operation fired was swallowed by the replay lock, and no
   * later wake-up is coming. The queue then sits at `attempts: 0` forever.
   */
  it('is sent in the same pass rather than stranded behind the replay lock', async () => {
    // Given one queued operation, and a second that arrives while the first is
    // in flight — the app's own bootstrap does exactly this, queueing the
    // default list as the user types their first task
    await queueTask(firstTaskId);
    const transport = async (entry: { entity_id: string }) => {
      if (entry.entity_id === firstTaskId) {
        await queueTask(secondTaskId);
      }
      return { data: serverTask(entry.entity_id), status: 200 };
    };

    // When the queue drains
    const result = await replay({ transport });

    // Then neither operation is left behind
    expect(result.replayed).toBe(2);
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
