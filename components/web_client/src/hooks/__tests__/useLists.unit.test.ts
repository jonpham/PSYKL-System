import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createListRemote } from '../../api/lists.api-client';
import { listSyncQueue } from '../../db/idb';
import { resetUseListsForTest, useLists } from '../useLists';
import { DEFAULT_LIST_ID } from '../useLists.default-list';

// Same isolation strategy as TaskCreateForm.unit.test.tsx: createList/etc.
// now call enqueueWithReplay (fixing the asymmetry with Task mutations),
// which fires a detached background replay(). Left real, that replay would
// race real network + IDB work across tests via the shared fake-indexeddb.
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

describe('useLists', () => {
  it('hydrates a list that already exists server-side — never happened before this fix', async () => {
    // Arrange — simulates device A's already-established state: the
    // well-known default list plus a second list this device (B) never
    // itself touched. Before this fix, useLists had no server hydration at
    // all, so "Groceries" would never have appeared here.
    await createListRemote(
      { id: DEFAULT_LIST_ID, title: 'Tasks', position: 'a0', updated_at: '2026-06-12T16:00:00.000Z' },
      '0196f0a4-8b5a-7000-8000-0000000000a1',
    );
    await createListRemote(
      {
        id: '0196f0a4-8b5a-7000-8000-000000000099',
        title: 'Groceries',
        position: 'a1',
        updated_at: '2026-06-12T16:00:00.000Z',
      },
      '0196f0a4-8b5a-7000-8000-0000000000a2',
    );

    // Act
    const { result } = renderHook(() => useLists());

    // Assert
    await waitFor(() => {
      expect(result.current.lists.map((list) => list.title)).toEqual(['Tasks', 'Groceries']);
    });
  });

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
