import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({
  useTasks: mockUseTasks,
}));

const sampleTasks: Task[] = [
  {
    id: '01940000-0000-7000-8000-000000000001',
    user_id: 'local',
    title: 'one',
    created_at: '2026-05-20T12:00:00.000Z',
    completed_at: null,
    updated_at: '2026-05-20T12:00:00.000Z',
    server_updated_at: '2026-05-20T12:00:00.500Z',
    deleted_at: null,
    list_id: null,
  },
  {
    id: '01940000-0000-7000-8000-000000000002',
    user_id: 'local',
    title: 'two',
    created_at: '2026-05-20T12:01:00.000Z',
    completed_at: null,
    updated_at: '2026-05-20T12:01:00.000Z',
    server_updated_at: '2026-05-20T12:01:00.500Z',
    deleted_at: null,
    list_id: null,
  },
];

describe('TaskList (Unit)', () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue({
      error: null,
      loading: false,
      tasks: sampleTasks,
    });
  });

  it('renders each task title', () => {
    render(<TaskList />);

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
  });

  it('renders an empty-state message when there are no tasks', () => {
    mockUseTasks.mockReturnValue({
      error: null,
      loading: false,
      tasks: [],
    });

    render(<TaskList />);

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders a loading state when loading is true', () => {
    mockUseTasks.mockReturnValue({
      error: null,
      loading: true,
      tasks: [],
    });

    render(<TaskList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders an error message when error is set', () => {
    mockUseTasks.mockReturnValue({
      error: 'boom',
      loading: false,
      tasks: [],
    });

    render(<TaskList />);

    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });

  it('renders a loading skeleton with stable-height placeholder rows when loading', () => {
    mockUseTasks.mockReturnValue({
      error: null,
      loading: true,
      tasks: [],
    });

    render(<TaskList />);

    expect(screen.getByRole('status', { name: /loading tasks/i })).toBeInTheDocument();
    const placeholders = screen.getAllByTestId('task-skeleton-row');
    expect(placeholders.length).toBeGreaterThan(0);
    placeholders.forEach((row) => expect(row).toHaveStyle({ height: '2.5rem' }));
  });

  it('renders the empty-state copy when all tasks are tombstoned (none visible)', () => {
    // useTasks() filters tombstoned rows, so an all-tombstoned store surfaces as [].
    mockUseTasks.mockReturnValue({
      error: null,
      loading: false,
      tasks: [],
    });

    render(<TaskList />);

    expect(screen.getByText('No tasks yet. Create your first one.')).toBeInTheDocument();
  });
});
