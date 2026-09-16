import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor, within } from '@storybook/test';

import { enqueueSyncOp } from '../../../db/idb';
import { notifyTasksChanged } from '../../../hooks/useTasks';
import { OutOfSyncBanner } from '../OutOfSyncBanner';

const meta: Meta<typeof OutOfSyncBanner> = {
  title: 'PSYKL/OutOfSyncBanner',
  component: OutOfSyncBanner,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof OutOfSyncBanner>;

export const BelowThreshold: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No banner text below the nag threshold (empty queue fixture)
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

export const AtNagThreshold: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Queue 25 changes', async () => {
      for (let index = 0; index < 25; index += 1) {
        await enqueueSyncOp({
          id: `story-seed-${index}`,
          entity_type: 'task',
          entity_id: `story-task-${index}`,
          op: 'create',
          body: {},
          idempotency_key: `story-idem-${index}`,
          attempts: 0,
          next_attempt_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
      await notifyTasksChanged();
    });

    await step('Banner tells the user to reconnect', async () => {
      await waitFor(() => {
        expect(canvas.getByRole('status')).toHaveTextContent('25 changes waiting to sync. Reconnect to save them.');
      });
    });
  },
};
