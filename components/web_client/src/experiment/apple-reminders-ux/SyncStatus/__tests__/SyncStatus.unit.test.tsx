import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SyncStatus } from '../SyncStatus';

describe('SyncStatus', () => {
  it('opens clear sync details from a green status control', async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SyncStatus active={false} failedCount={0} onOpen={onOpen} queuedCount={0} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Sync clear' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Sync clear' })).toHaveAttribute('data-status', 'clear');
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('shows separate queued and failed counts in the attention detail view', () => {
    // Arrange / Act
    render(<SyncStatus active failedCount={1} onOpen={() => undefined} queuedCount={2} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Sync needs attention: 3 changes' })).toHaveAttribute(
      'data-status',
      'attention',
    );
    expect(screen.getByRole('button', { name: 'Sync needs attention: 3 changes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument();
    expect(screen.getByText(/Waiting to sync/)).toHaveTextContent('2');
    expect(screen.getByText(/Permanently failed/)).toHaveTextContent('1');
  });
});
