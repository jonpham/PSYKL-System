import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import App from '../../../App';
import { listSyncQueue } from '../../../db/idb';
import { listHandlers } from '../../../test/msw-handlers.lists';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Batch Completion',
  component: TaskList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

// Own ids and titles, like every other selection story: the sync queue retries
// in the background and must not reach across into another story's assertions.
function task(id: string, title: string, minute: string, completedAt: string | null = null): Task {
  return {
    completed_at: completedAt,
    created_at: new Date(`2026-06-01T09:${minute}:00Z`).toISOString(),
    deleted_at: null,
    id,
    list_id: null,
    server_updated_at: new Date(`2026-06-01T09:${minute}:00.500Z`).toISOString(),
    title,
    updated_at: new Date(`2026-06-01T09:${minute}:00Z`).toISOString(),
    user_id: 'local',
  };
}

const done = task('01940000-0000-7000-8000-0000000000c1', 'oats reopening', '00', '2026-06-01T10:00:00.000Z');
const open = task('01940000-0000-7000-8000-0000000000c2', 'bread reopening', '01');

/**
 * The completion action is a toggle: a pooled task that is already complete is
 * patched back to open rather than skipped. The PATCH handler answers 500 so the
 * enqueued op stays put and its body can be read.
 *
 * Toggle semantics enforced by:
 * components/web_client/src/components/TaskList/useTaskSelection.ts
 */
export const BatchToggleReopensCompletedTasks: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/tasks', () => HttpResponse.json([done, open])),
        ...listHandlers,
        http.patch('*/tasks/:id', () => new HttpResponse(null, { status: 500 })),
      ],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange — completed rows are shown by default, so the finished task is
    // already on screen and poolable
    await canvas.findByRole('button', { name: `Edit ${open.title}` });
    await userEvent.click(canvas.getByRole('button', { name: 'List options' }));
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Select Items' }));
    await userEvent.click(await canvas.findByRole('button', { name: `Select ${done.title}` }));

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle completion of selected tasks' }));

    // Assert — the write reopens the task rather than re-completing it
    await waitFor(async () => {
      const queued = (await listSyncQueue()).filter((entry) => entry.entity_id === done.id);
      await expect(queued).toHaveLength(1);
      await expect(queued[0]?.op).toBe('patch');
      await expect((queued[0]?.body as { completed_at?: string | null }).completed_at).toBeNull();
    });
  },
};

import '../../../styles/tokens.css';
