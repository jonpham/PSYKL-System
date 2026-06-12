import 'fake-indexeddb/auto';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import type { Task } from '../api/client';
import { getTask, openPsyklDb, putTask } from './idb';

const databaseName = 'psykl';

const task: Task = {
  id: '0196f0a4-8b5a-7000-8000-000000000010',
  user_id: 'local',
  title: 'persistent task',
  created_at: '2026-06-12T17:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-12T17:00:00.000Z',
  server_updated_at: '2026-06-12T17:00:01.000Z',
  deleted_at: null,
};

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('IndexedDB upgrade and persistence', () => {
  it('creates version 1 stores from an empty database and preserves tasks across reopen', async () => {
    // Given
    const firstOpen = await openPsyklDb();
    expect(firstOpen.version).toBe(1);
    firstOpen.close();
    await putTask(task);

    // When
    const secondOpen = await openPsyklDb();
    const stored = await getTask(task.id, secondOpen);

    // Then
    expect([...secondOpen.objectStoreNames]).toContain('tasks');
    expect(stored).toEqual(task);
    secondOpen.close();
  });
});
