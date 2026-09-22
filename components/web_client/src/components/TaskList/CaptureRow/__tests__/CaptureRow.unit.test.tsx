import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CaptureRow } from '../CaptureRow';

describe('CaptureRow (Unit)', () => {
  it('holds focus the moment it mounts, before anything can be typed at the button', () => {
    // Arrange — `autoFocus` focuses after paint, and keystrokes typed in that
    // window land on the add button: "Book dentist" arrived as "k dentist".
    render(<CaptureRow onCancel={vi.fn()} onCreate={vi.fn()} />);

    // Assert — synchronously, with no await between render and the check
    expect(screen.getByRole('textbox', { name: 'New task title' })).toHaveFocus();
  });

  it('saves on Return and offers the next row without being reopened', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CaptureRow onCancel={vi.fn()} onCreate={onCreate} />);

    // Act
    await user.keyboard('buy milk{Enter}');

    // Assert
    expect(onCreate).toHaveBeenCalledWith('buy milk');
    const input = screen.getByRole('textbox', { name: 'New task title' });
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('leaves capture on Escape without saving', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onCreate = vi.fn();
    render(<CaptureRow onCancel={onCancel} onCreate={onCreate} />);

    // Act
    await user.keyboard('half a thought{Escape}');

    // Assert
    expect(onCreate).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('throws an empty row away when it loses focus', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onCreate = vi.fn();
    render(
      <>
        <CaptureRow onCancel={onCancel} onCreate={onCreate} />
        <button type="button">elsewhere</button>
      </>,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    // Assert
    expect(onCreate).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('saves a typed title when the row loses focus', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <>
        <CaptureRow onCancel={onCancel} onCreate={onCreate} />
        <button type="button">elsewhere</button>
      </>,
    );

    // Act
    await user.keyboard('call the vet');
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    // Assert
    expect(onCreate).toHaveBeenCalledWith('call the vet');
  });

  it('keeps the typed title on screen when the save fails', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error('offline'));
    render(<CaptureRow onCancel={vi.fn()} onCreate={onCreate} />);

    // Act
    await user.keyboard('pay rent{Enter}');

    // Assert — the words the user typed are not thrown away on their behalf
    expect(screen.getByRole('textbox', { name: 'New task title' })).toHaveValue('pay rent');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
