import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { listSyncQueue } from '../../db/idb';
import { resetUseListsForTest, useLists } from '../useLists';

const databaseName = 'psykl';

afterEach(async () => {
  resetUseListsForTest();
  await deleteDB(databaseName);
});

describe('useLists default list and deletion guard', () => {
  it('creates the default Tasks list on first run and queues it for sync', async () => {
    // Arrange / Act
    const { result } = renderHook(() => useLists());

    // Assert
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    const queue = await listSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ entity_type: 'list', op: 'create' });
  });

  it('does not offer to delete the only remaining (default) list', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());

    // Act / Assert
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    expect(result.current.canDelete).toBe(false);
  });

  it('deletes a list and queues the delete for sync when more than one list remains', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    await act(async () => {
      await result.current.createList('Groceries');
    });
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks', 'Groceries']);
    });
    const groceriesId = result.current.lists.find((list) => list.title === 'Groceries')?.id;
    if (!groceriesId) {
      throw new Error('expected a Groceries list to exist after createList');
    }

    // Act
    await act(async () => {
      await result.current.deleteList(groceriesId);
    });

    // Assert
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    const queue = await listSyncQueue();
    const deleteEntry = queue.find((entry) => entry.entity_id === groceriesId && entry.op === 'delete');
    expect(deleteEntry).toMatchObject({ entity_type: 'list', op: 'delete' });
  });

  it('refuses to delete the only remaining list', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    const tasksId = result.current.lists[0]?.id;
    if (!tasksId) {
      throw new Error('expected the default Tasks list to exist');
    }

    // Act
    await act(async () => {
      await result.current.deleteList(tasksId);
    });

    // Assert — the last remaining list is never deleted
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    const queue = await listSyncQueue();
    expect(queue.some((entry) => entry.op === 'delete')).toBe(false);
  });
});
