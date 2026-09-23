import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import type { Experiment } from '../../registry.types';
import { ExperimentsIndex } from '../ExperimentsIndex';

const experiments: Experiment[] = [
  {
    Component: () => <p>sections</p>,
    slug: 'task-sections',
    summary: 'Group tasks under headings.',
    title: 'Task Sections',
  },
  {
    Component: () => <p>swipe</p>,
    slug: 'swipe-actions',
    summary: 'Swipe a row to complete it.',
    title: 'Swipe Actions',
  },
];

const meta: Meta<typeof ExperimentsIndex> = {
  title: 'PSYKL/Experiment/ExperimentsIndex',
  component: ExperimentsIndex,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof ExperimentsIndex>;

export const NoExperimentsRegistered: Story = {
  args: { experiments: [] },
  play: async ({ canvasElement }) => {
    // Arrange / Assert
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No experiments are registered right now.')).toBeVisible();
  },
};

export const OperatorOpensAnExperimentFromTheList: Story = {
  args: { experiments },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    window.history.pushState({}, '', '/');
    await expect(canvas.getByText('Swipe a row to complete it.')).toBeVisible();
    // Each experiment is its own bordered row, so the list scans as a set of targets.
    await expect(canvas.getAllByRole('button')).toHaveLength(2);

    // Act
    await userEvent.click(canvas.getByRole('button', { name: /Task Sections/ }));

    // Assert
    await expect(window.location.pathname).toBe('/exp/task-sections');
  },
};
