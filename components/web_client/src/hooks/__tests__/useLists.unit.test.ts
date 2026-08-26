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
    // Arrange — wait for the default list so createList sees a stable snapshot
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });

    // Act
    await act(async () => {
      await result.current.createList('Groceries');
    });

    // Assert — the list is readable locally before any network call
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks', 'Groceries']);
    });
    const queue = await listSyncQueue();
    const createEntries = queue.filter((entry) => entry.entity_type === 'list' && entry.op === 'create');
    expect(createEntries).toHaveLength(2);
    expect(createEntries.some((entry) => (entry.body as { title?: string }).title === 'Groceries')).toBe(true);
  });

  it('gives each new list a position that sorts after the previous one', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });

    // Act
    await act(async () => {
      await result.current.createList('First');
      await result.current.createList('Second');
    });

    // Assert
    await waitFor(() => {
      const positions = result.current.lists.map((list) => list.position);
      expect(positions).toEqual([...positions].sort());
      expect(new Set(positions).size).toBe(3);
    });
  });

  it('renames a list and queues the patch for sync', async () => {
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
    const listId = result.current.lists.find((list) => list.title === 'Groceries')?.id;
    if (!listId) {
      throw new Error('expected a Groceries list to exist after createList');
    }

    // Act
    await act(async () => {
      await result.current.renameList(listId, 'Weekly Groceries');
    });

    // Assert
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks', 'Weekly Groceries']);
    });
    const queue = await listSyncQueue();
    const patchEntry = queue.find((entry) => entry.op === 'patch');
    expect(patchEntry).toMatchObject({ entity_id: listId, entity_type: 'list', op: 'patch' });
    expect(patchEntry?.body).toMatchObject({ title: 'Weekly Groceries' });
  });

  it('moves a list between two others and queues the patch for sync', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    await act(async () => {
      await result.current.createList('First');
      await result.current.createList('Second');
      await result.current.createList('Third');
    });
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks', 'First', 'Second', 'Third']);
    });
    const [, first, second, third] = result.current.lists;
    if (!first || !second || !third) {
      throw new Error('expected three lists to exist after createList');
    }

    // Act — move "Third" to sit between "First" and "Second"
    await act(async () => {
      await result.current.moveList(third.id, first, second);
    });

    // Assert
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks', 'First', 'Third', 'Second']);
    });
    const positions = result.current.lists.map((list) => list.position);
    expect(positions).toEqual([...positions].sort());
    expect(new Set(positions).size).toBe(4);

    const queue = await listSyncQueue();
    const patchEntry = queue.find((entry) => entry.entity_id === third.id && entry.op === 'patch');
    expect(patchEntry).toMatchObject({ entity_type: 'list', op: 'patch' });
    const movedList = result.current.lists.find((list) => list.id === third.id);
    expect(patchEntry?.body).toMatchObject({ position: movedList?.position });
  });
});
