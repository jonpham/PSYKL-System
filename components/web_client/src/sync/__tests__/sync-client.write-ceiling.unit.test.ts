import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { List } from '../../api/client';
import type { EntityApiResult } from '../../api/tasks.api-client';
import { enqueueSyncOp, listSyncQueue } from '../../db/idb';
import { createSyncClient } from '../sync-client';
import { SyncWriteCeilingError, WRITE_CEILING } from '../sync-pressure';

const databaseName = 'psykl';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('SyncClient write ceiling', () => {
  it('refuses a new write once the queue is at the ceiling', async () => {
    // Given a queue already at WRITE_CEILING entries
    for (let index = 0; index < WRITE_CEILING; index += 1) {
      await enqueueSyncOp({
        id: `seed-${index}`,
        entity_type: 'list',
        entity_id: `list-${index}`,
        op: 'create',
        body: {},
        idempotency_key: `idem-${index}`,
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
    const client = createSyncClient({
      entityType: 'list',
      listLocal: () => Promise.resolve([]),
      listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<List[]>>,
      put: () => Promise.resolve(),
    });

    // When creating one more
    const attempt = client.create('list-new', {}, { id: 'list-new' } as unknown as List);

    // Then it's refused and the queue does not grow
    await expect(attempt).rejects.toThrow(SyncWriteCeilingError);
    await expect(listSyncQueue()).resolves.toHaveLength(WRITE_CEILING);
  });
});
