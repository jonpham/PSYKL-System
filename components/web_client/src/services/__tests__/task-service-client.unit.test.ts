import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { createTaskRemote } from '../../api/tasks.api-client';
import { getTask, listSyncQueue } from '../../db/idb';
import { createTaskServiceClient } from '../task-service-client';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const idempotencyKey = '0196f0a4-8b5a-7000-8000-000000000002';
const nowIso = '2026-06-12T16:00:00.000Z';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('createTaskServiceClient — production wiring', () => {
  it('offlineCapable true: create() writes to IDB + queues, without touching the network', async () => {
    // When
    const result = await createTaskServiceClient(true).create(
      taskId,
      { id: taskId, title: 'wash the car', updated_at: nowIso },
      {
        id: taskId,
        user_id: 'local',
        title: 'wash the car',
        created_at: nowIso,
        completed_at: null,
        updated_at: nowIso,
        server_updated_at: nowIso,
        deleted_at: null,
        list_id: null,
      },
    );

    // Then
    expect(result.title).toBe('wash the car');
    await expect(getTask(taskId)).resolves.toMatchObject({ title: 'wash the car' });
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: taskId, entity_type: 'task', op: 'create' }]);
  });

  it('offlineCapable true: list() pulls server-side tasks into IDB', async () => {
    // Given
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await createTaskServiceClient(true).list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: taskId, title: 'wash the car' })]));
    await expect(getTask(taskId)).resolves.toMatchObject({ id: taskId, title: 'wash the car' });
  });

  it('offlineCapable false: list() returns server tasks and writes nothing to IDB', async () => {
    // Given
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await createTaskServiceClient(false).list();

    // Then
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: taskId, title: 'wash the car' })]));
    await expect(getTask(taskId)).resolves.toBeUndefined();
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
