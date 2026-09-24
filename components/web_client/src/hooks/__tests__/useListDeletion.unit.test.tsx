import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../api/client';
import { useListDeletion } from '../useListDeletion';

const deleteList = vi.hoisted(() => vi.fn());
const deleteTask = vi.hoisted(() => vi.fn());
const patchTask = vi.hoisted(() => vi.fn());
const mockUseLists = vi.hoisted(() => vi.fn());
const mockUseTasks = vi.hoisted(() => vi.fn());

vi.mock('../useLists', () => ({ useLists: mockUseLists }));
vi.mock('../useTasks', () => ({ useTasks: mockUseTasks }));
vi.mock('../useActiveList', () => ({ useActiveListId: () => 'list-groceries' }));

function task(id: string, title: string): Task {
  return {
    completed_at: null,
    created_at: '2026-09-23T09:00:00.000Z',
    deleted_at: null,
    id,
    list_id: 'list-groceries',
    server_updated_at: '2026-09-23T09:00:00.500Z',
    title,
    updated_at: '2026-09-23T09:00:00.000Z',
    user_id: 'local',
  };
}

const milk = task('01940000-0000-7000-8000-000000000001', 'Milk');
const eggs = task('01940000-0000-7000-8000-000000000002', 'Eggs');

describe('useListDeletion (Unit)', () => {
  beforeEach(() => {
    deleteList.mockReset().mockResolvedValue(undefined);
    deleteTask.mockReset().mockResolvedValue(undefined);
    patchTask.mockReset().mockResolvedValue(undefined);
    mockUseLists.mockReturnValue({
      deleteList,
      // Position order: the first list that is not the one being deleted is
      // the default list, which is where kept items go.
      lists: [
        { id: 'list-tasks', title: 'Tasks' },
        { id: 'list-groceries', title: 'Groceries' },
      ],
    });
    mockUseTasks.mockReturnValue({ deleteTask, patchTask, tasks: [milk, eggs] });
  });

  it('counts what the active list still holds', () => {
    // Arrange / Act
    const { result } = renderHook(() => useListDeletion());

    // Assert
    expect(result.current.activeListItemCount).toBe(2);
  });

  it('deletes every item with the list, all stamped at the same moment', async () => {
    // Arrange
    const { result } = renderHook(() => useListDeletion());

    // Act
    await result.current.deleteActiveList('with-items');

    // Assert — one shared deleted_at is what later groups these tasks under
    // their list in Recently Deleted
    expect(deleteTask).toHaveBeenCalledTimes(2);
    const stamps = deleteTask.mock.calls.map((call) => call[1].deleted_at);
    expect(new Set(stamps).size).toBe(1);
    expect(deleteList).toHaveBeenCalledWith('list-groceries', stamps[0]);
    expect(patchTask).not.toHaveBeenCalled();
  });

  it('moves the items to the default list when only the list goes', async () => {
    // Arrange
    const { result } = renderHook(() => useListDeletion());

    // Act
    await result.current.deleteActiveList('just-list');

    // Assert
    expect(patchTask).toHaveBeenCalledTimes(2);
    expect(patchTask.mock.calls.map((call) => [call[0], call[1].list_id])).toEqual([
      [milk.id, 'list-tasks'],
      [eggs.id, 'list-tasks'],
    ]);
    expect(deleteTask).not.toHaveBeenCalled();
    expect(deleteList).toHaveBeenCalledTimes(1);
  });

  it('empties the list before the list itself goes, so nothing is re-homed mid-flight', async () => {
    // Arrange — the server re-homes a task whose list is gone, so the tasks
    // have to settle before the list is tombstoned
    const order: string[] = [];
    deleteTask.mockImplementation(() => {
      order.push('task');
      return Promise.resolve();
    });
    deleteList.mockImplementation(() => {
      order.push('list');
      return Promise.resolve();
    });
    const { result } = renderHook(() => useListDeletion());

    // Act
    await result.current.deleteActiveList('with-items');

    // Assert
    expect(order).toEqual(['task', 'task', 'list']);
  });

  it('still deletes a list whose items have nowhere to go', async () => {
    // Arrange — no other live list to keep the items in
    mockUseLists.mockReturnValue({ deleteList, lists: [{ id: 'list-groceries', title: 'Groceries' }] });
    const { result } = renderHook(() => useListDeletion());

    // Act
    await result.current.deleteActiveList('just-list');

    // Assert — the server's orphan sweep is the backstop for the items
    expect(patchTask).not.toHaveBeenCalled();
    expect(deleteList).toHaveBeenCalledTimes(1);
  });
});
