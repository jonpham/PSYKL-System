import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import type { Experiment } from '../../registry.types';
import { ExperimentTools } from '../ExperimentTools';

const experiments: Experiment[] = [
  {
    Component: () => <p>reminders</p>,
    slug: 'apple-reminders-ux',
    summary: 'Apple Reminders-grade navigation over existing PSYKL features.',
    title: 'Apple Reminders UX',
  },
];

const meta: Meta<typeof ExperimentTools> = {
  title: 'PSYKL/Experiment/ExperimentTools',
  component: ExperimentTools,
  args: { experiments },
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof ExperimentTools>;

/** The resting state: one button, out of the way of an experiment's own chrome. */
export const Collapsed: Story = {
  play: async ({ canvasElement }) => {
    // Assert
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Expand experiment controls' })).toBeVisible();
  },
};

/** The whole point of the feature: reach a prototype from the production app. */
export const DeveloperSwitchesFromProductionToAPrototype: Story = {
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    window.history.pushState({}, '', '/');

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Expand experiment controls' }));

    // Assert — the developer can see which experience they are on
    const experienceButton = canvas.getByRole('button', { name: /switch experience/i });
    await expect(experienceButton).toHaveTextContent('Production');

    // Act
    await userEvent.click(experienceButton);
    await userEvent.click(await canvas.findByRole('button', { name: /Apple Reminders UX/ }));

    // Assert
    await expect(window.location.pathname).toBe('/exp/apple-reminders-ux');
    await expect(canvas.queryByRole('dialog')).toBeNull();
  },
};

/** Production is always on the menu, however many experiments are registered. */
export const PickerAlwaysOffersProduction: Story = {
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    window.history.pushState({}, '', '/exp/apple-reminders-ux');

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Expand experiment controls' }));
    await userEvent.click(canvas.getByRole('button', { name: /switch experience/i }));

    // Assert
    const dialog = within(await canvas.findByRole('dialog', { name: 'Switch experience' }));
    await expect(dialog.getByRole('button', { name: /Production/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Apple Reminders UX/ })).toHaveAttribute('aria-current', 'true');

    // Act — Escape leaves the developer where they were
    await userEvent.keyboard('{Escape}');

    // Assert
    await expect(canvas.queryByRole('dialog')).toBeNull();
    await expect(window.location.pathname).toBe('/exp/apple-reminders-ux');
  },
};
