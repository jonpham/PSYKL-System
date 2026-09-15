import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Db } from '../../src/db/index.js';
import { insertList } from './list.integration-support.js';
import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';

describe('TaskService orphan sweep', () => {
  let db: Db;

  beforeAll(async () => {
    db = await createIntegrationDb();
  });

  // Each test uses its own user_id: "earliest-position live list" is scoped
  // per user, and all three tests share one DB/beforeAll — without isolation,
  // an earlier test's list would win the "earliest position" comparison for
  // a later test's user.

  it('reassigns a Task pointing at a deleted list to the earliest-position live list, persisting the fix', async () => {
    const userId = 'orphan-sweep-deleted-list';
    const defaultListId = await insertList(db, {
      userId,
      title: 'Tasks',
      position: 'a0',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    });
    const deletedListId = await insertList(db, {
      userId,
      title: 'Gone',
      position: 'a1',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      deletedAt: new Date('2026-05-20T11:00:00.000Z'),
    });
    const taskId = await insertTask(db, {
      userId,
      title: 'orphaned',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      listId: deletedListId,
    });

    // Given
    const service = taskService(db);

    // When
    const [firstRead] = await service.listTasks(userId);

    // Then
    expect(firstRead).toMatchObject({ id: taskId, list_id: defaultListId });

    // And — the fix is persisted, not just shaped in the response
    const [secondRead] = await service.listTasks(userId);
    expect(secondRead).toMatchObject({ id: taskId, list_id: defaultListId });
  });

  it('reassigns a Task pointing at a list id the server has never seen', async () => {
    const userId = 'orphan-sweep-unseen-list';
    const defaultListId = await insertList(db, {
      userId,
      title: 'Tasks',
      position: 'a0',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    });
    const unseenListId = uuidv7();
    const taskId = await insertTask(db, {
      userId,
      title: 'never-seen list',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      listId: unseenListId,
    });

    // Given
    const service = taskService(db);

    // When
    const rows = await service.listTasks(userId);

    // Then
    expect(rows.find((task) => task.id === taskId)).toMatchObject({ list_id: defaultListId });
  });

  it('leaves a Task referencing a live list untouched', async () => {
    const userId = 'orphan-sweep-live-list';
    const liveListId = await insertList(db, {
      userId,
      title: 'Live',
      position: 'a0',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    });
    const taskId = await insertTask(db, {
      userId,
      title: 'fine',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      listId: liveListId,
    });

    // Given
    const service = taskService(db);

    // When
    const rows = await service.listTasks(userId);

    // Then
    expect(rows.find((task) => task.id === taskId)).toMatchObject({ list_id: liveListId });
  });
});
