import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { FailedOpEntry, SyncQueueEntry } from '../../../db/idb.types';
import type { StaleWriteRecord } from '../../../preferences/staleWrites';
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

function replaced(overrides: Partial<StaleWriteRecord> = {}): StaleWriteRecord {
  return {
    id: 'stale-1',
    entityId: 'task-1',
    recordedAt: '2026-06-01T10:00:00.000Z',
    won: { title: 'Call the dentist back' },
    wrote: { title: 'Dentist: reschedule' },
    ...overrides,
  };
}

describe('SyncView (Unit)', () => {
  it('says plainly when everything has reached the server', () => {
    // Arrange
    render(<SyncView failed={[]} queued={[]} replacedEdits={[]} />);

    // Assert
    expect(screen.getByText('Everything is synced.')).toBeInTheDocument();
  });

  it('lists what is still waiting to be sent', () => {
    // Arrange
    render(<SyncView failed={[]} queued={[queued(), queued({ id: 'queue-2', op: 'create' })]} replacedEdits={[]} />);

    // Assert
    const waiting = screen.getByRole('region', { name: 'Waiting to sync' });
    expect(waiting).toHaveTextContent('2');
    expect(screen.queryByText('Everything is synced.')).not.toBeInTheDocument();
  });

  it('lists a failure with the reason it was given', () => {
    // Arrange
    render(<SyncView failed={[failed()]} queued={[]} replacedEdits={[]} />);

    // Assert
    const failures = screen.getByRole('region', { name: 'Could not be sent' });
    expect(failures).toHaveTextContent('Task not found');
  });

  it('keeps the two sections independent', () => {
    // Arrange — a device can have both at once, and neither implies the other
    render(<SyncView failed={[failed()]} queued={[queued()]} replacedEdits={[]} />);

    // Assert
    expect(screen.getByRole('region', { name: 'Waiting to sync' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Could not be sent' })).toBeInTheDocument();
  });

  it('tells a user another device replaced their edit', () => {
    // Arrange
    render(<SyncView failed={[]} onDismissReplacedEdit={vi.fn()} queued={[]} replacedEdits={[replaced()]} />);

    // Assert
    expect(screen.getByRole('region', { name: 'Replaced by another device' })).toBeInTheDocument();
    expect(screen.queryByText('Everything is synced.')).not.toBeInTheDocument();
  });

  it('shows both versions once the user opens the record', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SyncView failed={[]} onDismissReplacedEdit={vi.fn()} queued={[]} replacedEdits={[replaced()]} />);

    // Act
    await user.click(screen.getByRole('button', { name: /what happened/i }));

    // Assert — the user can read their own words back, not just be told they lost
    expect(screen.getByText('Dentist: reschedule')).toBeInTheDocument();
    expect(screen.getByText('Call the dentist back')).toBeInTheDocument();
  });

  it('lets a user dismiss a record they have read', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismissReplacedEdit = vi.fn();
    render(
      <SyncView failed={[]} onDismissReplacedEdit={onDismissReplacedEdit} queued={[]} replacedEdits={[replaced()]} />,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    // Assert
    expect(onDismissReplacedEdit).toHaveBeenCalledWith('stale-1');
  });
});
