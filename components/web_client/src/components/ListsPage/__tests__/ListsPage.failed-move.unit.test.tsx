import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ListsPage } from '../ListsPage';

const createList = vi.fn();
const moveList = vi.fn();
const lists = [
  { id: 'list-1', position: 'a0', title: 'Tasks' },
  { id: 'list-2', position: 'a1', title: 'Groceries' },
];

vi.mock('../../../hooks/useLists', () => ({
  useLists: () => ({ createList, lists, moveList }),
}));

afterEach(() => {
  moveList.mockReset();
  vi.restoreAllMocks();
});

describe('a re-order the app cannot carry out', () => {
  /**
   * The call site discarded the promise with `void`, so a rejected re-order
   * reached nothing but an unhandled rejection in the console: the arrow simply
   * did nothing, however many times it was tapped, and the user was given no
   * reason and no way to recover.
   */
  it('is reported rather than discarded', async () => {
    // Arrange
    const user = userEvent.setup();
    const reported = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    moveList.mockRejectedValue(new Error('>= '));
    render(<ListsPage />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Move Groceries up' }));

    // Assert
    expect(reported).toHaveBeenCalled();
  });
});
