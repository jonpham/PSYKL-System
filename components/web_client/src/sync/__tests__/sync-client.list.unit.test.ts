import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { List } from '../../api/client';
import type { EntityApiResult } from '../../api/tasks.api-client';
import { getList, listLists, listSyncQueue, putList } from '../../db/idb';
import { createSyncClient } from '../sync-client';

const databaseName = 'psykl';
const listId = '0196f0a4-8b5a-7000-8000-000000000010';
const nowIso = '2026-06-12T16:00:00.000Z';

const optimisticList: List = {
  id: listId,
  user_id: 'local',
  title: 'Groceries',
  position: 'a0',
  created_at: nowIso,
  updated_at: nowIso,
  server_updated_at: nowIso,
  deleted_at: null,
};

afterEach(async () => {
  await deleteDB(databaseName);
});

// Task-entity coverage lives in sync-client.unit.test.ts — split to satisfy
// the project's `max-lines: 150` ESLint rule.
describe('createSyncClient — list entity (two-step, no atomic primitive exists)', () => {
  const listClient = createSyncClient({
    entityType: 'list',
    listLocal: listLists,
    listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<List[]>>,
    put: putList,
  });

  it('create() writes the optimistic List then enqueues a create op', async () => {
    // When
    const result = await listClient.create(
      listId,
      { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
      optimisticList,
    );

    // Then
    expect(result).toEqual(optimisticList);
    await expect(getList(listId)).resolves.toEqual(optimisticList);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'create' }]);
  });

  it('patch() writes the optimistic List then enqueues a patch op', async () => {
    // Given
    await putList(optimisticList);
    const renamed: List = { ...optimisticList, title: 'Weekly Groceries' };

    // When
    await listClient.patch(listId, { title: 'Weekly Groceries', updated_at: nowIso }, renamed);

    // Then
    await expect(getList(listId)).resolves.toEqual(renamed);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'patch' }]);
  });

  it('delete() writes the optimistic (soft-deleted) List then enqueues a delete op', async () => {
    // Given
    await putList(optimisticList);
    const deleted: List = { ...optimisticList, deleted_at: nowIso };

    // When
    await listClient.delete(listId, { deleted_at: nowIso }, deleted);

    // Then
    await expect(getList(listId)).resolves.toEqual(deleted);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'delete' }]);
  });

  it('list() absorbs each remote List into IDB — the hydration path that never existed before', async () => {
    // Given
    const client = createSyncClient({
      entityType: 'list',
      listLocal: listLists,
      listRemote: () => Promise.resolve({ data: [optimisticList], status: 200 }),
      put: putList,
    });

    // When
    const result = await client.list();

    // Then
    expect(result).toEqual([optimisticList]);
    await expect(getList(listId)).resolves.toEqual(optimisticList);
  });

  it('restore() writes the optimistic (un-deleted) List then enqueues a restore op', async () => {
    // Given
    const deletedList: List = { ...optimisticList, deleted_at: nowIso };
    await putList(deletedList);
    const restored: List = { ...optimisticList, deleted_at: null, updated_at: nowIso };

    // When
    await listClient.restore(listId, { updated_at: nowIso }, restored);

    // Then
    await expect(getList(listId)).resolves.toEqual(restored);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: listId, entity_type: 'list', op: 'restore' }]);
  });
});
