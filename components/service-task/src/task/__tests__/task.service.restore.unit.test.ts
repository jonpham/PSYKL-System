import { describe, expect, it, vi } from 'vitest';

import type { Db } from '../../db/index.js';
import { TaskService } from '../task.service.js';
import { taskRow } from './task.service.unit-support.js';

function mockRestoreDb(selectRows: unknown[], updateSet: ReturnType<typeof vi.fn>): Db {
  const where = vi.fn(async () => selectRows);
  const from = vi.fn(() => ({ where }));
  return {
    select: vi.fn(() => ({ from })),
    update: vi.fn(() => ({ set: updateSet })),
  } as unknown as Db;
}

describe('TaskService.restoreTask', () => {
  it('clears deleted_at and bumps updated_at when the restore is newer', async () => {
    const currentRow = taskRow({
      updatedAt: new Date('2026-05-20T12:00:00.000Z'),
      deletedAt: new Date('2026-05-20T12:00:00.000Z'),
    });
    const restoredRow = taskRow({ updatedAt: new Date('2026-05-20T12:05:00.000Z'), deletedAt: null });
    const updateSet = vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(async () => [restoredRow]) })) }));
    const service = new TaskService(mockRestoreDb([currentRow], updateSet));

    // Given
    const restoreInput = { updated_at: '2026-05-20T12:05:00.000Z' };

    // When
    const restored = await service.restoreTask('local', currentRow.id, restoreInput);

    // Then
    expect(restored.deleted_at).toBeNull();
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: null }));
  });

  it('is a no-op returning the stored row when restore updated_at is not newer', async () => {
    const currentRow = taskRow({
      updatedAt: new Date('2026-05-20T12:05:00.000Z'),
      deletedAt: new Date('2026-05-20T12:05:00.000Z'),
    });
    const updateSet = vi.fn();
    const service = new TaskService(mockRestoreDb([currentRow], updateSet));

    // Given
    const staleRestoreInput = { updated_at: '2026-05-20T12:00:00.000Z' };

    // When
    const result = await service.restoreTask('local', currentRow.id, staleRestoreInput);

    // Then
    expect(result.deleted_at).toBe('2026-05-20T12:05:00.000Z');
    expect(updateSet).not.toHaveBeenCalled();
  });
});
