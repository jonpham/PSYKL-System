import { describe, expect, it, vi } from 'vitest';
import { TaskService } from '../task.service.js';
import { taskRow } from './task.service.unit-support.js';
import type { Db } from '../../db/index.js';

function mockDeleteDb(selectRows: unknown[], updateSet: ReturnType<typeof vi.fn>): Db {
  const where = vi.fn(async () => selectRows);
  const from = vi.fn(() => ({ where }));
  return {
    select: vi.fn(() => ({ from })),
    update: vi.fn(() => ({ set: updateSet })),
  } as unknown as Db;
}

describe('TaskService delete conflict resolution', () => {
  it('uses the same clamped timestamp for deleted_at and updated_at', async () => {
    const now = new Date('2026-05-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const currentRow = taskRow({ updatedAt: new Date('2026-05-20T11:00:00.000Z') });
      const updatedRow = taskRow({ updatedAt: now, deletedAt: now });
      const updateSet = vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [updatedRow]),
        })),
      }));
      const service = new TaskService(mockDeleteDb([currentRow], updateSet));

      // Given
      const futureDelete = {
        deleted_at: '2026-05-20T12:06:00.000Z',
        updated_at: '2026-05-20T12:06:00.000Z',
      };

      // When
      const deleted = await service.deleteTask('local', currentRow.id, futureDelete);

      // Then
      expect(deleted.deleted_at).toBe('2026-05-20T12:00:00.000Z');
      expect(deleted.updated_at).toBe('2026-05-20T12:00:00.000Z');
      expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: now, updatedAt: now }));
      const [updateValues] = updateSet.mock.calls[0] as unknown as [{ deletedAt: Date; updatedAt: Date }];
      expect(updateValues.deletedAt).toBe(updateValues.updatedAt);
    } finally {
      vi.useRealTimers();
    }
  });
});
