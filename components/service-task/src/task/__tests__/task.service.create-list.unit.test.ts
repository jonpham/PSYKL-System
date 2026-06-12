import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '../../db/index.js';
import { TaskService } from '../task.service.js';
import { mockCreateListDb } from './task.service.unit-support.js';

describe('TaskService create and list', () => {
  let mockDb: Db;
  let service: TaskService;

  beforeEach(() => {
    mockDb = mockCreateListDb();
    service = new TaskService(mockDb);
  });

  it('uses the client-supplied UUID v7 id when creating a Task', async () => {
    // Given
    const id = '0193e1c0-1234-7000-8000-000000000000';

    // When
    const created = await service.createTask('local', { id, title: 'hello', updated_at: '2026-05-20T12:00:00.000Z' });

    // Then
    expect(created.id).toBe(id);
  });

  it('passes the user_id from the guard, not from the request body', async () => {
    // Given
    const userIdFromGuard = 'local';

    // When
    await service.createTask(userIdFromGuard, {
      id: '0193e1c0-1234-7000-8000-000000000000',
      title: 'hello',
      updated_at: '2026-05-20T12:00:00.000Z',
    });

    // Then
    const insertResult = (mockDb.insert as any).mock.results[0]?.value;
    const valuesCall = insertResult.values.mock.calls[0]?.[0];
    expect(valuesCall.userId).toBe(userIdFromGuard);
  });

  it('persists the client-supplied updated_at timestamp when creating a Task', async () => {
    // Given
    const updatedAt = '2026-05-20T12:00:00.000Z';

    // When
    await service.createTask('local', {
      id: '0193e1c0-1234-7000-8000-000000000000',
      title: 'hello',
      updated_at: updatedAt,
    });

    // Then
    const insertResult = (mockDb.insert as any).mock.results[0]?.value;
    const valuesCall = insertResult.values.mock.calls[0]?.[0];
    expect(valuesCall.updatedAt).toEqual(new Date(updatedAt));
  });

  it('clamps create updated_at to server now when client timestamp is more than five minutes in the future', async () => {
    const now = new Date('2026-05-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      // Given
      const futureUpdatedAt = '2026-05-20T12:06:00.000Z';

      // When
      await service.createTask('local', {
        id: '0193e1c0-1234-7000-8000-000000000000',
        title: 'future',
        updated_at: futureUpdatedAt,
      });

      // Then
      const insertResult = (mockDb.insert as any).mock.results[0]?.value;
      const valuesCall = insertResult.values.mock.calls[0]?.[0];
      expect(valuesCall.updatedAt).toEqual(now);
    } finally {
      vi.useRealTimers();
    }
  });

  it('lists tasks scoped to user_id', async () => {
    // Given
    const userId = 'alice';

    // When
    await service.listTasks(userId);

    // Then
    expect(mockDb.select).toHaveBeenCalled();
    const selectResult = (mockDb.select as any).mock.results[0]?.value;
    const fromResult = selectResult.from.mock.results[0]?.value;
    expect(fromResult.where).toHaveBeenCalled();
  });
});
