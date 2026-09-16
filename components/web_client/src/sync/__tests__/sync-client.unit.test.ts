import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { List, Task } from '../../api/client';
import type { EntityApiResult } from '../../api/tasks.api-client';
import { getTask, listLists, listSyncQueue, listTasks, putList, putTask } from '../../db/idb';
import { createSyncClient, HydrationExhaustedError } from '../sync-client';

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

// List-entity coverage lives in sync-client.list.unit.test.ts — split to
// satisfy the project's `max-lines: 150` ESLint rule.
describe('createSyncClient — task entity (atomic optimistic write)', () => {
  const taskClient = createSyncClient({
    entityType: 'task',
    listLocal: listTasks,
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

  it('list() absorbs each remote Task into IDB, then returns local rows', async () => {
    // Given
    const client = createSyncClient({
      entityType: 'task',
      listLocal: listTasks,
      listRemote: () => Promise.resolve({ data: [optimisticTask], status: 200 }),
      put: putTask,
    });

    // When
    const result = await client.list();

    // Then
    expect(result).toEqual([optimisticTask]);
    await expect(getTask(taskId)).resolves.toEqual(optimisticTask);
  });

  it('list() falls back to local rows when the remote refresh fails but local has data', async () => {
    // Given
    await putTask(optimisticTask);
    const client = createSyncClient({
      entityType: 'task',
      listLocal: listTasks,
      listRemote: () => Promise.resolve({ error: 'server exploded', status: 500 }),
      put: putTask,
    });

    // When / Then
    await expect(client.list()).resolves.toEqual([optimisticTask]);
  });

  it('list() throws HydrationExhaustedError when the remote refresh fails AND local is empty', async () => {
    // Given — mirrors what useTasks.ts's hydrateTasks required before this
    // refactor: a server error with no local fallback must surface to the
    // caller's error UI, not be treated as a calm, empty success.
    const client = createSyncClient({
      entityType: 'task',
      listLocal: listTasks,
      listRemote: () => Promise.resolve({ error: 'server exploded', status: 500 }),
      put: putTask,
    });

    // When / Then
    await expect(client.list()).rejects.toThrow(HydrationExhaustedError);
  });

  it("listPending() returns only this entityType's queued entity ids", async () => {
    // Given
    await taskClient.create(taskId, { id: taskId, title: 'wash the car', updated_at: nowIso }, optimisticTask);
    const listSyncClientForFilterCheck = createSyncClient({
      entityType: 'list',
      listLocal: listLists,
      listRemote: () => Promise.resolve({ data: [], status: 200 }) as Promise<EntityApiResult<List[]>>,
      put: putList,
    });
    await listSyncClientForFilterCheck.create(
      listId,
      { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
      optimisticList,
    );

    // When
    const pending = await taskClient.listPending();

    // Then — the List's queue entry must not leak into the Task client's view.
    expect(pending).toEqual([taskId]);
  });

  it('restore() writes the optimistic (un-deleted) Task then enqueues a restore op', async () => {
    // Given
    const deletedTask: Task = { ...optimisticTask, deleted_at: nowIso };
    await putTask(deletedTask);
    const restored: Task = { ...optimisticTask, deleted_at: null, updated_at: nowIso };

    // When
    await taskClient.restore(taskId, { updated_at: nowIso }, restored);

    // Then
    await expect(getTask(taskId)).resolves.toEqual(restored);
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: taskId, entity_type: 'task', op: 'restore' }]);
  });
});
