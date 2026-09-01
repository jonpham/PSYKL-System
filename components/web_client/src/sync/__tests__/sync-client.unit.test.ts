import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { List, Task } from '../../api/client';
import type { EntityApiResult } from '../../api/tasks.api-client';
import { getList, getTask, listSyncQueue, putList, putTask } from '../../db/idb';
import { createSyncClient } from '../sync-client';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const listId = '0196f0a4-8b5a-7000-8000-000000000010';
const nowIso = '2026-06-12T16:00:00.000Z';

const optimisticTask: Task = {
  id: taskId,
  user_id: 'local',
  title: 'wash the car',
  created_at: nowIso,
  completed_at: null,
  updated_at: nowIso,
  server_updated_at: nowIso,
  deleted_at: null,
  list_id: null,
};

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

describe('createSyncClient — task entity (atomic optimistic write)', () => {
  const taskClient = createSyncClient({
    entityType: 'task',
    listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<Task[]>>,
    put: putTask,
  });

  it('create() writes the optimistic Task and enqueues a create op in one call', async () => {
    // When
    const result = await taskClient.create(
      taskId,
      { id: taskId, title: 'wash the car', updated_at: nowIso },
      optimisticTask,
    );

    // Then
    expect(result).toEqual(optimisticTask);
    await expect(getTask(taskId)).resolves.toEqual(optimisticTask);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: taskId, entity_type: 'task', op: 'create' }]);
  });

  it('hydrate() writes each remote Task into IDB', async () => {
    // Given
    const client = createSyncClient({
      entityType: 'task',
      listRemote: () => Promise.resolve({ data: [optimisticTask], status: 200 }),
      put: putTask,
    });

    // When
    await client.hydrate();

    // Then
    await expect(getTask(taskId)).resolves.toEqual(optimisticTask);
  });

  it('hydrate() throws on a non-2xx/error response instead of silently no-oping', async () => {
    // Given — mirrors what useTasks.ts's hydrateTasks required before this
    // refactor: a server error must surface to the caller's offline-fallback
    // catch, not be treated as a calm, empty success.
    const client = createSyncClient({
      entityType: 'task',
      listRemote: () => Promise.resolve({ error: 'server exploded', status: 500 }),
      put: putTask,
    });

    // When / Then
    await expect(client.hydrate()).rejects.toThrow();
  });
});

describe('createSyncClient — list entity (two-step, no atomic primitive exists)', () => {
  const listClient = createSyncClient({
    entityType: 'list',
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

  it('hydrate() writes each remote List into IDB — the hydration path that never existed before', async () => {
    // Given
    const client = createSyncClient({
      entityType: 'list',
      listRemote: () => Promise.resolve({ data: [optimisticList], status: 200 }),
      put: putList,
    });

    // When
    await client.hydrate();

    // Then
    await expect(getList(listId)).resolves.toEqual(optimisticList);
  });
});
