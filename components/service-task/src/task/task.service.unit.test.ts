import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '../db/index.js';
import { TaskService } from './task.service.js';

describe('TaskService', () => {
  let mockDb: Db;
  let service: TaskService;

  beforeEach(() => {
    let insertedValues: { id: string; userId: string; title: string; updatedAt: Date } | undefined;
    const returning = vi.fn(async () => [
      {
        id: insertedValues?.id ?? 'mock-id',
        userId: insertedValues?.userId ?? 'local',
        title: insertedValues?.title ?? 'mock',
        createdAt: new Date(),
        completedAt: null,
        updatedAt: insertedValues?.updatedAt ?? new Date('2026-05-20T12:00:00.000Z'),
        serverUpdatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    const values = vi.fn((valuesArg: { id: string; userId: string; title: string; updatedAt: Date }) => {
      insertedValues = valuesArg;
      return { returning };
    });
    const where = vi.fn(async () => []);
    const from = vi.fn(() => ({ where }));

    mockDb = {
      insert: vi.fn(() => ({ values })),
      select: vi.fn(() => ({ from })),
    } as unknown as Db;
    service = new TaskService(mockDb);
  });

  it('uses the client-supplied UUID v7 id when creating a Task', async () => {
    const id = '0193e1c0-1234-7000-8000-000000000000';
    const created = await service.createTask('local', { id, title: 'hello', updated_at: '2026-05-20T12:00:00.000Z' });

    expect(created.id).toBe(id);
  });

  it('passes the user_id from the guard, not from the request body', async () => {
    await service.createTask('local', {
      id: '0193e1c0-1234-7000-8000-000000000000',
      title: 'hello',
      updated_at: '2026-05-20T12:00:00.000Z',
    });

    const insertResult = (mockDb.insert as any).mock.results[0]?.value;
    const valuesCall = insertResult.values.mock.calls[0]?.[0];
    expect(valuesCall.userId).toBe('local');
  });

  it('persists the client-supplied updated_at timestamp when creating a Task', async () => {
    await service.createTask('local', {
      id: '0193e1c0-1234-7000-8000-000000000000',
      title: 'hello',
      updated_at: '2026-05-20T12:00:00.000Z',
    });

    const insertResult = (mockDb.insert as any).mock.results[0]?.value;
    const valuesCall = insertResult.values.mock.calls[0]?.[0];
    expect(valuesCall.updatedAt).toEqual(new Date('2026-05-20T12:00:00.000Z'));
  });

  it('lists tasks scoped to user_id', async () => {
    await service.listTasks('alice');

    expect(mockDb.select).toHaveBeenCalled();
    const selectResult = (mockDb.select as any).mock.results[0]?.value;
    const fromResult = selectResult.from.mock.results[0]?.value;
    expect(fromResult.where).toHaveBeenCalled();
  });
});
