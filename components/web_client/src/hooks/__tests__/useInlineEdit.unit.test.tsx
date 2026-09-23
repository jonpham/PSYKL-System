import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useInlineEdit } from '../useInlineEdit';

function Harness({ onCommit, value }: { onCommit: (next: string) => void; value: string }) {
  const { draft, editing, inputProps, start } = useInlineEdit({ onCommit, value });

  return editing ? (
    <input aria-label="field" {...inputProps} value={draft} />
  ) : (
    <button onClick={start} type="button">
      {value}
    </button>
  );
}

describe('useInlineEdit (Unit)', () => {
  it('commits a changed value on Enter', async () => {
    // Arrange
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} value="Groceries" />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'field' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'field' }), 'Errands{Enter}');

    // Assert
    expect(onCommit).toHaveBeenCalledWith('Errands');
    expect(screen.getByRole('button', { name: 'Groceries' })).toBeInTheDocument();
  });

  it('commits on blur, which is the single commit point', async () => {
    // Arrange
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} value="Groceries" />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'field' }), ' weekly');
    await userEvent.tab();

    // Assert
    expect(onCommit).toHaveBeenCalledWith('Groceries weekly');
  });

  it('discards the draft on Escape', async () => {
    // Arrange
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} value="Groceries" />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'field' }), ' weekly{Escape}');

    // Assert
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits nothing when the value is unchanged or emptied', async () => {
    // Arrange
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} value="Groceries" />);

    // Act — emptied
    await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'field' }));
    await userEvent.tab();

    // Act — unchanged
    await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));
    await userEvent.tab();

    // Assert
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('trims what it commits', async () => {
    // Arrange
    const onCommit = vi.fn();
    render(<Harness onCommit={onCommit} value="Groceries" />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Groceries' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'field' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'field' }), '  Errands  ');
    await userEvent.tab();

    // Assert
    expect(onCommit).toHaveBeenCalledWith('Errands');
  });

  it('follows a value that changed somewhere else', async () => {
    // Arrange
    const { rerender } = render(<Harness onCommit={() => {}} value="Groceries" />);

    // Act
    rerender(<Harness onCommit={() => {}} value="Pantry" />);
    await userEvent.click(screen.getByRole('button', { name: 'Pantry' }));

    // Assert
    expect(screen.getByRole('textbox', { name: 'field' })).toHaveValue('Pantry');
  });
});
