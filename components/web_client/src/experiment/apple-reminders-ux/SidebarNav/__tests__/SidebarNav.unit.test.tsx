import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SidebarNav } from '../SidebarNav';

const lists = [
  { id: 'list-1', title: 'Tasks' },
  { id: 'list-2', title: 'Groceries' },
];

describe('SidebarNav', () => {
  it('marks the active destination and selects a list', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectList = vi.fn();
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={() => undefined}
        onSelectList={onSelectList}
      />,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'Groceries' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Tasks' })).toHaveAttribute('aria-current', 'page');
    expect(onSelectList).toHaveBeenCalledWith('list-2');
  });

  it('selects Settings from the utility destinations', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectDestination = vi.fn();
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={onSelectDestination}
        onSelectList={() => undefined}
      />,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    // Assert
    expect(onSelectDestination).toHaveBeenCalledWith('settings');
  });

  it('opens Sync from an attention-colored utility row', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectDestination = vi.fn();
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={onSelectDestination}
        onSelectList={() => undefined}
        syncNeedsAttention
      />,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'Sync needs attention' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Sync needs attention' })).toHaveAttribute('data-status', 'attention');
    expect(onSelectDestination).toHaveBeenCalledWith('sync');
  });
});

describe('SidebarNav lists section', () => {
  it('collapses and expands the lists from the section heading', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={() => undefined}
        onSelectList={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeVisible();

    // Act
    await user.click(screen.getByRole('button', { name: 'Collapse Lists' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Groceries' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand Lists' }));
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeVisible();
  });

  it('keeps Recently Deleted with the lists rather than the utilities', () => {
    // Arrange / Act
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={() => undefined}
        onSelectList={() => undefined}
      />,
    );

    // Assert
    const group = screen.getByRole('list', { name: 'Lists' });
    expect(within(group).getByRole('button', { name: 'Recently Deleted' })).toBeVisible();
  });

  it('opens the list-management page from the section heading', async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelectDestination = vi.fn();
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={onSelectDestination}
        onSelectList={() => undefined}
      />,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'Edit Lists' }));

    // Assert
    expect(onSelectDestination).toHaveBeenCalledWith('lists');
  });

  it('renders every list without a bullet glyph', () => {
    // Arrange / Act
    render(
      <SidebarNav
        activeListId="list-1"
        destination="list"
        lists={lists}
        onClose={() => undefined}
        onSelectDestination={() => undefined}
        onSelectList={() => undefined}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Tasks' }).textContent).toBe('Tasks');
  });
});
