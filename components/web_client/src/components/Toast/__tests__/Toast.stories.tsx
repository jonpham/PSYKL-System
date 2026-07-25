import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor, within } from '@storybook/test';

import { Toast } from '../Toast';

const meta: Meta<typeof Toast> = {
  title: 'PSYKL/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const PermanentSyncFailure: Story = {
  render: () => <Toast />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Dispatch permanent sync failure', async () => {
      window.dispatchEvent(
        new CustomEvent('sync:permanent-fail', {
          detail: {
            error: 'HTTP 400',
            id: '01940000-0000-7000-8000-000000000011',
            status: 400,
          },
        }),
      );
    });

    await step('Toast appears', async () => {
      await waitFor(() => {
        expect(canvas.getByRole('alert')).toHaveTextContent(/sync failed/i);
      });
    });
  },
};

export const OfflineBanner: Story = {
  render: () => <Toast />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Going offline shows the banner', async () => {
      window.dispatchEvent(new Event('offline'));
      await waitFor(() => {
        expect(canvas.getByRole('status')).toHaveTextContent(/offline/i);
      });
    });

    await step('Going back online clears the banner', async () => {
      window.dispatchEvent(new Event('online'));
      await waitFor(() => {
        expect(canvas.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  },
};

export const StaleWriteReplacement: Story = {
  render: () => <Toast />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A superseded write shows the replacement toast', async () => {
      window.dispatchEvent(new CustomEvent('sync:stale-write', { detail: { task: { title: 'groceries' } } }));
      await waitFor(() => {
        expect(canvas.getByRole('alert')).toHaveTextContent(/groceries.*replaced your change/i);
      });
    });
  },
};
