import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FailedOpEntry, SyncQueueEntry } from '../../../db/idb.types';
import { SyncView } from '../SyncView';

function queued(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    id: 'queue-1',
    entity_type: 'task',
    entity_id: 'task-1',
    op: 'patch',
    body: { title: 'buy milk' },
    idempotency_key: 'key-1',
    attempts: 0,
    next_attempt_at: '2026-06-01T09:00:00.000Z',
    created_at: '2026-06-01T09:00:00.000Z',
    ...overrides,
  };
}

function failed(overrides: Partial<FailedOpEntry> = {}): FailedOpEntry {
  return {
    ...queued({ id: 'failed-1' }),
    failed_at: '2026-06-01T10:00:00.000Z',
    error: 'Task not found',
    ...overrides,
  };
}

describe('SyncView (Unit)', () => {
  it('says plainly when everything has reached the server', () => {
    // Arrange
    render(<SyncView failed={[]} queued={[]} />);

    // Assert
    expect(screen.getByText('Everything is synced.')).toBeInTheDocument();
  });

  it('lists what is still waiting to be sent', () => {
    // Arrange
    render(<SyncView failed={[]} queued={[queued(), queued({ id: 'queue-2', op: 'create' })]} />);

    // Assert
    const waiting = screen.getByRole('region', { name: 'Waiting to sync' });
    expect(waiting).toHaveTextContent('2');
    expect(screen.queryByText('Everything is synced.')).not.toBeInTheDocument();
  });

  it('lists a failure with the reason it was given', () => {
    // Arrange
    render(<SyncView failed={[failed()]} queued={[]} />);

    // Assert
    const failures = screen.getByRole('region', { name: 'Could not be sent' });
    expect(failures).toHaveTextContent('Task not found');
  });

  it('keeps the two sections independent', () => {
    // Arrange — a device can have both at once, and neither implies the other
    render(<SyncView failed={[failed()]} queued={[queued()]} />);

    // Assert
    expect(screen.getByRole('region', { name: 'Waiting to sync' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Could not be sent' })).toBeInTheDocument();
  });
});
