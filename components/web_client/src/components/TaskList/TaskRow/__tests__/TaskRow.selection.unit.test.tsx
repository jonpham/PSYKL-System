import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { TaskRow } from '../TaskRow';

vi.mock('../../../../hooks/useTasks', () => ({
  useTasks: () => ({ patchTask: vi.fn() }),
}));

function task(overrides: Partial<Task> = {}): Task {
  return {
    completed_at: null,
    created_at: '2026-05-20T12:00:00.000Z',
    deleted_at: null,
    id: '01940000-0000-7000-8000-000000000001',
    list_id: null,
    server_updated_at: '2026-05-20T12:00:00.500Z',
    title: 'Oat milk',
    updated_at: '2026-05-20T12:00:00.000Z',
    user_id: 'local',
    ...overrides,
  };
}

describe('TaskRow in selection mode (Unit)', () => {
  it('pools the row into the batch from either the circle or the title', async () => {
    // Arrange
    const onToggleSelect = vi.fn();
    render(<TaskRow onToggleSelect={onToggleSelect} selectable task={task()} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Select Oat milk' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Oat milk' }));

    // Assert
    expect(onToggleSelect).toHaveBeenCalledTimes(2);
  });

  it('marks a selected row so the tick means selection, not completion', () => {
    // Arrange / Act
    render(<TaskRow onToggleSelect={() => {}} selectable selected task={task()} />);

    // Assert
    const checkbox = screen.getByRole('checkbox', { name: 'Deselect Oat milk' });
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('listitem')).toHaveAttribute('data-selected', 'true');
  });

  it('offers a reorder handle on open rows only', () => {
    // Arrange / Act
    const { rerender } = render(<TaskRow onReorder={() => {}} selectable task={task()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Reorder Oat milk' })).toBeInTheDocument();

    // Act — a completed row keeps its completion order, so it has no handle
    rerender(<TaskRow onReorder={() => {}} selectable task={task({ completed_at: '2026-05-20T13:00:00.000Z' })} />);

    // Assert
    expect(screen.queryByRole('button', { name: 'Reorder Oat milk' })).not.toBeInTheDocument();
  });

  it('leaves titles editable when selection mode is off', async () => {
    // Arrange
    render(<TaskRow task={task()} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Edit Oat milk' }));

    // Assert
    expect(screen.getByRole('textbox', { name: 'Edit title' })).toBeInTheDocument();
  });
});
