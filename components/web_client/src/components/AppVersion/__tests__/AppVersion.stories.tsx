import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import { AppVersion } from '../AppVersion';

/** A service-worker container with nothing waiting — the plain browser case. */
const noWaitingWorker = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  getRegistration: async () => ({ update: async () => undefined, waiting: null }),
} as never;

const meta: Meta<typeof AppVersion> = {
  title: 'PSYKL/AppVersion',
  component: AppVersion,
  args: {
    updateOptions: { container: noWaitingWorker, reload: () => undefined },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof AppVersion>;

// In a Storybook build VITE_GIT_SHA is unset, so the loaded commit is "dev".
// Each story drives the deployed commit through the /version.json handler.
const deployed = (commit: string) => http.get('*/version.json', () => HttpResponse.json({ commit }));

/** The origin is serving what the user is running: no update to offer. */
export const UpToDate: Story = {
  parameters: {
    msw: { handlers: [deployed('dev')] },
  },
  play: async ({ canvasElement }) => {
    // Assert
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/last checked:/i));
    expect(canvas.getByRole('button', { name: /check for updates/i })).toBeEnabled();
    // An available version equal to the loaded one is noise, so it is not shown.
    expect(canvas.queryByLabelText(/available web version/i)).not.toBeInTheDocument();
  },
};

/** A newer bundle is already deployed when Settings opens. */
export const UpdateAvailable: Story = {
  parameters: {
    msw: { handlers: [deployed('8b12d44cccc')] },
  },
  play: async ({ canvasElement }) => {
    // Assert
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('button', { name: /update to latest/i })).toBeEnabled());
    expect(canvas.getByLabelText(/available web version/i)).toHaveTextContent('8b12d44');
    expect(canvas.getByRole('status')).toHaveTextContent(/new version is available/i);
  },
};

/** A deploy lands while the user is sitting on the Settings screen. */
export const CheckFindsANewVersion: Story = {
  parameters: {
    msw: {
      handlers: [
        (() => {
          let checked = false;
          return http.get('*/version.json', () => {
            const commit = checked ? '8b12d44cccc' : 'dev';
            checked = true;
            return HttpResponse.json({ commit });
          });
        })(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const check = await canvas.findByRole('button', { name: /check for updates/i });

    // Act — without navigating away and back
    await userEvent.click(check);

    // Assert
    await waitFor(() => expect(canvas.getByRole('button', { name: /update to latest/i })).toBeEnabled());
  },
};

/** Pressing the update button is a one-way trip: it disables and reloads. */
export const Updating: Story = {
  parameters: {
    msw: { handlers: [deployed('8b12d44cccc')] },
  },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const update = await canvas.findByRole('button', { name: /update to latest/i });

    // Act
    await userEvent.click(update);

    // Assert
    expect(canvas.getByRole('button', { name: /updating/i })).toBeDisabled();
  },
};

/** The version manifest cannot be reached — offline, or the server is down. */
export const CheckFailed: Story = {
  parameters: {
    msw: { handlers: [http.get('*/version.json', () => HttpResponse.error())] },
  },
  play: async ({ canvasElement }) => {
    // Assert
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(/couldn't check for updates/i));
    expect(canvas.getByRole('button', { name: /check for updates/i })).toBeEnabled();
  },
};
