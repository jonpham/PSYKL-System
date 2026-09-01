import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ListRecord } from '../../../../db/idb.types';
import { ListRow } from '../ListRow';

const list: ListRecord = {
  id: 'list-1',
  user_id: 'local',
  title: 'Groceries',
  position: 'a0',
  created_at: '2026-08-18T00:00:00.000Z',
  updated_at: '2026-08-18T00:00:00.000Z',
  server_updated_at: '2026-08-18T00:00:00.000Z',
  deleted_at: null,
};

describe('ListRow', () => {
  it('calls onSelect with the list id when its title is clicked', async () => {
    // Arrange
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ListRow canDelete list={list} onDelete={vi.fn()} onRename={vi.fn()} onSelect={onSelect} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Groceries' }));

    // Assert
    expect(onSelect).toHaveBeenCalledWith('list-1');
  });

  it('hides the delete affordance when canDelete is false', () => {
    // Arrange / Act
    render(<ListRow canDelete={false} list={list} onDelete={vi.fn()} onRename={vi.fn()} onSelect={vi.fn()} />);

    // Assert
    expect(screen.queryByRole('button', { name: 'Delete Groceries' })).toBeNull();
  });

  it('calls onDelete with the list id when Delete is clicked and canDelete is true', async () => {
    // Arrange
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ListRow canDelete list={list} onDelete={onDelete} onRename={vi.fn()} onSelect={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Delete Groceries' }));

    // Assert
    expect(onDelete).toHaveBeenCalledWith('list-1');
  });

  it('renames the list through the inline edit form', async () => {
    // Arrange
    const onRename = vi.fn();
    const user = userEvent.setup();
    render(<ListRow canDelete list={list} onDelete={vi.fn()} onRename={onRename} onSelect={vi.fn()} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Rename Groceries' }));
    const input = screen.getByLabelText('Rename Groceries');
    await user.clear(input);
    await user.type(input, 'Weekly Groceries{Enter}');

    // Assert
    expect(onRename).toHaveBeenCalledWith('list-1', 'Weekly Groceries');
  });
});
