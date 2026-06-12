import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import type { Task } from '../api/client';
import { deleteTask, enqueueSyncOp, getTask, listSyncQueue, listTasks, openPsyklDb, putMeta, putTask } from './idb';

const databaseName = 'psykl';

const task: Task = {
  id: '0196f0a4-8b5a-7000-8000-000000000001',
  user_id: 'local',
  title: 'stored task',
  created_at: '2026-06-12T16:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-12T16:00:00.000Z',
  server_updated_at: '2026-06-12T16:00:01.000Z',
  deleted_at: null,
};

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('openPsyklDb', () => {
  it('opens database version 1 with all local-first stores and indexes', async () => {
    // When
    const db = await openPsyklDb();

    // Then
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames]).toEqual(['failed_ops', 'sync_meta', 'sync_queue', 'tasks']);
    expect([...db.transaction('tasks').store.indexNames]).toEqual(['deleted_at', 'updated_at', 'user_id']);
    expect([...db.transaction('sync_queue').store.indexNames]).toEqual(['created_at', 'task_id']);
    expect([...db.transaction('failed_ops').store.indexNames]).toEqual(['created_at', 'task_id']);
    db.close();
  });
});

describe('task helpers', () => {
  it('writes, lists, reads, and deletes Task rows by id', async () => {
    // Given
    await putTask(task);

    // When
    const tasks = await listTasks();
    const stored = await getTask(task.id);
    await deleteTask(task.id);

    // Then
    expect(tasks).toEqual([task]);
    expect(stored).toEqual(task);
    await expect(getTask(task.id)).resolves.toBeUndefined();
  });
});

describe('sync helpers', () => {
  it('enqueues sync operations in created_at order', async () => {
    // Given
    await enqueueSyncOp({
      id: 'op-2',
      task_id: task.id,
      type: 'task.patch',
      payload: { title: 'second' },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      created_at: '2026-06-12T16:00:02.000Z',
    });
    await enqueueSyncOp({
      id: 'op-1',
      task_id: task.id,
      type: 'task.create',
      payload: task,
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000003',
      created_at: '2026-06-12T16:00:01.000Z',
    });

    // When
    const queue = await listSyncQueue();

    // Then
    expect(queue.map((entry) => entry.id)).toEqual(['op-1', 'op-2']);
  });

  it('stores sync metadata by key', async () => {
    // When / Then
    await expect(putMeta({ key: 'last_pull_at', value: '2026-06-12T16:00:00.000Z' })).resolves.toBeUndefined();
  });
});
