import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { SyncStatus } from '../SyncStatus';

const meta: Meta<typeof SyncStatus> = {
  title: 'PSYKL/SyncStatus',
  component: SyncStatus,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof SyncStatus>;

export const Clear: Story = {
  args: { active: false, failedCount: 0, onOpen: fn(), queuedCount: 0 },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);

    // Assert
    await expect(canvas.getByRole('button', { name: 'Sync clear' })).toHaveAttribute('data-status', 'clear');
  },
};

export const NeedsAttention: Story = {
  args: { active: false, failedCount: 1, onOpen: fn(), queuedCount: 3 },
  play: async ({ args, canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const control = canvas.getByRole('button', { name: 'Sync needs attention' });

    // Act
    await userEvent.click(control);

    // Assert
    await expect(control).toHaveAttribute('data-status', 'attention');
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};
