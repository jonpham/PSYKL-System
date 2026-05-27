import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import App from '../../App';
import type { Task } from '../../api/client';
import { TaskList } from './TaskList';

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
  },
  {
    id: '01940000-0000-7000-8000-000000000002',
    user_id: 'local',
    title: 'second',
    created_at: new Date('2026-05-27T11:00:00Z').toISOString(),
  },
];

/** Empty state — Manual Visual Check surface. */
export const EmptyState: Story = {
  args: {
    tasks: [],
    loading: false,
    error: null,
  },
};

/** Loading state — Manual Visual Check surface. */
export const Loading: Story = {
  args: {
    tasks: [],
    loading: true,
    error: null,
  },
};

/** Error state — Manual Visual Check surface. */
export const ErrorState: Story = {
  args: {
    tasks: [],
    loading: false,
    error: 'Failed to load tasks',
  },
};

/** Pre-populated list — Manual Visual Check surface. */
export const WithTasks: Story = {
  args: {
    tasks: sampleTasks,
    loading: false,
    error: null,
  },
};

/**
 * Component-layer UI test (replaces the retired Vitest
 * TaskList.component.test.tsx). Renders the full `App` so the TaskList is
 * driven through the real create→list integration. The play function:
 *
 *  1. Awaits the MSW-stubbed GET /tasks → asserts the empty-state copy.
 *  2. Types a title, clicks Create → asserts the first task appears and the
 *     empty-state copy is gone.
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
