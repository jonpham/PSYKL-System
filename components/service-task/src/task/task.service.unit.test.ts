import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Db } from '../db/index.js';
import { TaskService } from './task.service.js';

describe('TaskService', () => {
  let mockDb: Db;
  let service: TaskService;

  beforeEach(() => {
    let insertedValues: { id: string; userId: string; title: string } | undefined;
    const returning = vi.fn(async () => [
      {
        id: insertedValues?.id ?? 'mock-id',
        userId: insertedValues?.userId ?? 'local',
        title: insertedValues?.title ?? 'mock',
        createdAt: new Date(),
      },
    ]);
    const values = vi.fn((valuesArg: { id: string; userId: string; title: string }) => {
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

  it('generates a UUID v7 id when creating a Task', async () => {
    const created = await service.createTask('local', { title: 'hello' });

    expect(created.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('passes the user_id from the guard, not from the request body', async () => {
    await service.createTask('local', { title: 'hello' });

    const insertResult = (mockDb.insert as any).mock.results[0]?.value;
    const valuesCall = insertResult.values.mock.calls[0]?.[0];
    expect(valuesCall.userId).toBe('local');
  });

  it('lists tasks scoped to user_id', async () => {
    await service.listTasks('alice');

    expect(mockDb.select).toHaveBeenCalled();
    const selectResult = (mockDb.select as any).mock.results[0]?.value;
    const fromResult = selectResult.from.mock.results[0]?.value;
    expect(fromResult.where).toHaveBeenCalled();
  });
});
