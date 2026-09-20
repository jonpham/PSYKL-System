import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Settings } from '../Settings';

describe('Settings', () => {
  it('stays closed until it is opened', () => {
    // Arrange / Act
    render(<Settings open={false} />);

    // Assert
    expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
  });

  it('exposes Experiments as the way into the experimental surfaces', () => {
    // Arrange / Act
    render(<Settings open />);

    // Assert
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Experiments' })).toBeVisible();
    expect(screen.getByText(/no experiments are registered/i)).toBeVisible();
  });

  it('closes when dismissed', async () => {
    // Arrange
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Settings onClose={onClose} open />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Close' }));

    // Assert
    expect(onClose).toHaveBeenCalledOnce();
  });
});
