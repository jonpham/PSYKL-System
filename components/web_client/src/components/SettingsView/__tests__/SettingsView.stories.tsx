import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { SettingsView } from '../SettingsView';

const meta: Meta<typeof SettingsView> = {
  title: 'PSYKL/SettingsView',
  component: SettingsView,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof SettingsView>;

/** Appearance repaints the page in place — no reload, no flash of the old theme. */
export const SwitchAppearance: Story = {
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup', { name: 'Appearance' })).toHaveClass('psykl-settings__segmented');
    await expect(canvas.getByRole('radiogroup', { name: 'Contrast' })).toHaveClass('psykl-settings__segmented');
    await expect(canvas.getByRole('heading', { name: 'Version' })).toBeInTheDocument();

    // Act
    await userEvent.click(canvas.getByRole('radio', { name: 'Dark' }));

    // Assert
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'));

    // Act — System defers to the device, so it stamps nothing at all
    await userEvent.click(canvas.getByRole('radio', { name: 'System' }));

    // Assert
    await waitFor(() => expect(document.documentElement).not.toHaveAttribute('data-theme'));
  },
};

/** All four appearance x contrast combinations stand on their own. */
export const EveryContrastCombination: Story = {
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const root = document.documentElement;

    for (const [appearance, theme] of [
      ['Light', 'light'],
      ['Dark', 'dark'],
    ] as const) {
      // Act — standard first, then increased, for this appearance
      await userEvent.click(canvas.getByRole('radio', { name: appearance }));
      await userEvent.click(canvas.getByRole('radio', { name: 'Standard' }));

      // Assert
      await waitFor(() => expect(root).toHaveAttribute('data-theme', theme));
      await expect(root).not.toHaveAttribute('data-contrast');

      // Act
      await userEvent.click(canvas.getByRole('radio', { name: 'Increased' }));

      // Assert — contrast composes with the appearance rather than replacing it
      await waitFor(() => expect(root).toHaveAttribute('data-contrast', 'increased'));
      await expect(root).toHaveAttribute('data-theme', theme);
    }

    // Leave the page as it was found.
    await userEvent.click(canvas.getByRole('radio', { name: 'Standard' }));
    await userEvent.click(canvas.getByRole('radio', { name: 'System' }));
  },
};
