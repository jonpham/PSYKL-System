import { render, screen } from '@testing-library/react';
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

describe('TaskList selection mode (Unit)', () => {
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

  it('replaces the new-task button with the action bar the moment selection mode opens', async () => {
    // Arrange
    render(<TaskList selecting />);

    // Assert — the bar is the mode's control surface, but an empty pool has
    // nothing to act on, so its actions are unavailable rather than absent
    expect(screen.queryByRole('button', { name: 'New Task' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete selected tasks' })).toBeDisabled();
    expect(screen.getByRole('toolbar', { name: 'Nothing selected' })).toBeInTheDocument();

    // Act
    await selectRows('Oat milk');

    // Assert
    expect(screen.getByRole('button', { name: 'Delete selected tasks' })).toBeEnabled();
    expect(screen.getByRole('toolbar', { name: '1 selected' })).toBeInTheDocument();
  });

  it('brings the new-task button back when selection mode closes', () => {
    // Arrange / Act
    render(<TaskList selecting={false} />);

    // Assert
    expect(screen.getByRole('button', { name: 'New Task' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('keeps titles out of edit mode while selecting', async () => {
    // Arrange
    render(<TaskList selecting />);

    // Act
    await selectRows('Oat milk');

    // Assert
    expect(screen.queryByRole('textbox', { name: 'Edit title' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Oat milk' })).not.toBeInTheDocument();
  });

  it('deletes every selected task, but only after the action is confirmed', async () => {
    // Arrange
    render(<TaskList selecting />);
    await selectRows('Oat milk', 'Coffee beans');

    // Act — the first press arms the action rather than performing it
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected tasks' }));

    // Assert
    expect(deleteTask).not.toHaveBeenCalled();
    const armed = screen.getByRole('button', { name: 'Confirm deleting 2 tasks' });
    expect(armed).toHaveAttribute('data-armed', 'true');

    // Act
    await userEvent.click(armed);

    // Assert
    expect(deleteTask).toHaveBeenCalledTimes(2);
    expect(deleteTask.mock.calls.map((call) => call[0])).toEqual([oat.id, beans.id]);
  });

  it('disarms a pending delete when the selection changes', async () => {
    // Arrange
    render(<TaskList selecting />);
    await selectRows('Oat milk');
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected tasks' }));
    expect(screen.getByRole('button', { name: 'Confirm deleting 1 task' })).toBeInTheDocument();

    // Act — changing what is pooled changes what the armed action would destroy
    await selectRows('Sourdough');

    // Assert
    expect(screen.getByRole('button', { name: 'Delete selected tasks' })).toBeInTheDocument();
    expect(deleteTask).not.toHaveBeenCalled();
  });

  it('disarms a pending delete when another batch action is taken', async () => {
    // Arrange
    render(<TaskList selecting />);
    await selectRows('Oat milk');
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected tasks' }));

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Move selected tasks' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Delete selected tasks' })).toBeInTheDocument();
  });

  it('marks every selected task complete in one action, leaving completed ones alone', async () => {
    // Arrange
    mockUseTasks.mockReturnValue({
      createTask: vi.fn(),
      deleteTask,
      error: null,
      loading: false,
      patchTask,
      tasks: [oat, { ...bread, completed_at: '2026-05-20T13:00:00.000Z' }],
    });
    render(<TaskList selecting />);
    await selectRows('Oat milk', 'Sourdough');

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Mark selected tasks complete' }));

    // Assert
    expect(patchTask).toHaveBeenCalledTimes(1);
    expect(patchTask.mock.calls[0]?.[0]).toBe(oat.id);
    expect(patchTask.mock.calls[0]?.[1]).toMatchObject({ completed_at: expect.any(String) });
  });

  it('re-orders open tasks by hand and holds the new order', async () => {
    // Arrange
    render(<TaskList selecting />);
    const titles = () => screen.getAllByRole('listitem').map((row) => row.textContent);
    expect(titles()).toEqual(['Oat milk', 'Sourdough', 'Coffee beans']);

    // Act — keyboard is the pointer-free equivalent of dragging the handle
    screen.getByRole('button', { name: 'Reorder Coffee beans' }).focus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');

    // Assert
    expect(titles()).toEqual(['Coffee beans', 'Oat milk', 'Sourdough']);
  });

  it('clears the pool when selection mode is left', async () => {
    // Arrange
    const { rerender } = render(<TaskList selecting />);
    await selectRows('Oat milk');

    // Act
    rerender(<TaskList selecting={false} />);
    rerender(<TaskList selecting />);

    // Assert
    expect(screen.getByRole('button', { name: 'Delete selected tasks' })).toBeDisabled();
  });
});
