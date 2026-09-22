import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import type { FailedOpEntry, SyncQueueEntry } from '../../../db/idb.types';
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
  args: { failed: [], queued: [] },
  play: async ({ canvasElement }) => {
    // Assert
    await expect(within(canvasElement).getByText('Everything is synced.')).toBeInTheDocument();
  },
};

export const QueuedAndFailed: Story = {
  args: { failed: [failedEntry], queued: [queuedEntry] },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);

    // Assert — a failure carries the reason the server gave, not just a count
    await expect(canvas.getByRole('region', { name: 'Waiting to sync' })).toHaveTextContent('Edited a task');
    await expect(canvas.getByRole('region', { name: 'Could not be sent' })).toHaveTextContent('Task not found');
  },
};
