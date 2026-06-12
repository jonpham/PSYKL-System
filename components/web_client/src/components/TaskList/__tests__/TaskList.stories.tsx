import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import App from '../../../App';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList',
  component: TaskList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

const sampleTasks: Task[] = [
  {
    id: '01940000-0000-7000-8000-000000000001',
    user_id: 'local',
    title: 'first',
    created_at: new Date('2026-05-27T10:00:00Z').toISOString(),
    completed_at: null,
    updated_at: new Date('2026-05-27T10:00:00Z').toISOString(),
    server_updated_at: new Date('2026-05-27T10:00:00.500Z').toISOString(),
    deleted_at: null,
  },
  {
    id: '01940000-0000-7000-8000-000000000002',
    user_id: 'local',
    title: 'second',
    created_at: new Date('2026-05-27T11:00:00Z').toISOString(),
    completed_at: null,
    updated_at: new Date('2026-05-27T11:00:00Z').toISOString(),
    server_updated_at: new Date('2026-05-27T11:00:00.500Z').toISOString(),
    deleted_at: null,
  },
];

/** Empty state — Manual Visual Check surface. */
export const EmptyState: Story = {
  render: () => <App />,
};

/** Loading state — Manual Visual Check surface. */
export const Loading: Story = {
  render: () => <TaskList />,
};

/** Error state — Manual Visual Check surface. */
export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/tasks', () => HttpResponse.error())],
    },
  },
  render: () => <App />,
};

/** Pre-populated list — Manual Visual Check surface. */
export const WithTasks: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/tasks', () => HttpResponse.json(sampleTasks))],
    },
  },
  render: () => <App />,
};

/**
 * Component-layer UI test (replaces the retired Vitest
 * TaskList.component.test.tsx). Renders the full `App` so the TaskList is
 * driven through the real create→list integration. The play function:
 *
 *  1. Awaits MSW hydration through IndexedDB → asserts the empty-state copy.
 *  2. Types a title, clicks Create → asserts the first task appears and the
 *     empty-state copy is gone after local notification.
 *  3. Types a second title, clicks Create → asserts both tasks are listed.
 */
export const IntegratedWithCreateForm: Story = {
  render: () => <App />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('GET /tasks resolves to empty state', async () => {
      expect(await canvas.findByText(/no tasks yet/i)).toBeInTheDocument();
    });

    await step('Create the first task', async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: /title/i }), 'first');
      await userEvent.click(canvas.getByRole('button', { name: /create/i }));

      expect(await canvas.findByText('first')).toBeInTheDocument();
      await waitFor(() => expect(canvas.queryByText(/no tasks yet/i)).not.toBeInTheDocument());
    });

    await step('Create the second task; both render', async () => {
      await userEvent.type(canvas.getByRole('textbox', { name: /title/i }), 'second');
      await userEvent.click(canvas.getByRole('button', { name: /create/i }));

      expect(await canvas.findByText('second')).toBeInTheDocument();
      expect(canvas.getByText('first')).toBeInTheDocument();
    });
  },
};

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
      handlers: [http.get('*/tasks', () => HttpResponse.error())],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(await canvas.findByRole('alert')).toHaveTextContent(/failed to load tasks/i);
  },
};
