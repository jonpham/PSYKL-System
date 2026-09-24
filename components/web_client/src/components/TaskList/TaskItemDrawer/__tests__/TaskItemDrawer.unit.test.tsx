import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { TaskItemDrawer } from '../TaskItemDrawer';

const openTask: Task = {
  id: '01940000-0000-7000-8000-0000000000d1',
  user_id: 'local',
  title: 'walk the dog',
  created_at: '2026-06-01T09:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-02T11:30:00.000Z',
  server_updated_at: '2026-06-02T11:30:00.500Z',
  deleted_at: null,
  list_id: null,
};

const completedTask: Task = { ...openTask, completed_at: '2026-06-03T08:15:00.000Z' };

function renderDrawer(task: Task = openTask) {
  const onClose = vi.fn();
  const onDelete = vi.fn();
  const onRename = vi.fn();
  render(<TaskItemDrawer onClose={onClose} onDelete={onDelete} onRename={onRename} task={task} />);
  return { onClose, onDelete, onRename };
}

describe('TaskItemDrawer (Unit)', () => {
  it('shows an em dash for a task that was never completed', () => {
    // Arrange
    renderDrawer();

    // Assert
    expect(screen.getByRole('group', { name: /completed/i })).toHaveTextContent('—');
  });

  it('shows when a completed task was completed', () => {
    // Arrange
    renderDrawer(completedTask);

    // Assert
    expect(screen.getByRole('group', { name: /completed/i })).not.toHaveTextContent('—');
  });

  it('leaves the confirm control inert until the title actually changes', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onRename } = renderDrawer();

    // Assert — nothing to save yet
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();

    // Act
    await user.type(screen.getByRole('textbox', { name: /title/i }), '!');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Assert
    expect(onRename).toHaveBeenCalledWith('walk the dog!');
  });

  it('takes two presses to delete, and deletes nothing on the first', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onDelete } = renderDrawer();

    // Act — first press arms
    await user.click(screen.getByRole('button', { name: /^delete task$/i }));

    // Assert
    expect(onDelete).not.toHaveBeenCalled();
    const armed = screen.getByRole('button', { name: /confirm deleting/i });

    // Act — second press performs
    await user.click(armed);

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('retires the arming when the title is edited', async () => {
    // Arrange
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByRole('button', { name: /^delete task$/i }));

    // Act
    await user.type(screen.getByRole('textbox', { name: /title/i }), '!');

    // Assert — back to resting, so the next press cannot destroy anything
    expect(screen.getByRole('button', { name: /^delete task$/i })).toBeInTheDocument();
  });

  it('closes on Escape and on the close control', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);

    // Act
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
