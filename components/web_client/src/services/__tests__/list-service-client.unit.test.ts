import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { createListRemote } from '../../api/lists.api-client';
import { getList, listSyncQueue } from '../../db/idb';
import { createListServiceClient } from '../list-service-client';

const databaseName = 'psykl';
const listId = '0196f0a4-8b5a-7000-8000-000000000010';
const idempotencyKey = '0196f0a4-8b5a-7000-8000-000000000011';
const nowIso = '2026-06-12T16:00:00.000Z';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('createListServiceClient — production wiring', () => {
  it('offlineCapable true: create() writes to IDB + queues, without touching the network', async () => {
    // When
    const result = await createListServiceClient(true).create(
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

  it('offlineCapable true: list() pulls server-side lists into IDB', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await createListServiceClient(true).list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId, title: 'Groceries' })]));
    await expect(getList(listId)).resolves.toMatchObject({ id: listId, title: 'Groceries' });
  });

  it('offlineCapable false: list() returns server lists and writes nothing to IDB', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await createListServiceClient(false).list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId, title: 'Groceries' })]));
    await expect(getList(listId)).resolves.toBeUndefined();
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
