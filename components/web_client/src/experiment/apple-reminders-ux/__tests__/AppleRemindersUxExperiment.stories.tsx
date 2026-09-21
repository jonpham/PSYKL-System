import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { AppleRemindersUxExperiment } from '../AppleRemindersUxExperiment';

/**
 * Navigation-only stories. These deliberately write nothing to IndexedDB or the
 * sync queue: Storybook shares one origin across every story, and the preview
 * loader's `deleteDB('psykl')` is silently blocked whenever a page still holds
 * an open connection — so any Task an experiment story creates can survive into
 * whichever story runs next and break PSYKL/TaskList's empty-state assertions.
 *
 * Capture, completion ordering and sync counts are covered by the unit tests
 * beside each component, which is all the experimental lane's test floor asks
 * for (docs/workflows/experimental-feature-workflow.md → Test Floor).
 */
const meta: Meta<typeof AppleRemindersUxExperiment> = {
  title: 'PSYKL/Experiment/AppleRemindersUx',
  component: AppleRemindersUxExperiment,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppleRemindersUxExperiment>;

export const OpensTheSidebarAndNavigatesToSettingsOnMobile: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('The sidebar starts closed on mobile', async () => {
      expect(canvas.getByRole('button', { name: 'Open PSYKL navigation' })).toHaveAttribute('aria-expanded', 'false');
      expect(canvasElement.querySelector('nav')).not.toBeVisible();
    });

    await step('Open the sidebar from the PSYKL heading', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Open PSYKL navigation' }));
      await waitFor(() => {
        expect(canvas.getByRole('navigation', { name: 'PSYKL navigation' })).toBeVisible();
        expect(canvas.getByRole('button', { name: 'Close PSYKL navigation' })).toHaveFocus();
      });
    });

    await step('Choose Settings and return to the main area', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Settings' }));
      await waitFor(() => {
        expect(canvas.getByRole('heading', { name: 'Settings' })).toBeVisible();
        expect(canvasElement.querySelector('nav')).not.toBeVisible();
        expect(canvas.getByRole('button', { name: 'Open PSYKL navigation' })).toHaveFocus();
      });
    });
  },
};

export const KeepsTheSidebarBesideTheContentOnDesktop: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1024 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    // Arrange / Assert
    const sidebar = canvasElement.querySelector<HTMLElement>('.reminders-experiment__sidebar');
    const content = canvasElement.querySelector<HTMLElement>('.reminders-experiment__content');
    expect(sidebar).toBeVisible();
    expect(content).toBeVisible();
    expect(sidebar?.getBoundingClientRect().right).toBeLessThanOrEqual(content?.getBoundingClientRect().left ?? 0);
  },
};
