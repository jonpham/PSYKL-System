import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListsView } from '../ListsView';

const mockUseLists = vi.hoisted(() => vi.fn());
const mockRenameList = vi.hoisted(() => vi.fn());
const mockMoveList = vi.hoisted(() => vi.fn());
const mockCreateList = vi.hoisted(() => vi.fn());

vi.mock('../../../../hooks/useLists', () => ({
  useLists: mockUseLists,
}));

const lists = [
  { id: 'list-1', title: 'Tasks', position: 'a0' },
  { id: 'list-2', title: 'Groceries', position: 'a1' },
  { id: 'list-3', title: 'Reading', position: 'a2' },
];

describe('ListsView (Unit)', () => {
  beforeEach(() => {
    mockRenameList.mockReset().mockResolvedValue(undefined);
    mockMoveList.mockReset().mockResolvedValue(undefined);
    mockCreateList.mockReset().mockResolvedValue(undefined);
    mockUseLists.mockReturnValue({
      createList: mockCreateList,
      lists,
      moveList: mockMoveList,
      renameList: mockRenameList,
    });
  });

  it('renames a list in place', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListsView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Rename Groceries' }));
    await user.clear(screen.getByRole('textbox', { name: 'List name' }));
    await user.type(screen.getByRole('textbox', { name: 'List name' }), 'Shopping{Enter}');

    // Assert
    await waitFor(() => expect(mockRenameList).toHaveBeenCalledWith('list-2', 'Shopping'));
  });

  it('moves a list up between its new neighbours', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListsView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Move Reading up' }));

    // Assert — Reading lands between Tasks and Groceries
    await waitFor(() => expect(mockMoveList).toHaveBeenCalledWith('list-3', lists[0], lists[1]));
  });

  it('moves a list down between its new neighbours', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListsView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Move Tasks down' }));

    // Assert — Tasks lands between Groceries and Reading
    await waitFor(() => expect(mockMoveList).toHaveBeenCalledWith('list-1', lists[1], lists[2]));
  });

  it('does not offer to move the first list up or the last list down', () => {
    // Arrange / Act
    render(<ListsView />);

    // Assert
    expect(screen.getByRole('button', { name: 'Move Tasks up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Reading down' })).toBeDisabled();
  });

  it('adds a list from the inline new-list row', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ListsView />);

    // Act
    await user.click(screen.getByRole('button', { name: 'New List' }));
    await user.type(screen.getByRole('textbox', { name: 'New list name' }), 'Errands{Enter}');

    // Assert
    await waitFor(() => expect(mockCreateList).toHaveBeenCalledWith('Errands'));
  });
});
