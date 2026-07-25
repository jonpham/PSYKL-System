import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import { VersionFooter } from '../VersionFooter';

const meta: Meta<typeof VersionFooter> = {
  title: 'PSYKL/VersionFooter',
  component: VersionFooter,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof VersionFooter>;

// In a Storybook build VITE_GIT_SHA is unset, so the web commit renders as "dev".
// Each story drives the match/mismatch/error branch through the /version handler.

/** API reports the same commit as the web build → "in sync". */
export const InSync: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/version', () => HttpResponse.json({ component: 'service-task', commit: 'dev' }))],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/in sync/i));
  },
};

/** API reports a different commit than the web build → "version mismatch". */
export const Mismatch: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/version', () => HttpResponse.json({ component: 'service-task', commit: '9999999aaaaaa' })),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/mismatch/i));
    expect(canvas.getByLabelText(/api commit/i)).toHaveTextContent('9999999');
  },
};

/** API /version request fails → degrades to "api unreachable" without crashing. */
export const ApiUnavailable: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/version', () => HttpResponse.error())],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByLabelText(/api commit/i)).toHaveTextContent(/unavailable/i));
    expect(canvas.getByLabelText(/web client commit/i)).toHaveTextContent('dev');
  },
};
