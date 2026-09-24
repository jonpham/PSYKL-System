import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());
const mockDiscrepancy = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({
  useTasks: mockUseTasks,
}));
vi.mock('../../../hooks/useCompletedVisibility', () => ({
  useCompletedVisibility: () => ({ setShowCompleted: () => {}, showCompleted: true }),
}));
vi.mock('../../../hooks/useSyncDiscrepancy', () => ({
  useSyncDiscrepancy: mockDiscrepancy,
}));

const oneTask: Task = {
  completed_at: null,
  created_at: '2026-06-01T09:00:00.000Z',
  deleted_at: null,
  id: '01940000-0000-7000-8000-0000000000f1',
  list_id: null,
  server_updated_at: '2026-06-01T09:00:00.500Z',
  title: 'walk the dog',
  updated_at: '2026-06-01T09:00:00.000Z',
  user_id: 'local',
};

function withTasks(tasks: Task[]): void {
  mockUseTasks.mockReturnValue({ createTask: vi.fn(), error: null, loading: false, tasks });
}

/** The empty stretch of page between the last row and the new-task button.
 * It is deliberately not a control of its own — the (+) is the accessible
 * route — so it is found by class rather than by role. */
function emptySpace(): Element {
  const found = document.querySelector('.psykl-task-list__empty-space');
  if (!found) throw new Error('the list has no empty space to tap');
  return found;
}

function captureField(): HTMLElement | null {
  return screen.queryByRole('textbox', { name: /new task/i });
}

describe('TaskList empty-space capture (Unit)', () => {
  beforeEach(() => {
    mockUseTasks.mockReset();
    mockDiscrepancy.mockReturnValue({ count: 0, level: 'ok' });
  });

  it('starts a new task when the space below the rows is tapped', async () => {
    // Arrange
    withTasks([oneTask]);
    render(<TaskList />);

    // Act
    await userEvent.click(emptySpace());

    // Assert — exactly what the (+) button does
    expect(captureField()).toBeInTheDocument();
  });

  it('starts a new task from an empty list, below its copy', async () => {
    // Arrange
    withTasks([]);
    render(<TaskList />);

    // Act
    await userEvent.click(emptySpace());

    // Assert
    expect(captureField()).toBeInTheDocument();
  });

  it('does nothing in selection mode, where a tap means choosing rows', async () => {
    // Arrange
    withTasks([oneTask]);
    render(<TaskList selecting />);

    // Act
    await userEvent.click(emptySpace());

    // Assert
    expect(captureField()).not.toBeInTheDocument();
  });

  it('does nothing past the offline write ceiling, where the (+) is disabled too', async () => {
    // Arrange
    mockDiscrepancy.mockReturnValue({ count: 999, level: 'ceiling' });
    withTasks([oneTask]);
    render(<TaskList />);

    // Act
    await userEvent.click(emptySpace());

    // Assert
    expect(captureField()).not.toBeInTheDocument();
  });

  it('is not a second control for assistive tech to trip over', () => {
    // Arrange / Act
    withTasks([oneTask]);
    render(<TaskList />);

    // Assert
    expect(emptySpace()).toHaveAttribute('aria-hidden', 'true');
  });
});
