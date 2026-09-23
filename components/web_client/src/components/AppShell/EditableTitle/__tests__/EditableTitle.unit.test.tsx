import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EditableTitle } from '../EditableTitle';

describe('EditableTitle (Unit)', () => {
  it('renames the list on Enter', async () => {
    // Arrange
    const onRename = vi.fn();
    render(<EditableTitle onRename={onRename} title="Groceries" />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Rename Groceries' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'List name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'List name' }), 'Weekly Groceries{Enter}');

    // Assert — the name itself belongs to the caller, so the field closes and
    // the new name arrives on the next render of the prop
    expect(onRename).toHaveBeenCalledWith('Weekly Groceries');
    expect(screen.queryByRole('textbox', { name: 'List name' })).not.toBeInTheDocument();
  });

  it('discards the draft on Escape', async () => {
    // Arrange
    const onRename = vi.fn();
    render(<EditableTitle onRename={onRename} title="Groceries" />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Rename Groceries' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'List name' }), ' and more{Escape}');

    // Assert
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rename Groceries' })).toBeInTheDocument();
  });

  it('keeps the current name when the field is left empty or unchanged', async () => {
    // Arrange
    const onRename = vi.fn();
    render(<EditableTitle onRename={onRename} title="Groceries" />);

    // Act — blur is the commit point, so an emptied field commits nothing
    await userEvent.click(screen.getByRole('button', { name: 'Rename Groceries' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'List name' }));
    await userEvent.tab();

    // Assert
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rename Groceries' })).toBeInTheDocument();
  });

  it('follows a rename that happened somewhere else', () => {
    // Arrange
    const { rerender } = render(<EditableTitle onRename={() => {}} title="Groceries" />);

    // Act
    rerender(<EditableTitle onRename={() => {}} title="Pantry" />);

    // Assert
    expect(screen.getByRole('button', { name: 'Rename Pantry' })).toBeInTheDocument();
  });
});
