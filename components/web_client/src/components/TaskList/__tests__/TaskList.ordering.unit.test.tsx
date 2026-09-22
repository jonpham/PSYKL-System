import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({
  useTasks: mockUseTasks,
}));

function task(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    completed_at: null,
    created_at: '2026-05-20T12:00:00.000Z',
    deleted_at: null,
    list_id: null,
    server_updated_at: '2026-05-20T12:00:00.500Z',
    title: overrides.id,
    updated_at: '2026-05-20T12:00:00.000Z',
    user_id: 'local',
    ...overrides,
  };
}

describe('TaskList ordering and load failure (Unit)', () => {
  beforeEach(() => {
    mockUseTasks.mockReset();
  });

  it('settles completed tasks below the ones still open', () => {
    // Arrange — the hook hands tasks back newest-first
    mockUseTasks.mockReturnValue({
      error: null,
      loading: false,
      tasks: [
        task({ id: 'done', completed_at: '2026-05-20T13:00:00.000Z' }),
        task({ id: 'newer', created_at: '2026-05-20T12:05:00.000Z' }),
        task({ id: 'older', created_at: '2026-05-20T12:00:00.000Z' }),
      ],
    });

    // Act
    render(<TaskList />);

    // Assert — open tasks oldest-first, completed sunk to the bottom
    const titles = screen.getAllByRole('listitem').map((row) => row.getAttribute('aria-label'));
    expect(titles).toEqual(['older', 'newer', 'done']);
  });

  it('stays quiet about a failed load while the device still has tasks to show', () => {
    // Arrange
    mockUseTasks.mockReturnValue({
      error: 'boom',
      loading: false,
      tasks: [task({ id: 'still here' })],
    });

    // Act
    render(<TaskList />);

    // Assert — an error banner over a usable list is noise, not information
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-label', 'still here');
  });

  it('surfaces a failed load when there is nothing on the device to show', () => {
    // Arrange
    mockUseTasks.mockReturnValue({ error: 'boom', loading: false, tasks: [] });

    // Act
    render(<TaskList />);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(/boom/i);
  });
});
