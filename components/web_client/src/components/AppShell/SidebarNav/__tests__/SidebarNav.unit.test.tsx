import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SidebarNav } from '../SidebarNav';

const lists = [
  { id: 'list-1', title: 'Tasks' },
  { id: 'list-2', title: 'Groceries' },
];

const props = {
  activeListId: 'list-1',
  destination: 'list' as const,
  lists,
  onClose: vi.fn(),
  onSelectDestination: vi.fn(),
  onSelectList: vi.fn(),
};

describe('SidebarNav', () => {
  it('offers every destination', () => {
    // Arrange
    render(<SidebarNav {...props} />);

    // Assert
    for (const name of ['Lists', 'Sync', 'Recently Deleted', 'Settings']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('marks the open list as the current page', () => {
    // Arrange
    render(<SidebarNav {...props} activeListId="list-2" />);

    // Assert
    expect(screen.getByRole('button', { name: 'Groceries' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Tasks' })).not.toHaveAttribute('aria-current');
  });

  it('collapses and expands the Lists section', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SidebarNav {...props} />);
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Collapse Lists' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Groceries' })).not.toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Expand Lists' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();
  });
});

describe('SidebarNav brand header', () => {
  it('leads the close control with the PSYKL mark instead of a dismiss glyph', () => {
    // Arrange
    render(<SidebarNav {...props} />);

    // Assert
    const close = screen.getByRole('button', { name: 'Close PSYKL navigation' });
    expect(close.querySelector('.psykl-brand-mark')).toBeInTheDocument();
    expect(close.querySelector('.psykl-header-glyph')).not.toBeInTheDocument();
  });

  it('also renders a static brand heading, which the wide layout shows in place of the close control', () => {
    // Arrange
    render(<SidebarNav {...props} />);

    // Assert
    const heading = screen.getByRole('heading', { name: 'PSYKL' });
    expect(heading).toHaveClass('psykl-sidebar-nav__brand-heading');
    expect(heading.querySelector('.psykl-brand-mark')).toBeInTheDocument();
    expect(heading.closest('button')).toBeNull();
  });
});
