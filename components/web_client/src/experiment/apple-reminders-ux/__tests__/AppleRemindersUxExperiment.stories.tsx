import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { enqueueSyncOp, putFailedOp } from '../../../db/idb';
import { notifyTasksChanged } from '../../../hooks/useTasks';
import { AppleRemindersUxExperiment } from '../AppleRemindersUxExperiment';

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

export const OpensSyncDetailsWithoutShowingABanner: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const now = new Date().toISOString();

    await step('A queued and a failed change update the compact control', async () => {
      await enqueueSyncOp({
        id: 'story-queued',
        entity_type: 'task',
        entity_id: 'story-task-queued',
        op: 'create',
        body: {},
        idempotency_key: 'story-queued',
        attempts: 0,
        next_attempt_at: now,
        created_at: now,
      });
      await putFailedOp({
        id: 'story-failed',
        entity_type: 'task',
        entity_id: 'story-task-failed',
        op: 'create',
        body: {},
        idempotency_key: 'story-failed',
        attempts: 10,
        next_attempt_at: now,
        created_at: now,
        failed_at: now,
        error: 'Gave up after 10 attempts',
      });
      await notifyTasksChanged();

      await waitFor(() => {
        expect(canvas.getByRole('button', { name: /Sync needs attention/ })).toBeVisible();
        expect(canvas.queryByText(/changes waiting to sync/i)).not.toBeInTheDocument();
      });
    });

    await step('The sidebar Sync row opens separate queued and failed details', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Open PSYKL navigation' }));
      const sidebar = within(canvas.getByRole('navigation', { name: 'PSYKL navigation' }));
      await userEvent.click(sidebar.getByRole('button', { name: 'Sync needs attention' }));

      await waitFor(() => {
        expect(canvas.getByRole('heading', { name: 'Needs attention' })).toBeVisible();
        expect(canvas.getByText(/Waiting to sync:/)).toBeVisible();
        expect(canvas.getByText('Permanently failed: 1')).toBeVisible();
        expect(canvasElement.querySelector('nav')).not.toBeVisible();
      });
    });
  },
};

export const CapturesATaskAndSinksItOnCompletion: Story = {
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Capture two tasks from the New Reminder row', async () => {
      // Arrange / Act
      await userEvent.click(canvas.getByRole('button', { name: 'New Reminder' }));
      const input = await canvas.findByRole('textbox', { name: 'New task title' });
      await userEvent.type(input, 'Book dentist{Enter}');
      await userEvent.type(input, 'Pay invoice{Enter}');
      await userEvent.type(input, '{Escape}');

      // Assert
      await waitFor(() => {
        expect(canvas.getByRole('checkbox', { name: 'Complete Book dentist' })).toBeVisible();
        expect(canvas.getByRole('checkbox', { name: 'Complete Pay invoice' })).toBeVisible();
      });
    });

    await step('Completing the first task sinks it below the open one', async () => {
      // Act
      await userEvent.click(canvas.getByRole('checkbox', { name: 'Complete Book dentist' }));

      // Assert
      await waitFor(() => {
        const titles = canvas.getAllByRole('listitem').map((row) => row.textContent);
        expect(titles).toEqual(['Pay invoice', 'Book dentist']);
        expect(canvas.getByRole('checkbox', { name: 'Reopen Book dentist' })).toHaveAttribute('aria-checked', 'true');
      });
    });
  },
};
