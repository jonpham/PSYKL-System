import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../api/client';
import { listSyncQueue, putTask } from '../../db/idb';
import { resetUseTasksForTest, useTasks } from '../useTasks';

// Same isolation strategy as useLists.unit.test.ts: createTask/patchTask/
// deleteTask call enqueueWithReplay, which fires a detached background
// replay() that must not race real network/IDB work across tests.
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/replay')>();
  return {
    ...actual,
    replay: mockReplay,
  };
});

const databaseName = 'psykl';

const visibleTask: Task = {
  id: '0196f0a4-8b5a-7000-8000-000000000101',
  user_id: 'local',
  title: 'visible task',
  created_at: '2026-06-12T16:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-12T16:00:00.000Z',
  server_updated_at: '2026-06-12T16:00:01.000Z',
  deleted_at: null,
  list_id: null,
};

afterEach(async () => {
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB(databaseName);
});

describe('useTasks mutations', () => {
  it('createTask() writes the task locally and queues it for sync', async () => {
    // Arrange
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    let created: Task | undefined;
    await act(async () => {
      created = await result.current.createTask('wash the car');
    });

    // Assert
    expect(created?.title).toBe('wash the car');
    await waitFor(() => {
      expect(result.current.tasks.map((task) => task.title)).toContain('wash the car');
    });
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_type: 'task', op: 'create' }]);
  });

  it('patchTask() writes the optimistic Task locally and queues a patch op', async () => {
    // Arrange
    await putTask(visibleTask);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const updated_at = '2026-06-12T18:00:00.000Z';
    const optimistic: Task = { ...visibleTask, title: 'renamed', updated_at };

    // Act
    await act(async () => {
      await result.current.patchTask(visibleTask.id, { title: 'renamed', updated_at }, optimistic);
    });

    // Assert
    await waitFor(() => {
      expect(result.current.tasks.map((task) => task.title)).toContain('renamed');
    });
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: visibleTask.id, entity_type: 'task', op: 'patch' }]);
  });

  it('deleteTask() soft-deletes locally and queues a delete op', async () => {
    // Arrange
    await putTask(visibleTask);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const deleted_at = '2026-06-12T18:00:00.000Z';
    const optimistic: Task = { ...visibleTask, deleted_at, updated_at: deleted_at };

    // Act
    await act(async () => {
      await result.current.deleteTask(visibleTask.id, { deleted_at, updated_at: deleted_at }, optimistic);
    });

    // Assert
    await waitFor(() => {
      expect(result.current.tasks).toEqual([]);
    });
    const queue = await listSyncQueue();
    expect(queue).toMatchObject([{ entity_id: visibleTask.id, entity_type: 'task', op: 'delete' }]);
  });
});
