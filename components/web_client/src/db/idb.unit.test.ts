import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import type { Task } from '../api/client';
import {
  CURRENT_SCHEMA_VERSION,
  deleteTask,
  enqueueSyncOp,
  getMeta,
  getTask,
  listSyncQueue,
  listTasks,
  openPsyklDb,
  putMeta,
  putTask,
} from './idb';

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
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
    expect(db.version).toBe(CURRENT_SCHEMA_VERSION);
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
      op: 'patch',
      body: { title: 'second' },
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000002',
      created_at: '2026-06-12T16:00:02.000Z',
      attempts: 1,
      next_attempt_at: '2026-06-12T16:01:02.000Z',
    });
    await enqueueSyncOp({
      id: 'op-1',
      task_id: task.id,
      op: 'create',
      body: task,
      idempotency_key: '0196f0a4-8b5a-7000-8000-000000000003',
      created_at: '2026-06-12T16:00:01.000Z',
      attempts: 0,
      next_attempt_at: '2026-06-12T16:00:01.000Z',
    });

    // When
    const queue = await listSyncQueue();

    // Then
    expect(queue.map((entry) => entry.id)).toEqual(['op-1', 'op-2']);
    expect(queue[0]).toMatchObject({
      op: 'create',
      body: task,
      attempts: 0,
      next_attempt_at: '2026-06-12T16:00:01.000Z',
    });
  });

  it('stores sync metadata by key', async () => {
    // Given
    const meta = { key: 'last_pull_at', value: '2026-06-12T16:00:00.000Z' };

    // When
    await putMeta(meta);

    // Then
    await expect(getMeta(meta.key)).resolves.toEqual(meta);
  });
});
