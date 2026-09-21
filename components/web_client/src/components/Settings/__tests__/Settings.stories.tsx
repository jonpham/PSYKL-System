import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { useState } from 'react';

import { Settings } from '../Settings';

/** Drives Settings through the same open/close wiring `App.tsx` uses, so the
 * story covers the operator's real route into the experiment surface. */
function SettingsHarness() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)} type="button">
        Settings
      </button>
      <Settings onClose={() => setOpen(false)} open={open} />
    </div>
  );
}

const meta: Meta<typeof SettingsHarness> = {
  title: 'PSYKL/Settings',
  component: SettingsHarness,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof SettingsHarness>;

export const OperatorFindsExperimentsUnderSettings: Story = {
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }));

    // Assert
    await expect(canvas.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Experiments' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Apple Reminders UX' })).toBeVisible();

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));

    // Assert
    await expect(canvas.queryByRole('dialog', { name: 'Settings' })).toBeNull();
  },
};
