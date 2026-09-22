import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { listLists } from '../../db/idb';
import { resetDefaultListForTest } from '../useLists.default-list';
import { resetUseTasksForTest, useTasks } from '../useTasks';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const databaseName = 'psykl';

afterEach(async () => {
  mockReplay.mockReset();
  resetUseTasksForTest();
  resetDefaultListForTest();
  await deleteDB(databaseName);
});

describe('a task captured before the lists have finished loading', () => {
  /**
   * The active list is chosen by an effect that waits for the lists to load, so
   * a user who types into a freshly opened app can beat it. A task written with
   * no list belongs to no list: it is filtered out of every list view on the
   * next load and looks, to the user, as though their capture was thrown away.
   */
  it('still lands in the default list rather than in no list at all', async () => {
    // Arrange — nothing has bootstrapped: no lists, no active list
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    let createdListId: string | null | undefined;
    await act(async () => {
      createdListId = (await result.current.createTask('wash the car')).list_id;
    });

    // Assert — the task names the list the app is about to show it in
    const [defaultList] = await listLists();
    expect(defaultList).toBeDefined();
    expect(createdListId).toBe(defaultList?.id);
  });
});
