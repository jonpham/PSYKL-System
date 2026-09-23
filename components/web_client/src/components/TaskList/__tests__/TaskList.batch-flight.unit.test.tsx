import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());
const mockUseLists = vi.hoisted(() => vi.fn());
const patchTask = vi.hoisted(() => vi.fn());
const deleteTask = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({ useTasks: mockUseTasks }));
vi.mock('../../../hooks/useLists', () => ({ useLists: mockUseLists }));
vi.mock('../../../hooks/useCompletedVisibility', () => ({
  useCompletedVisibility: () => ({ setShowCompleted: () => {}, showCompleted: true }),
}));
vi.mock('../../../hooks/useSyncDiscrepancy', () => ({
  useSyncDiscrepancy: () => ({ count: 0, level: 'ok' }),
}));
vi.mock('../../../hooks/useActiveList', () => ({
  setActiveListId: () => {},
  useActiveListId: () => 'list-groceries',
}));

function task(id: string, title: string, completedAt: string | null = null): Task {
  return {
    completed_at: completedAt,
    created_at: `2026-05-20T12:0${id.at(-1)}:00.000Z`,
    deleted_at: null,
    id,
    list_id: 'list-groceries',
    server_updated_at: '2026-05-20T12:00:00.500Z',
    title,
    updated_at: '2026-05-20T12:00:00.000Z',
    user_id: 'local',
  };
}

const oat = task('01940000-0000-7000-8000-000000000001', 'Oat milk');
const bread = task('01940000-0000-7000-8000-000000000002', 'Sourdough');
const beans = task('01940000-0000-7000-8000-000000000003', 'Coffee beans');

describe('TaskList batch actions in flight (Unit)', () => {
  beforeEach(() => {
    patchTask.mockReset().mockResolvedValue(undefined);
    deleteTask.mockReset().mockResolvedValue(undefined);
    mockUseTasks.mockReturnValue({
      createTask: vi.fn(),
      deleteTask,
      error: null,
      loading: false,
      patchTask,
      tasks: [oat, bread, beans],
    });
    mockUseLists.mockReturnValue({
      canDelete: true,
      lists: [
        { id: 'list-groceries', title: 'Groceries' },
        { id: 'list-errands', title: 'Errands' },
        { id: 'list-weekend', title: 'Weekend' },
      ],
    });
  });

  async function selectRows(...titles: string[]): Promise<void> {
    for (const title of titles) {
      await userEvent.click(screen.getByRole('button', { name: `Select ${title}` }));
    }
  }

  it('leaves selection mode once a batch action finishes', async () => {
    // Arrange
    const onExitSelection = vi.fn();
    render(<TaskList onExitSelection={onExitSelection} selecting />);
    await selectRows('Oat milk');

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Mark selected tasks complete' }));

    // Assert — the user is returned to the list, seeing the result of what they did
    expect(onExitSelection).toHaveBeenCalledTimes(1);
  });

  it('holds the rows and the bar still while a batch is in flight', async () => {
    // Arrange — patches that do not settle until this test says so. Every call
    // gets its own resolver: the batch is awaited as a whole, so releasing one
    // of two would leave it pending.
    const settlers: Array<() => void> = [];
    patchTask.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settlers.push(() => resolve());
        }),
    );
    render(<TaskList selecting />);
    await selectRows('Oat milk', 'Sourdough');

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Mark selected tasks complete' }));

    // Assert — nothing about the pool can be changed mid-flight
    expect(screen.getByRole('button', { name: 'Deselect Oat milk' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Deselect Oat milk' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mark selected tasks complete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reorder Oat milk' })).toBeDisabled();

    // Act
    for (const settle of settlers) settle();

    // Assert
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Deselect Oat milk' })).not.toBeInTheDocument());
  });

  it('applies the rest of a batch when one task fails', async () => {
    // Arrange
    patchTask.mockRejectedValueOnce(new Error('device storage is full')).mockResolvedValue(undefined);
    render(<TaskList selecting />);
    await selectRows('Oat milk', 'Sourdough');

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Mark selected tasks complete' }));

    // Assert — one failure does not strand the tasks behind it
    await waitFor(() => expect(patchTask).toHaveBeenCalledTimes(2));
  });
});
