import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Db } from '../../src/db/index.js';
import { insertList, listService } from './list.integration-support.js';
import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';

/**
 * Restore + GET /deleted window filtering, against a real pglite DB.
 * Uses timestamps relative to the current wall clock — listDeletedTasks/
 * listDeletedLists filter against a real 30-day cutoff (see task.service.ts,
 * list.service.ts), so fixed 2026-05-20-style fixture dates elsewhere in this
 * suite would age out of the window as real time passes.
 */
describe('Recently Deleted restore + 30-day window', () => {
  let db: Db;

  beforeAll(async () => {
    db = await createIntegrationDb();
  });

  function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  it('includes a Task deleted 5 days ago in listDeletedTasks, and restore removes it again', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'recent tombstone', updatedAt: daysAgo(5), deletedAt: daysAgo(5) });

    // Given
    const service = taskService(db);

    // When
    const deletedBefore = await service.listDeletedTasks('local');

    // Then
    expect(deletedBefore.map((task) => task.id)).toContain(id);

    // When
    await service.restoreTask('local', id, { updated_at: new Date().toISOString() });
    const deletedAfter = await service.listDeletedTasks('local');

    // Then
    expect(deletedAfter.map((task) => task.id)).not.toContain(id);
  });

  it('excludes a Task deleted 31 days ago from listDeletedTasks', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'stale tombstone', updatedAt: daysAgo(31), deletedAt: daysAgo(31) });

    // Given
    const service = taskService(db);

    // When
    const deleted = await service.listDeletedTasks('local');

    // Then
    expect(deleted.map((task) => task.id)).not.toContain(id);
  });

  it('includes a List deleted 5 days ago in listDeletedLists, and restore removes it again', async () => {
    const id = uuidv7();
    await insertList(db, { id, title: 'recent list tombstone', updatedAt: daysAgo(5), deletedAt: daysAgo(5) });

    // Given
    const service = listService(db);

    // When
    const deletedBefore = await service.listDeletedLists('local');

    // Then
    expect(deletedBefore.map((list) => list.id)).toContain(id);

    // When
    await service.restoreList('local', id, { updated_at: new Date().toISOString() });
    const deletedAfter = await service.listDeletedLists('local');

    // Then
    expect(deletedAfter.map((list) => list.id)).not.toContain(id);
  });

  it('excludes a List deleted 31 days ago from listDeletedLists', async () => {
    const id = uuidv7();
    await insertList(db, { id, title: 'stale list tombstone', updatedAt: daysAgo(31), deletedAt: daysAgo(31) });

    // Given
    const service = listService(db);

    // When
    const deleted = await service.listDeletedLists('local');

    // Then
    expect(deleted.map((list) => list.id)).not.toContain(id);
  });
});
