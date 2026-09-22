import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listLists, putList } from '../../db/idb';
import type { ListRecord } from '../../db/idb.types';
import { resetUseListsForTest, useLists } from '../useLists';
import { DEFAULT_LIST_ID } from '../useLists.default-list';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const databaseName = 'psykl';

function listRecord(overrides: Partial<ListRecord> & Pick<ListRecord, 'id' | 'position' | 'title'>): ListRecord {
  const now = '2026-09-22T12:00:00.000Z';
  return {
    user_id: 'local',
    created_at: now,
    updated_at: now,
    server_updated_at: now,
    deleted_at: null,
    ...overrides,
  };
}

afterEach(async () => {
  mockReplay.mockReset();
  resetUseListsForTest();
  await deleteDB(databaseName);
});

describe('list ordering positions', () => {
  /**
   * `createList` used to take the new list's position from the hook's current
   * render snapshot. A list created before that snapshot caught up was given a
   * position a stored list already held, and two lists sharing a position can
   * never be re-ordered again: `generateKeyBetween` cannot split a gap of zero.
   */
  it('gives a new list a position no stored list already holds', async () => {
    // Arrange — storage is ahead of any render: a list is already at 'a0'
    await putList(listRecord({ id: '0196f0a4-8b5a-7000-8000-0000000000b1', position: 'a0', title: 'Tasks' }));
    const { result } = renderHook(() => useLists());
    await waitFor(() => expect(result.current).toBeDefined());

    // Act
    await act(async () => {
      await result.current.createList('Groceries');
    });

    // Assert
    const positions = (await listLists()).map((list) => list.position);
    expect(new Set(positions).size).toBe(positions.length);
  });

  /**
   * Two devices editing offline, or a create that raced the bootstrap before
   * the fix above, can still leave a device holding a duplicate position. The
   * arrows on such a device did nothing at all, however many times they were
   * tapped, and no error ever reached the user.
   */
  it('re-orders even when two lists already share a position', async () => {
    // Arrange — the corrupted state a user can already be holding
    await putList(listRecord({ id: '0196f0a4-8b5a-7000-8000-0000000000c1', position: 'a0', title: 'Tasks' }));
    await putList(listRecord({ id: '0196f0a4-8b5a-7000-8000-0000000000c2', position: 'a0', title: 'Groceries' }));
    await putList(listRecord({ id: '0196f0a4-8b5a-7000-8000-0000000000c3', position: 'a1', title: 'Reading' }));
    const { result } = renderHook(() => useLists());
    await waitFor(() => expect(result.current.lists).toHaveLength(3));

    // Act — move the last list up one place
    const [first, , third] = result.current.lists;
    await act(async () => {
      await result.current.moveList(third!.id, first ?? null, result.current.lists[1] ?? null);
    });

    // Assert — the move happened, and left every list on a distinct position
    const stored = await listLists();
    const positions = stored.map((list) => list.position);
    expect(new Set(positions).size).toBe(positions.length);
    expect(stored.map((list) => list.title)).toEqual(['Tasks', 'Reading', 'Groceries']);
  });

  /**
   * `ensureDefaultList` only creates "Tasks" when it finds an empty list store,
   * but set its `default_list_created` flag either way. A user who opened the
   * Lists page and added a list straight away got their list written first, so
   * the bootstrap saw a non-empty store, set the flag, and never created the
   * default list — on that device, "Tasks" was gone for good, and any task with
   * no list of its own had nowhere to appear.
   */
  it('still establishes the default list when a user adds one first', async () => {
    // Arrange — a device that has never bootstrapped
    const { result } = renderHook(() => useLists());
    await waitFor(() => expect(result.current).toBeDefined());

    // Act
    await act(async () => {
      await result.current.createList('Groceries');
    });

    // Assert — the user's list did not displace the default one
    const stored = await listLists();
    expect(stored.map((list) => list.title)).toEqual(['Tasks', 'Groceries']);
    expect(stored[0]?.id).toBe(DEFAULT_LIST_ID);
  });
});
