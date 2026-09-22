import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import type { FailedOpEntry, SyncQueueEntry } from '../../../db/idb.types';
import type { StaleWriteRecord } from '../../../preferences/staleWrites';
import { SyncView } from '../SyncView';

const meta: Meta<typeof SyncView> = {
  title: 'PSYKL/SyncView',
  component: SyncView,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof SyncView>;

const queuedEntry: SyncQueueEntry = {
  id: 'queue-1',
  entity_type: 'task',
  entity_id: 'task-1',
  op: 'patch',
  body: { title: 'buy milk' },
  idempotency_key: 'key-1',
  attempts: 1,
  next_attempt_at: '2026-06-01T09:00:00.000Z',
  created_at: '2026-06-01T09:00:00.000Z',
};

const failedEntry: FailedOpEntry = {
  ...queuedEntry,
  id: 'failed-1',
  failed_at: '2026-06-01T10:00:00.000Z',
  error: 'Task not found',
};

export const Clear: Story = {
  args: { failed: [], queued: [], replacedEdits: [] },
  play: async ({ canvasElement }) => {
    // Assert
    await expect(within(canvasElement).getByText('Everything is synced.')).toBeInTheDocument();
  },
};

export const QueuedAndFailed: Story = {
  args: { failed: [failedEntry], queued: [queuedEntry], replacedEdits: [] },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);

    // Assert — a failure carries the reason the server gave, not just a count
    await expect(canvas.getByRole('region', { name: 'Waiting to sync' })).toHaveTextContent('Edited a task');
    await expect(canvas.getByRole('region', { name: 'Could not be sent' })).toHaveTextContent('Task not found');
  },
};

const replacedEdit: StaleWriteRecord = {
  id: 'stale-1',
  entityId: 'task-1',
  recordedAt: '2026-06-01T11:00:00.000Z',
  won: { title: 'Call the dentist back' },
  wrote: { title: 'Dentist: reschedule' },
};

/** A conflict stays until the user dismisses it, and opening it shows the words
 * they typed next to the ones that replaced them. */
export const ReplacedByAnotherDevice: Story = {
  args: { failed: [], onDismissReplacedEdit: fn(), queued: [], replacedEdits: [replacedEdit] },
  play: async ({ args, canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Replaced by another device' });

    // Act
    await userEvent.click(within(region).getByRole('button', { name: /what happened/i }));

    // Assert
    await expect(region).toHaveTextContent('Dentist: reschedule');
    await expect(region).toHaveTextContent('Call the dentist back');

    // Act
    await userEvent.click(within(region).getByRole('button', { name: 'Dismiss' }));

    // Assert
    await expect(args.onDismissReplacedEdit).toHaveBeenCalledWith('stale-1');
  },
};
