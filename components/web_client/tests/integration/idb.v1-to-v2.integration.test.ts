import { openDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';

import { listFailedOps, listSyncQueue, openPsyklDb } from '../../src/db/idb';

const DB_NAME = 'psykl';

async function seedV1Database(): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(database) {
      const queue = database.createObjectStore('sync_queue', { keyPath: 'id' });
      queue.createIndex('created_at', 'created_at');
      queue.createIndex('task_id', 'task_id');
      const failed = database.createObjectStore('failed_ops', { keyPath: 'id' });
      failed.createIndex('created_at', 'created_at');
      failed.createIndex('task_id', 'task_id');
      database.createObjectStore('sync_meta', { keyPath: 'key' });
      const tasks = database.createObjectStore('tasks', { keyPath: 'id' });
      tasks.createIndex('deleted_at', 'deleted_at');
      tasks.createIndex('updated_at', 'updated_at');
      tasks.createIndex('user_id', 'user_id');
    },
  });
  await db.put('sync_queue', {
    id: '018f0000-0000-7000-8000-000000000001',
    task_id: '018f0000-0000-7000-8000-000000000002',
    op: 'create',
    body: { title: 'Survives the upgrade' },
    idempotency_key: '018f0000-0000-7000-8000-000000000003',
    attempts: 0,
    next_attempt_at: '2026-08-18T10:00:00.000Z',
    created_at: '2026-08-18T10:00:00.000Z',
  });
  await db.put('failed_ops', {
    id: '018f0000-0000-7000-8000-000000000004',
    task_id: '018f0000-0000-7000-8000-000000000005',
    op: 'patch',
    body: { title: 'Failed write' },
    idempotency_key: '018f0000-0000-7000-8000-000000000006',
    attempts: 3,
    next_attempt_at: '2026-08-18T12:00:00.000Z',
    created_at: '2026-08-18T10:00:00.000Z',
    failed_at: '2026-08-18T11:00:00.000Z',
    error: '{"status":400,"message":"Validation failed"}',
  });
  db.close();
}

describe('IndexedDB v1 to v2 upgrade', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase(DB_NAME);
  });

  it('preserves queued offline writes across the upgrade', async () => {
    // Given a v1 database holding one queued write
    await seedV1Database();

    // When the app opens the database at the current schema version
    const db = await openPsyklDb();
    const queue = await listSyncQueue(db);

    // Then the write is still there, addressed by entity rather than task
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      entity_type: 'task',
      entity_id: '018f0000-0000-7000-8000-000000000002',
      body: { title: 'Survives the upgrade' },
    });
    db.close();
  });

  it('creates the lists store', async () => {
    // Given a v1 database
    await seedV1Database();

    // When it upgrades
    const db = await openPsyklDb();

    // Then the lists store exists
    expect([...db.objectStoreNames]).toContain('lists');
    db.close();
  });

  it('preserves failed operations with entity references across the upgrade', async () => {
    // Given a v1 database holding a failed operation
    await seedV1Database();

    // When the app opens the database at the current schema version
    const db = await openPsyklDb();
    const failed = await listFailedOps(db);

    // Then the failed op is still there, addressed by entity rather than task, with all fields preserved
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({
      entity_type: 'task',
      entity_id: '018f0000-0000-7000-8000-000000000005',
      op: 'patch',
      body: { title: 'Failed write' },
      failed_at: '2026-08-18T11:00:00.000Z',
      error: '{"status":400,"message":"Validation failed"}',
    });
    db.close();
  });
});
