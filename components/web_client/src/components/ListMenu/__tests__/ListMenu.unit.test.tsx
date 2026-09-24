import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ListMenu } from '../ListMenu';

function renderMenu(overrides: Partial<Parameters<typeof ListMenu>[0]> = {}) {
  const props = {
    canDelete: true,
    completedCount: 3,
    onRequestDeleteList: vi.fn(),
    onToggleCompleted: vi.fn(),
    showCompleted: true,
    ...overrides,
  };
  render(<ListMenu {...props} />);
  return props;
}

describe('ListMenu (Unit)', () => {
  it('offers to hide completed tasks while they are shown', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderMenu();

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Hide Completed' }));

    // Assert
    expect(props.onToggleCompleted).toHaveBeenCalledWith(false);
  });

  it('says how many are waiting while completed tasks are hidden', async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu({ showCompleted: false });

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));

    // Assert
    expect(screen.getByRole('menuitem', { name: 'Show Completed (3)' })).toBeInTheDocument();
  });

  it('hands a delete request to the dialog rather than deleting from the menu', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderMenu();

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete List' }));

    // Assert — one press: the sheet closes and the question is asked elsewhere,
    // because a menu item cannot express "and the items too"
    expect(props.onRequestDeleteList).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not offer to delete the only list a user has', async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu({ canDelete: false });

    // Act
    await user.click(screen.getByRole('button', { name: 'List options' }));

    // Assert
    expect(screen.queryByRole('menuitem', { name: /delete list/i })).not.toBeInTheDocument();
  });

  it('dismisses on Escape and hands focus back to the trigger', async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'List options' });
    await user.click(trigger);

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('dismisses when the user clicks away from it', async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'List options' }));

    // Act
    await user.click(document.body);

    // Assert
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
