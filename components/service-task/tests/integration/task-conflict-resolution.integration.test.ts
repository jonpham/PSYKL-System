import { v7 as uuidv7 } from 'uuid';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { Db } from '../../src/db/index.js';
import { createIntegrationDb, insertTask, taskService } from './task.integration-support.js';

describe('TaskService client conflict resolution', () => {
  let db: Db;

  beforeAll(async () => {
    db = await createIntegrationDb();
  });

  /**
   * Client conflict resolution is implemented by:
   * components/service-task/src/task/task.service.ts
   *
   * A patch is older when its updated_at is before the Task row's stored updated_at.
   * Older client edits lose to the current stored Task state.
   */
  it('patches a Task when updated_at is newer than the stored row', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'old', updatedAt: new Date('2026-05-20T12:00:00.000Z') });

    // Given
    const newerPatch = { title: 'new', updated_at: '2026-05-20T12:05:00.000Z' };

    // When
    const patched = await taskService(db).patchTask('local', id, newerPatch);

    // Then
    expect(patched).toMatchObject({
      id,
      title: 'new',
      updated_at: '2026-05-20T12:05:00.000Z',
    });
  });

  it('keeps the stored Task state when PATCH updated_at is older than the row', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'current', updatedAt: new Date('2026-05-20T12:05:00.000Z') });

    // Given
    const olderPatch = { title: 'older client edit', updated_at: '2026-05-20T12:00:00.000Z' };

    // When
    const patched = await taskService(db).patchTask('local', id, olderPatch);

    // Then
    expect(patched).toMatchObject({
      id,
      title: 'current',
      updated_at: '2026-05-20T12:05:00.000Z',
    });
  });

  it('clamps PATCH updated_at more than five minutes in the future', async () => {
    const id = uuidv7();
    await insertTask(db, { id, title: 'old', updatedAt: new Date('2026-05-20T12:00:00.000Z') });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-20T12:10:00.000Z'));

    try {
      // Given
      const futurePatch = { title: 'clamped', updated_at: '2026-05-20T12:16:00.000Z' };

      // When
      const patched = await taskService(db).patchTask('local', id, futurePatch);

      // Then
      expect(patched).toMatchObject({
        id,
        title: 'clamped',
        updated_at: '2026-05-20T12:10:00.000Z',
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
