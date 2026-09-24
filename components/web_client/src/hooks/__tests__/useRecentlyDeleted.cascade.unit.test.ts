import 'fake-indexeddb/auto';

import { renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { v7 as uuidv7 } from 'uuid';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getTask, putList, putTask } from '../../db/idb';
import { useRecentlyDeleted } from '../useRecentlyDeleted';
import { resetUseTasksForTest } from '../useTasks';

const databaseName = 'psykl';
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

afterEach(async () => {
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB(databaseName);
});

const cascadedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const listId = '01940000-0000-7000-8000-0000000000a1';

function deletedList(deletedAt: string) {
  return {
    created_at: deletedAt,
    deleted_at: deletedAt,
    id: listId,
    position: 'a1',
    server_updated_at: deletedAt,
    title: 'Groceries',
    updated_at: deletedAt,
    user_id: 'local',
  };
}

function deletedTask(overrides: { deleted_at: string; id?: string; list_id?: string | null; title?: string }) {
  return {
    completed_at: null,
    created_at: overrides.deleted_at,
    deleted_at: overrides.deleted_at,
    id: overrides.id ?? uuidv7(),
    list_id: overrides.list_id ?? listId,
    server_updated_at: overrides.deleted_at,
    title: overrides.title ?? 'Milk',
    updated_at: overrides.deleted_at,
    user_id: 'local',
  };
}

describe('useRecentlyDeleted cascaded lists', () => {
  it('counts the items a list was deleted with, and still lists them', async () => {
    // Given — a list and two of its tasks tombstoned in the same action
    await putList(deletedList(cascadedAt));
    await putTask(deletedTask({ deleted_at: cascadedAt, title: 'Milk' }));
    await putTask(deletedTask({ deleted_at: cascadedAt, title: 'Eggs' }));

    // When
    const { result } = renderHook(() => useRecentlyDeleted());

    // Then
    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ itemCount: 2, title: 'Groceries', type: 'list' })]),
    );
  });

  it('does not count a task deleted on its own before the list went', async () => {
    // Given — same list, but this task was deleted an hour earlier
    const earlier = new Date(new Date(cascadedAt).getTime() - 60 * 60 * 1000).toISOString();
    await putList(deletedList(cascadedAt));
    await putTask(deletedTask({ deleted_at: earlier, title: 'Bread' }));

    // When
    const { result } = renderHook(() => useRecentlyDeleted());

    // Then — its own deletion is its own row, not part of the list's
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    const list = result.current.items.find((item) => item.type === 'list');
    expect(list?.itemCount).toBe(0);
  });

  it('restores a list together with the items deleted alongside it', async () => {
    // Given
    const milkId = '01940000-0000-7000-8000-0000000000b1';
    const breadId = '01940000-0000-7000-8000-0000000000b2';
    const earlier = new Date(new Date(cascadedAt).getTime() - 60 * 60 * 1000).toISOString();
    await putList(deletedList(cascadedAt));
    await putTask(deletedTask({ deleted_at: cascadedAt, id: milkId, title: 'Milk' }));
    await putTask(deletedTask({ deleted_at: earlier, id: breadId, title: 'Bread' }));
    const { result } = renderHook(() => useRecentlyDeleted());
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // When
    const list = result.current.items.find((item) => item.type === 'list');
    await result.current.restore(list!);

    // Then — the cascaded task comes back with the list; the one deleted on its
    // own stays deleted, because it was never part of this deletion
    await waitFor(async () => {
      expect(await getTask(milkId)).toEqual(expect.objectContaining({ deleted_at: null, list_id: listId }));
    });
    expect(await getTask(breadId)).toEqual(expect.objectContaining({ deleted_at: earlier }));
  });
});
