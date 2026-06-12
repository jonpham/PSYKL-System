import { describe, expect, it, vi } from 'vitest';
import { TaskService } from '../task.service.js';
import { mockPatchDb, taskRow } from './task.service.unit-support.js';

describe('TaskService patch conflict resolution', () => {
  it('patches a Task when updated_at is newer than the stored row', async () => {
    const currentRow = taskRow({ title: 'old', updatedAt: new Date('2026-05-20T12:00:00.000Z') });
    const updatedRow = taskRow({ title: 'new', updatedAt: new Date('2026-05-20T12:05:00.000Z') });
    const updateSet = vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => [updatedRow]),
      })),
    }));
    const service = new TaskService(mockPatchDb([currentRow], updateSet));

    // Given
    const newerPatch = {
      title: 'new',
      updated_at: '2026-05-20T12:05:00.000Z',
    };

    // When
    const patched = await service.patchTask('local', currentRow.id, newerPatch);

    // Then
    expect(patched.title).toBe('new');
    expect(patched.updated_at).toBe('2026-05-20T12:05:00.000Z');
    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'new',
        updatedAt: new Date('2026-05-20T12:05:00.000Z'),
      }),
    );
  });

  it('returns the current row without updating when PATCH updated_at is older than the row', async () => {
    const currentRow = taskRow({ title: 'current', updatedAt: new Date('2026-05-20T12:05:00.000Z') });
    const updateSet = vi.fn();
    const service = new TaskService(mockPatchDb([currentRow], updateSet));

    // Given
    const olderPatch = {
      title: 'older client edit',
      updated_at: '2026-05-20T12:00:00.000Z',
    };

    // When
    const patched = await service.patchTask('local', currentRow.id, olderPatch);

    // Then
    expect(patched.title).toBe('current');
    expect(patched.updated_at).toBe('2026-05-20T12:05:00.000Z');
    expect(updateSet).not.toHaveBeenCalled();
  });

  it('clears deleted_at when a newer PATCH resurrects a tombstoned Task', async () => {
    const currentRow = taskRow({
      title: 'deleted',
      updatedAt: new Date('2026-05-20T12:00:00.000Z'),
      deletedAt: new Date('2026-05-20T12:00:00.000Z'),
    });
    const updatedRow = taskRow({
      title: 'resurrected',
      updatedAt: new Date('2026-05-20T12:05:00.000Z'),
      deletedAt: null,
    });
    const updateSet = vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => [updatedRow]),
      })),
    }));
    const service = new TaskService(mockPatchDb([currentRow], updateSet));

    // Given
    const newerPatch = {
      title: 'resurrected',
      updated_at: '2026-05-20T12:05:00.000Z',
    };

    // When
    const patched = await service.patchTask('local', currentRow.id, newerPatch);

    // Then
    expect(patched.deleted_at).toBeNull();
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: null }));
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
      const service = new TaskService(mockPatchDb([currentRow], updateSet));

      // Given
      const futurePatch = {
        title: 'future',
        updated_at: '2026-05-20T12:06:00.000Z',
      };

      // When
      const patched = await service.patchTask('local', currentRow.id, futurePatch);

      // Then
      expect(patched.updated_at).toBe('2026-05-20T12:00:00.000Z');
      expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: now }));
    } finally {
      vi.useRealTimers();
    }
  });
});
