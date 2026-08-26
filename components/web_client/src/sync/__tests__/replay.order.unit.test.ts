import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { enqueue, replay } from '../replay';

const databaseName = 'psykl';

afterEach(async () => {
  vi.restoreAllMocks();
  await deleteDB(databaseName);
});

describe('replay ordering', () => {
  it('replays later entries even when an earlier one fails transiently', async () => {
    // Given two queued entries where the first will hit a 500
    await enqueue({ body: { title: 'first' }, entityId: 'id-1', entityType: 'task', op: 'create' });
    await enqueue({ body: { title: 'second' }, entityId: 'id-2', entityType: 'task', op: 'create' });

    const nowIso = '2026-08-26T12:00:00.000Z';
    const transport = vi.fn(async (entry) =>
      entry.entity_id === 'id-1'
        ? { status: 500 }
        : {
            data: {
              id: 'id-2',
              user_id: 'local',
              title: 'second',
              created_at: nowIso,
              completed_at: null,
              updated_at: nowIso,
              server_updated_at: nowIso,
              deleted_at: null,
            },
            status: 200,
          },
    );

    // When replay runs
    const result = await replay({ transport });

    // Then the second entry was attempted despite the first failing
    expect(transport).toHaveBeenCalledTimes(2);
    expect(result.replayed).toBe(1);
    expect(result.retried).toBe(1);
  });
});
