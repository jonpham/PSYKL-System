import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ListMenu } from '../ListMenu';

describe('ListMenu (Unit)', () => {
  it('offers to hide completed tasks while they are shown', async () => {
    // Arrange
    const user = userEvent.setup();
    const onToggleCompleted = vi.fn();
    render(<ListMenu completedCount={2} onToggleCompleted={onToggleCompleted} showCompleted />);

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Hide Completed' }));

    // Assert
    expect(onToggleCompleted).toHaveBeenCalledWith(false);
  });

  it('offers to show completed tasks while they are hidden, with their count', async () => {
    // Arrange
    const user = userEvent.setup();
    const onToggleCompleted = vi.fn();
    render(<ListMenu completedCount={3} onToggleCompleted={onToggleCompleted} showCompleted={false} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));

    // Assert
    expect(screen.getByRole('menuitem', { name: 'Show Completed (3)' })).toBeVisible();
  });

  it('closes on Escape and returns focus to its trigger', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListMenu completedCount={0} onToggleCompleted={() => undefined} showCompleted />);

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));
    await user.keyboard('{Escape}');

    // Assert
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List options' })).toHaveFocus();
  });
});
