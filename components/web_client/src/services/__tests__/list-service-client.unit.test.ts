import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { createListRemote } from '../../api/lists.api-client';
import { getList, listSyncQueue } from '../../db/idb';
import { listServiceClient } from '../list-service-client';

const databaseName = 'psykl';
const listId = '0196f0a4-8b5a-7000-8000-000000000010';
const idempotencyKey = '0196f0a4-8b5a-7000-8000-000000000011';
const nowIso = '2026-06-12T16:00:00.000Z';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('listServiceClient — production wiring', () => {
  it('create() is offline-capable: writes to IDB + queues, without touching the network', async () => {
    // When
    const result = await listServiceClient.create(
      listId,
      { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
      {
        id: listId,
        user_id: 'local',
        title: 'Groceries',
        position: 'a0',
        created_at: nowIso,
        updated_at: nowIso,
        server_updated_at: nowIso,
        deleted_at: null,
      },
    );

    // Then
    expect(result.title).toBe('Groceries');
    await expect(getList(listId)).resolves.toMatchObject({ title: 'Groceries' });
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'create' }]);
  });

  it('hydrate() pulls lists that already exist server-side into IDB — this is the fix for the gap', async () => {
    // Given — a list created directly on the server (e.g. by another device),
    // never mutated by this device, so nothing would previously have pulled
    // it down.
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    await listServiceClient.hydrate();

    // Then
    await expect(getList(listId)).resolves.toMatchObject({ id: listId, title: 'Groceries' });
  });
});
