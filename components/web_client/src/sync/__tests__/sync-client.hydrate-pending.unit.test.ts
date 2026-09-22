import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import type { List, Task } from '../../api/client';
import type { EntityApiResult } from '../../api/tasks.api-client';
import { getTask, listLists, listTasks, putList, putTask } from '../../db/idb';
import { createSyncClient } from '../sync-client';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000021';
const listId = '0196f0a4-8b5a-7000-8000-000000000022';
const nowIso = '2026-06-12T16:00:00.000Z';
const laterIso = '2026-06-12T17:00:00.000Z';

const serverTask: Task = {
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

const serverList: List = {
  id: listId,
  user_id: 'local',
  title: 'Groceries',
  position: 'a0',
  created_at: nowIso,
  updated_at: nowIso,
  server_updated_at: nowIso,
  deleted_at: null,
};

function taskClient() {
  return createSyncClient<Task, unknown, unknown, unknown>({
    entityType: 'task',
    listLocal: listTasks,
    listRemote: async (): Promise<EntityApiResult<Task[]>> => ({ data: [serverTask], status: 200 }),
    put: putTask,
  });
}

function listClient() {
  return createSyncClient<List, unknown, unknown, unknown>({
    entityType: 'list',
    listLocal: listLists,
    listRemote: async (): Promise<EntityApiResult<List[]>> => ({ data: [serverList], status: 200 }),
    put: putList,
  });
}

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('hydrating over local changes that have not synced yet', () => {
  it('keeps a completion the server has not confirmed', async () => {
    // Given the user completed a task and the change is still queued
    const client = taskClient();
    await client.patch(
      taskId,
      { completed_at: laterIso, updated_at: laterIso },
      { ...serverTask, completed_at: laterIso, updated_at: laterIso },
    );

    // When the page loads and hydration pulls the server's older copy
    await client.list();

    // Then the user's completion is still there — a reload is not a rollback
    await expect(getTask(taskId)).resolves.toMatchObject({ completed_at: laterIso });
  });

  it('keeps a re-ordered list position the server has not confirmed', async () => {
    // Given
    const client = listClient();
    await client.patch(
      listId,
      { position: 'a5', updated_at: laterIso },
      { ...serverList, position: 'a5', updated_at: laterIso },
    );

    // When
    await client.list();

    // Then
    const [stored] = await listLists();
    expect(stored?.position).toBe('a5');
  });

  it('still absorbs server rows this device has not touched', async () => {
    // Given a device with nothing queued
    const client = taskClient();

    // When
    await client.list();

    // Then — hydration is not disabled, only held back where it would clobber
    await expect(getTask(taskId)).resolves.toMatchObject({ title: 'wash the car' });
  });

  it('absorbs the server row again once the local change has drained', async () => {
    // Given a queued change that then syncs (the queue entry is gone)
    const client = taskClient();
    await putTask({ ...serverTask, title: 'washed already', updated_at: laterIso });

    // When
    await client.list();

    // Then the server is authoritative again
    await expect(getTask(taskId)).resolves.toMatchObject({ title: 'wash the car' });
  });
});
