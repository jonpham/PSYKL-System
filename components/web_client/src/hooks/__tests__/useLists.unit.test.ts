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

describe('useLists', () => {
  it('creates a list optimistically and queues it for sync', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());

    // Act
    await act(async () => {
      await result.current.createList('Groceries');
    });

    // Assert — the list is readable locally before any network call
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Groceries']);
    });
    const queue = await listSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ entity_type: 'list', op: 'create' });
  });

  it('gives each new list a position that sorts after the previous one', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());

    // Act
    await act(async () => {
      await result.current.createList('First');
      await result.current.createList('Second');
    });

    // Assert
    await waitFor(() => {
      const positions = result.current.lists.map((list) => list.position);
      expect(positions).toEqual([...positions].sort());
      expect(new Set(positions).size).toBe(2);
    });
  });
});
