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

  it('keeps status details out of the icon-only attention control', () => {
    // Arrange / Act
    render(<SyncStatus active failedCount={1} onOpen={() => undefined} queuedCount={2} />);

    // Assert
    const control = screen.getByRole('button', { name: 'Sync needs attention' });
    expect(control).toHaveAttribute('data-status', 'attention');
    expect(control).toHaveAttribute('aria-current', 'page');
    expect(control).toHaveTextContent('↻');
    expect(control).not.toHaveTextContent('Sync');
    expect(control).not.toHaveTextContent('3');
    expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument();
    expect(screen.getByText(/Waiting to sync/)).toHaveTextContent('2');
    expect(screen.getByText(/Permanently failed/)).toHaveTextContent('1');
  });
});
