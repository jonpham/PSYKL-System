import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { createTaskRemote } from '../../api/tasks.api-client';
import { getTask, listSyncQueue } from '../../db/idb';
import { taskServiceClient } from '../task-service-client';

const databaseName = 'psykl';
const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const idempotencyKey = '0196f0a4-8b5a-7000-8000-000000000002';
const nowIso = '2026-06-12T16:00:00.000Z';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('taskServiceClient — production wiring', () => {
  it('create() is offline-capable: writes to IDB + queues, without touching the network', async () => {
    // When
    const result = await taskServiceClient.create(
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

  it('hydrate() pulls tasks that already exist server-side into IDB', async () => {
    // Given — a task created directly on the server, bypassing the client entirely
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);

    // When
    await taskServiceClient.hydrate();

    // Then
    await expect(getTask(taskId)).resolves.toMatchObject({ id: taskId, title: 'wash the car' });
  });
});
