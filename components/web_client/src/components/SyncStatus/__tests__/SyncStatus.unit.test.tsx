import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SyncStatus } from '../SyncStatus';

describe('SyncStatus', () => {
  it('reads as clear when nothing is queued or failed', () => {
    // Arrange
    render(<SyncStatus active={false} failedCount={0} onOpen={vi.fn()} queuedCount={0} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync clear' })).toHaveAttribute('data-status', 'clear');
  });

  it('asks for attention when a change is queued', () => {
    // Arrange
    render(<SyncStatus active={false} failedCount={0} onOpen={vi.fn()} queuedCount={1} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync needs attention' })).toHaveAttribute('data-status', 'attention');
  });

  it('asks for attention when a change failed permanently', () => {
    // Arrange
    render(<SyncStatus active={false} failedCount={2} onOpen={vi.fn()} queuedCount={0} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync needs attention' })).toBeInTheDocument();
  });

  it('marks itself as the current destination while Sync is open', () => {
    // Arrange
    render(<SyncStatus active failedCount={0} onOpen={vi.fn()} queuedCount={0} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync clear' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the Sync destination when pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SyncStatus active={false} failedCount={0} onOpen={onOpen} queuedCount={0} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Sync clear' }));

    // Assert
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
