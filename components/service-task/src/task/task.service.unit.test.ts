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

  it('patches a Task when updated_at is newer than the stored row', async () => {
    const currentRow = taskRow({ title: 'old', updatedAt: new Date('2026-05-20T12:00:00.000Z') });
    const updatedRow = taskRow({ title: 'new', updatedAt: new Date('2026-05-20T12:05:00.000Z') });
    const updateSet = vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => [updatedRow]),
      })),
    }));
    mockDb = mockPatchDb([currentRow], updateSet);
    service = new TaskService(mockDb);

    const patched = await service.patchTask('local', currentRow.id, {
      title: 'new',
      updated_at: '2026-05-20T12:05:00.000Z',
    });

    expect(patched.title).toBe('new');
    expect(patched.updated_at).toBe('2026-05-20T12:05:00.000Z');
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'new',
        updatedAt: new Date('2026-05-20T12:05:00.000Z'),
      }),
    );
  });

  it('returns the current row without updating when PATCH updated_at is stale', async () => {
    const currentRow = taskRow({ title: 'current', updatedAt: new Date('2026-05-20T12:05:00.000Z') });
    const updateSet = vi.fn();
    mockDb = mockPatchDb([currentRow], updateSet);
    service = new TaskService(mockDb);

    const patched = await service.patchTask('local', currentRow.id, {
      title: 'stale',
      updated_at: '2026-05-20T12:00:00.000Z',
    });

    expect(patched.title).toBe('current');
    expect(patched.updated_at).toBe('2026-05-20T12:05:00.000Z');
    expect(updateSet).not.toHaveBeenCalled();
  });

  it('clamps PATCH updated_at to server now when client timestamp is more than five minutes in the future', async () => {
    const now = new Date('2026-05-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const currentRow = taskRow({ title: 'old', updatedAt: new Date('2026-05-20T11:00:00.000Z') });
      const updatedRow = taskRow({ title: 'future', updatedAt: now });
      const updateSet = vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [updatedRow]),
        })),
      }));
      mockDb = mockPatchDb([currentRow], updateSet);
      service = new TaskService(mockDb);

      const patched = await service.patchTask('local', currentRow.id, {
        title: 'future',
        updated_at: '2026-05-20T12:06:00.000Z',
      });

      expect(patched.updated_at).toBe('2026-05-20T12:00:00.000Z');
      expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: now }));
    } finally {
      vi.useRealTimers();
    }
  });
});

function taskRow(overrides: Partial<any> = {}) {
  return {
    id: '0193e1c0-1234-7000-8000-000000000000',
    userId: 'local',
    title: 'task',
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    completedAt: null,
    updatedAt: new Date('2026-05-20T12:00:00.000Z'),
    serverUpdatedAt: new Date('2026-05-20T12:00:00.500Z'),
    deletedAt: null,
    ...overrides,
  };
}

function mockPatchDb(selectRows: unknown[], updateSet: ReturnType<typeof vi.fn>): Db {
  const where = vi.fn(async () => selectRows);
  const from = vi.fn(() => ({ where }));
  return {
    select: vi.fn(() => ({ from })),
    update: vi.fn(() => ({ set: updateSet })),
  } as unknown as Db;
}
