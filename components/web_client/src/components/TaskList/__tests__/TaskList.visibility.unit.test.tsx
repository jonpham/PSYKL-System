import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());
const mockUseCompletedVisibility = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({ useTasks: mockUseTasks }));
vi.mock('../../../hooks/useSyncDiscrepancy', () => ({
  useSyncDiscrepancy: () => ({ count: 0, level: 'ok' }),
}));
vi.mock('../../../hooks/useCompletedVisibility', () => ({
  useCompletedVisibility: mockUseCompletedVisibility,
}));

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    user_id: 'local',
    title: id,
    created_at: '2026-05-20T12:00:00.000Z',
    completed_at: null,
    updated_at: '2026-05-20T12:00:00.000Z',
    server_updated_at: '2026-05-20T12:00:00.500Z',
    deleted_at: null,
    list_id: null,
    ...overrides,
  };
}

describe('TaskList completed visibility (Unit)', () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue({
      createTask: vi.fn(),
      error: null,
      loading: false,
      tasks: [task('open'), task('done', { completed_at: '2026-05-20T13:00:00.000Z' })],
    });
  });

  it('shows completed tasks while the list is set to show them', () => {
    // Arrange
    mockUseCompletedVisibility.mockReturnValue({ setShowCompleted: vi.fn(), showCompleted: true });

    // Act
    render(<TaskList />);

    // Assert
    expect(screen.getAllByRole('listitem').map((row) => row.getAttribute('aria-label'))).toEqual(['open', 'done']);
  });

  it('leaves the completed tasks out while the list hides them', () => {
    // Arrange
    mockUseCompletedVisibility.mockReturnValue({ setShowCompleted: vi.fn(), showCompleted: false });

    // Act
    render(<TaskList />);

    // Assert — hidden, not deleted: the open task is untouched
    expect(screen.getAllByRole('listitem').map((row) => row.getAttribute('aria-label'))).toEqual(['open']);
  });
});
