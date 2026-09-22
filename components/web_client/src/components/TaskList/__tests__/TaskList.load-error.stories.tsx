import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import App from '../../../App';
import { clearStore } from '../../../test/local-database';
import { listHandlers } from '../../../test/msw-handlers.lists';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList',
  component: TaskList,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

/**
 * Renders the full `App` with a per-story MSW override that makes `GET /tasks`
 * fail with a network error. Covers the `useTasks()` hydration error branch
 * which the default handlers and other stories don't exercise.
 *
 * Uses `HttpResponse.error()` (network failure) rather than a 500 status
 * because openapi-fetch only surfaces non-2xx responses as `loadError` when
 * the OpenAPI document declares the error response shape; an undeclared
 * 500 falls through with `data: undefined` and skips the hook's error branch.
 * A network failure throws, hitting the catch reliably.
 */
export const AppLoadError: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/tasks', () => HttpResponse.error()), ...listHandlers],
    },
  },
  // The error branch is only reached when there is no local cache to fall back
  // on, which makes this story the one most exposed to anything an earlier
  // story left behind. Story loaders run after the global one, so emptying the
  // store here is the last word before render.
  loaders: [
    async () => {
      await clearStore('tasks');
      return {};
    },
  ],
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByRole('alert')).toHaveTextContent(/failed to load tasks/i);
  },
};
