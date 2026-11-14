import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listSyncQueue } from '../../db/idb';
import { resetUseListsForTest, useLists } from '../useLists';
import { DEFAULT_LIST_ID, ensureDefaultList, getDefaultListId } from '../useLists.default-list';

// See useLists.unit.test.ts — deleteList now calls enqueueWithReplay, which
// fires a detached background replay() that must not race real network/IDB
// work across tests.
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/replay')>();
  return {
    ...actual,
    replay: mockReplay,
  };
});

const databaseName = 'psykl';

afterEach(async () => {
  mockReplay.mockReset();
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

  it('creates the default list with a well-known id, not a random one, so two devices agree without syncing first', async () => {
    // Arrange / Act
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });

    // Assert — a fixed id (not uuidv7()) means every device that bootstraps
    // before its first sync computes the same list id, so a task created on
    // one device still resolves to the same list on another (see the
    // multi-device race documented in useLists.default-list.ts).
    expect(DEFAULT_LIST_ID).toBeTruthy();
    expect(result.current.lists[0]?.id).toBe(DEFAULT_LIST_ID);
  });

  it('does not offer to delete the default list', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });

    // Act
    await act(async () => {
      await result.current.createList('Groceries');
    });

    // Assert — another list exists, and the default list is still protected
    await waitFor(() => {
      expect(result.current.lists).toHaveLength(2);
    });
    expect(result.current.canDeleteList(DEFAULT_LIST_ID)).toBe(false);
  });

  it('still protects the default list after it is renamed', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    await act(async () => {
      await result.current.createList('Groceries');
    });
    await waitFor(() => {
      expect(result.current.lists).toHaveLength(2);
    });
    await act(async () => {
      await result.current.renameList(DEFAULT_LIST_ID, 'Inbox');
    });
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Inbox', 'Groceries']);
    });

    // Act
    await act(async () => {
      await result.current.deleteList(DEFAULT_LIST_ID);
    });

    // Assert — the rule follows the id, not the title
    expect(result.current.lists.map((list) => list.title)).toEqual(['Inbox', 'Groceries']);
    expect(result.current.canDeleteList(DEFAULT_LIST_ID)).toBe(false);
    expect((await listSyncQueue()).some((entry) => entry.op === 'delete')).toBe(false);
  });

  it('keeps the Tasks list as the default after another list is moved above it', async () => {
    // Arrange
    const { result } = renderHook(() => useLists());
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks']);
    });
    await act(async () => {
      await result.current.createList('Groceries');
    });
    await waitFor(() => {
      expect(result.current.lists).toHaveLength(2);
    });
    const [tasks, groceries] = result.current.lists;
    await act(async () => {
      await result.current.moveList(groceries!.id, null, tasks!);
    });
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Groceries', 'Tasks']);
    });

    // Act
    await ensureDefaultList();

    // Assert — the default follows the fixed id, not the top position
    expect(getDefaultListId()).toBe(DEFAULT_LIST_ID);
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
    expect(result.current.canDeleteList(groceriesId)).toBe(true);

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
