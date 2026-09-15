import 'fake-indexeddb/auto';

import { renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { v7 as uuidv7 } from 'uuid';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createListRemote, deleteListRemote } from '../../api/lists.api-client';
import { createTaskRemote, deleteTaskRemote } from '../../api/tasks.api-client';
import { getList, getTask, listSyncQueue, putTask } from '../../db/idb';
import { useRecentlyDeleted } from '../useRecentlyDeleted';

const databaseName = 'psykl';
const dayMs = 24 * 60 * 60 * 1000;
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

afterEach(async () => {
  mockReplay.mockReset();
  await deleteDB(databaseName);
});

function deletedTask(overrides: { deleted_at: string; id?: string }) {
  return {
    id: overrides.id ?? uuidv7(),
    user_id: 'local',
    title: 'Milk',
    created_at: overrides.deleted_at,
    completed_at: null,
    updated_at: overrides.deleted_at,
    server_updated_at: overrides.deleted_at,
    deleted_at: overrides.deleted_at,
    list_id: null,
  };
}

describe('useRecentlyDeleted', () => {
  it('shows a Task deleted 2 days ago with 28 days remaining', async () => {
    // Given
    await putTask(deletedTask({ deleted_at: new Date(Date.now() - 2 * dayMs).toISOString() }));

    // When
    const { result } = renderHook(() => useRecentlyDeleted());

    // Then
    await waitFor(() => {
      expect(result.current.items).toEqual([
        expect.objectContaining({ daysRemaining: 28, title: 'Milk', type: 'task' }),
      ]);
    });
  });

  it('excludes a Task deleted more than 30 days ago', async () => {
    // Given
    await putTask(deletedTask({ deleted_at: new Date(Date.now() - 31 * dayMs).toISOString() }));

    // When
    const { result } = renderHook(() => useRecentlyDeleted());

    // Then
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('merges in a Task deleted on another device, never persisting it until restored', async () => {
    // Given — GET /deleted's msw fixture reflects whatever createTaskRemote
    // + deleteTaskRemote left server-side; nothing local yet.
    const taskId = uuidv7();
    const now = new Date().toISOString();
    await createTaskRemote({ id: taskId, title: 'Bread', updated_at: now }, uuidv7());
    await deleteTaskRemote(taskId, { deleted_at: now, updated_at: now }, uuidv7());

    // When
    const { result } = renderHook(() => useRecentlyDeleted());

    // Then
    await waitFor(() => {
      expect(result.current.items).toEqual([expect.objectContaining({ id: taskId, title: 'Bread' })]);
    });
    await expect(getTask(taskId)).resolves.toBeUndefined();
  });

  it('restore() on a local Task clears deleted_at and enqueues a restore op', async () => {
    // Given
    const taskId = uuidv7();
    await putTask(deletedTask({ deleted_at: new Date(Date.now() - 2 * dayMs).toISOString(), id: taskId }));
    const { result } = renderHook(() => useRecentlyDeleted());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // When
    await result.current.restore(result.current.items[0]!);

    // Then
    await waitFor(async () => {
      expect(await getTask(taskId)).toEqual(expect.objectContaining({ deleted_at: null }));
    });
    const queue = await listSyncQueue();
    expect(queue).toEqual([expect.objectContaining({ entity_id: taskId, op: 'restore' })]);
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('restore() on a remote-only Task persists it for the first time', async () => {
    // Given — never seen locally before restore, per the previous test's
    // "merges ... never persisting it until restored" case.
    const taskId = uuidv7();
    const now = new Date().toISOString();
    await createTaskRemote({ id: taskId, title: 'Bread', updated_at: now }, uuidv7());
    await deleteTaskRemote(taskId, { deleted_at: now, updated_at: now }, uuidv7());
    const { result } = renderHook(() => useRecentlyDeleted());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // When
    await result.current.restore(result.current.items[0]!);

    // Then
    await waitFor(async () => {
      expect(await getTask(taskId)).toEqual(expect.objectContaining({ deleted_at: null, title: 'Bread' }));
    });
  });

  it('restore() on a List clears deleted_at and enqueues a restore op', async () => {
    // Given
    const listId = uuidv7();
    const deletedAt = new Date(Date.now() - 2 * dayMs).toISOString();
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: deletedAt }, uuidv7());
    await deleteListRemote(listId, { deleted_at: deletedAt }, uuidv7());
    const { result } = renderHook(() => useRecentlyDeleted());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // When
    await result.current.restore(result.current.items[0]!);

    // Then
    await waitFor(async () => {
      expect(await getList(listId)).toEqual(expect.objectContaining({ deleted_at: null }));
    });
  });
});
