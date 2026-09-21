import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { TaskListView } from '../TaskListView';

const mockUseTasks = vi.hoisted(() => vi.fn());
const mockCreateTask = vi.hoisted(() => vi.fn());
const mockPatchTask = vi.hoisted(() => vi.fn());

vi.mock('../../../../hooks/useTasks', () => ({
  useTasks: mockUseTasks,
}));

vi.mock('../../../../services/task-service-client', () => ({
  taskServiceClient: { listPending: () => Promise.resolve([]) },
}));

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    completed_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    list_id: 'list-1',
    server_updated_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    user_id: 'local',
    ...overrides,
  };
}

describe('TaskListView (Unit)', () => {
  beforeEach(() => {
    mockCreateTask.mockReset().mockResolvedValue(undefined);
    mockPatchTask.mockReset().mockResolvedValue(undefined);
    mockUseTasks.mockReturnValue({
      createTask: mockCreateTask,
      error: null,
      loading: false,
      patchTask: mockPatchTask,
      tasks: [task({ id: 'task-1', title: 'Book dentist' })],
    });
  });

  it('commits a captured task on Return and reopens an empty row', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskListView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'New Reminder' }));
    await user.type(screen.getByRole('textbox', { name: 'New task title' }), 'Renew passport{Enter}');

    // Assert
    await waitFor(() => expect(mockCreateTask).toHaveBeenCalledWith('Renew passport'));
    expect(screen.getByRole('textbox', { name: 'New task title' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'New task title' })).toHaveFocus();
  });

  it('discards an untouched capture row when it loses focus', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskListView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'New Reminder' }));
    await user.tab();

    // Assert
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'New task title' })).not.toBeInTheDocument());
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('keeps a failed capture on screen with the typed title intact', async () => {
    // Arrange
    const user = userEvent.setup();
    mockCreateTask.mockRejectedValue(new Error('offline'));
    render(<TaskListView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'New Reminder' }));
    await user.type(screen.getByRole('textbox', { name: 'New task title' }), 'Renew passport{Enter}');

    // Assert
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be saved/i));
    expect(screen.getByRole('textbox', { name: 'New task title' })).toHaveValue('Renew passport');
  });

  it('sinks a task below the open tasks when its checkbox is checked', async () => {
    // Arrange
    const user = userEvent.setup();
    let tasks = [
      task({ id: 'task-1', title: 'Book dentist', created_at: '2026-01-01T00:00:00.000Z' }),
      task({ id: 'task-2', title: 'Pay invoice', created_at: '2026-01-02T00:00:00.000Z' }),
    ];
    // Stands in for the store notify that re-renders the real hook after a patch.
    mockPatchTask.mockImplementation((id: string, _body: unknown, optimistic: Task) => {
      tasks = tasks.map((entry) => (entry.id === id ? optimistic : entry));
      return Promise.resolve(optimistic);
    });
    mockUseTasks.mockImplementation(() => ({
      createTask: mockCreateTask,
      error: null,
      loading: false,
      patchTask: mockPatchTask,
      tasks,
    }));
    const { rerender } = render(<TaskListView />);
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual(['Book dentist', 'Pay invoice']);

    // Act
    await user.click(screen.getByRole('checkbox', { name: 'Complete Book dentist' }));
    await waitFor(() => expect(mockPatchTask).toHaveBeenCalled());
    rerender(<TaskListView />);

    // Assert
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual(['Pay invoice', 'Book dentist']);
    expect(screen.getByRole('checkbox', { name: 'Reopen Book dentist' })).toHaveAttribute('aria-checked', 'true');
  });

  it('stays quiet about a failed load while local tasks are on screen', () => {
    // Arrange — offline-first: the device's own tasks are the truth, and the
    // header's sync control already carries the unreachable-server signal.
    mockUseTasks.mockReturnValue({
      createTask: mockCreateTask,
      error: 'Failed to load tasks',
      loading: false,
      patchTask: mockPatchTask,
      tasks: [task({ id: 'task-1', title: 'Book dentist' })],
    });

    // Act
    render(<TaskListView />);

    // Assert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Complete Book dentist' })).toBeVisible();
  });

  it('surfaces a failed load when there is nothing on the device to show', () => {
    // Arrange
    mockUseTasks.mockReturnValue({
      createTask: mockCreateTask,
      error: 'Failed to load tasks',
      loading: false,
      patchTask: mockPatchTask,
      tasks: [],
    });

    // Act
    render(<TaskListView />);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load tasks');
  });

  it('shows the Reminders empty state when the list has no tasks', () => {
    // Arrange
    mockUseTasks.mockReturnValue({
      createTask: mockCreateTask,
      error: null,
      loading: false,
      patchTask: mockPatchTask,
      tasks: [],
    });

    // Act
    render(<TaskListView />);

    // Assert
    expect(screen.getByText('No Reminders')).toBeVisible();
    expect(screen.getByRole('button', { name: 'New Reminder' })).toBeVisible();
  });

  it('edits a title in place from a tap on the row', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskListView />);

    // Act
    await user.click(within(screen.getByRole('listitem')).getByRole('button', { name: 'Edit Book dentist' }));
    await user.clear(screen.getByRole('textbox', { name: 'Edit title' }));
    await user.type(screen.getByRole('textbox', { name: 'Edit title' }), 'Book dentist for Tuesday{Enter}');

    // Assert
    await waitFor(() =>
      expect(mockPatchTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: 'Book dentist for Tuesday' }),
        expect.objectContaining({ title: 'Book dentist for Tuesday' }),
      ),
    );
  });
});
