import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListsPage } from '../ListsPage';

const createList = vi.fn();
const moveList = vi.fn();
const lists = [
  { id: 'list-1', position: 'a0', title: 'Tasks' },
  { id: 'list-2', position: 'a1', title: 'Groceries' },
  { id: 'list-3', position: 'a2', title: 'Reading' },
];

vi.mock('../../../hooks/useLists', () => ({
  useLists: () => ({ createList, lists, moveList }),
}));

describe('ListsPage', () => {
  beforeEach(() => {
    createList.mockClear();
    moveList.mockClear();
  });

  it('creates a list when the name is committed with Return', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<ListsPage creating onCreated={onCreated} />);

    // Act
    await user.type(screen.getByLabelText('New list name'), 'Errands{Enter}');

    // Assert
    expect(createList).toHaveBeenCalledWith('Errands');
  });

  it('abandons the new list when the name is cancelled with Escape', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListsPage creating onCreated={vi.fn()} />);

    // Act
    await user.type(screen.getByLabelText('New list name'), 'Errands{Escape}');

    // Assert
    expect(createList).not.toHaveBeenCalled();
  });

  it('moves a list between the two neighbours it lands among', async () => {
    // Arrange — 'Reading' is last; moving it up puts it between 'Tasks' and 'Groceries'
    const user = userEvent.setup();
    render(<ListsPage />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Move Reading up' }));

    // Assert
    expect(moveList).toHaveBeenCalledWith('list-3', lists[0], lists[1]);
  });

  it('cannot move the first list up or the last list down', () => {
    // Arrange
    render(<ListsPage />);

    // Assert
    expect(screen.getByRole('button', { name: 'Move Tasks up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Reading down' })).toBeDisabled();
  });

  it('opens the list a user picks', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectList = vi.fn();
    render(<ListsPage onSelectList={onSelectList} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Groceries' }));

    // Assert
    expect(onSelectList).toHaveBeenCalledWith('list-2');
  });
});
