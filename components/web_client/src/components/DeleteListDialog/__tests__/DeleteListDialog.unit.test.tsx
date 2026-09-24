import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeleteListDialog } from '../DeleteListDialog';

function renderDialog(overrides: Partial<Parameters<typeof DeleteListDialog>[0]> = {}) {
  const props = {
    itemCount: 4,
    listTitle: 'Groceries',
    onCancel: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<DeleteListDialog {...props} />);
  return props;
}

describe('DeleteListDialog (Unit)', () => {
  it('names the list and says how many items are at stake', () => {
    // Arrange / Act
    renderDialog();

    // Assert
    expect(screen.getByRole('dialog', { name: 'Delete "Groceries"?' })).toBeInTheDocument();
    expect(screen.getByText('It still holds 4 items.')).toBeInTheDocument();
  });

  it('counts a single item without the plural', () => {
    // Arrange / Act
    renderDialog({ itemCount: 1 });

    // Assert
    expect(screen.getByText('It still holds 1 item.')).toBeInTheDocument();
  });

  it('offers both outcomes for a list that still holds items', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderDialog();

    // Act
    await user.click(screen.getByRole('button', { name: 'Delete With Items' }));

    // Assert
    expect(props.onDelete).toHaveBeenCalledWith('with-items');

    // Act
    await user.click(screen.getByRole('button', { name: 'Delete Just the List' }));

    // Assert
    expect(props.onDelete).toHaveBeenCalledWith('just-list');
  });

  it('offers one deletion for an empty list, because both outcomes are the same', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderDialog({ itemCount: 0 });

    // Assert — no item language, and no choice to make
    expect(screen.queryByText(/still holds/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete With Items' })).not.toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Delete List' }));

    // Assert — an empty list has nothing to keep, so it deletes as itself
    expect(props.onDelete).toHaveBeenCalledWith('just-list');
  });

  it('opens with focus on Cancel, so no destructive option is one keypress away', () => {
    // Arrange / Act
    renderDialog();

    // Assert
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('cancels on Escape as well as on Cancel', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderDialog();

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onDelete).not.toHaveBeenCalled();

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });
});
