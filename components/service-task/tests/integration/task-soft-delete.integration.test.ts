import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '../../src/db/index.js';
import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';

describe('TaskService soft delete behavior', () => {
  let db: Db;

  beforeAll(async () => {
    db = await createIntegrationDb();
  });

  /**
   * Soft delete behavior is implemented by:
   * components/service-task/src/task/task.service.ts
   *
   * Deleting a Task sets deleted_at instead of removing the row.
   * Default lists hide deleted Tasks; includeDeleted returns them for sync.
   */
  it('marks a Task deleted by setting deleted_at', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'delete me', updatedAt: new Date('2026-05-20T12:00:00.000Z') });

    // Given
    const deleteInput = {
      deleted_at: '2026-05-20T12:05:00.000Z',
      updated_at: '2026-05-20T12:05:00.000Z',
    };

    // When
    const deleted = await taskService(db).deleteTask('local', id, deleteInput);

    // Then
    expect(deleted).toMatchObject({
      id,
      title: 'delete me',
      deleted_at: '2026-05-20T12:05:00.000Z',
      updated_at: '2026-05-20T12:05:00.000Z',
    });
  });

  it('hides deleted Tasks from default lists and returns them when includeDeleted is true', async () => {
    const visibleId = uuidv7();
    const deletedId = uuidv7();
    await insertTask(db, { id: visibleId, title: 'visible', updatedAt: new Date('2026-05-20T12:00:00.000Z') });
    await insertTask(db, {
      id: deletedId,
      title: 'deleted',
      updatedAt: new Date('2026-05-20T12:05:00.000Z'),
      deletedAt: new Date('2026-05-20T12:05:00.000Z'),
    });

    // Given
    const service = taskService(db);

    // When
    const defaultRows = await service.listTasks('local');
    const rowsWithDeleted = await service.listTasks('local', { includeDeleted: true });

    // Then
    expect(defaultRows.map((task) => task.id)).toContain(visibleId);
    expect(defaultRows.map((task) => task.id)).not.toContain(deletedId);
    expect(rowsWithDeleted.map((task) => task.id)).toEqual(expect.arrayContaining([visibleId, deletedId]));
  });
});
