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

describe('TaskList batch completion (Unit)', () => {
  beforeEach(() => {
    patchTask.mockReset().mockResolvedValue(undefined);
    deleteTask.mockReset().mockResolvedValue(undefined);
    mockUseLists.mockReturnValue({ canDelete: true, lists: [{ id: 'list-groceries', title: 'Groceries' }] });
  });

  async function selectRows(...titles: string[]): Promise<void> {
    for (const title of titles) {
      await userEvent.click(screen.getByRole('button', { name: `Select ${title}` }));
    }
  }

  it('flips each selected task to its other completion state in one action', async () => {
    // Arrange — a pool holding one complete and one incomplete task
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
    await userEvent.click(screen.getByRole('button', { name: 'Toggle completion of selected tasks' }));

    // Assert — every pooled task is written, each to the opposite of what it was
    expect(patchTask).toHaveBeenCalledTimes(2);
    expect(patchTask.mock.calls[0]?.[0]).toBe(oat.id);
    expect(patchTask.mock.calls[0]?.[1]).toMatchObject({ completed_at: expect.any(String) });
    expect(patchTask.mock.calls[1]?.[0]).toBe(bread.id);
    expect(patchTask.mock.calls[1]?.[1]).toMatchObject({ completed_at: null });
  });

  it('marks a wholly completed pool incomplete again', async () => {
    // Arrange
    mockUseTasks.mockReturnValue({
      createTask: vi.fn(),
      deleteTask,
      error: null,
      loading: false,
      patchTask,
      tasks: [
        { ...oat, completed_at: '2026-05-20T13:00:00.000Z' },
        { ...bread, completed_at: '2026-05-20T13:05:00.000Z' },
      ],
    });
    render(<TaskList selecting />);
    await selectRows('Oat milk', 'Sourdough');

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Toggle completion of selected tasks' }));

    // Assert
    expect(patchTask).toHaveBeenCalledTimes(2);
    expect(patchTask.mock.calls.map((call) => call[1]?.completed_at)).toEqual([null, null]);
  });
});
