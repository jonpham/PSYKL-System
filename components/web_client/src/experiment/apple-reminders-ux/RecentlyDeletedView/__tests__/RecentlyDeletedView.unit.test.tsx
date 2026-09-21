import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecentlyDeletedView } from '../RecentlyDeletedView';

const mockUseRecentlyDeleted = vi.hoisted(() => vi.fn());

vi.mock('../../../../hooks/useRecentlyDeleted', () => ({
  useRecentlyDeleted: mockUseRecentlyDeleted,
}));

describe('RecentlyDeletedView (Unit)', () => {
  beforeEach(() => {
    mockUseRecentlyDeleted.mockReturnValue({
      items: [
        { daysRemaining: 28, deletedAt: '2026-09-01T00:00:00.000Z', id: 'a', title: 'Older task', type: 'task' },
        { daysRemaining: 30, deletedAt: '2026-09-19T00:00:00.000Z', id: 'b', title: 'Newer list', type: 'list' },
      ],
      restore: vi.fn(),
    });
  });

  it('puts the most recently deleted item at the top', () => {
    // Arrange / Act
    render(<RecentlyDeletedView />);

    // Assert
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Newer list');
    expect(rows[1]).toHaveTextContent('Older task');
  });

  it('marks each row with the kind of thing that was deleted', () => {
    // Arrange / Act
    render(<RecentlyDeletedView />);

    // Assert
    const listRow = screen.getByRole('listitem', { name: 'Newer list' });
    const taskRow = screen.getByRole('listitem', { name: 'Older task' });
    expect(within(listRow).getByLabelText('List')).toBeInTheDocument();
    expect(within(taskRow).getByLabelText('Task')).toBeInTheDocument();
  });
});
