import '../../../styles/tokens.css';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import App from '../../../App';
import { listSyncQueue } from '../../../db/idb';
import { listHandlers } from '../../../test/msw-handlers.lists';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Details Drawer',
  component: TaskList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

// Each story seeds its own task, so a story that renames or deletes cannot
// change what a later story finds on screen (see TaskList.selection.stories).
function task(idSuffix: string, title: string, completedAt: string | null = null): Task {
  return {
    completed_at: completedAt,
    created_at: '2026-06-01T09:00:00.000Z',
    deleted_at: null,
    id: `01940000-0000-7000-8000-0000000000${idSuffix}`,
    list_id: null,
    server_updated_at: '2026-06-02T11:30:00.500Z',
    title,
    updated_at: '2026-06-02T11:30:00.000Z',
    user_id: 'local',
  };
}

function handlersFor(seeded: Task) {
  return [http.get('*/tasks', () => HttpResponse.json([seeded])), ...listHandlers];
}

const opening = task('81', 'renew the passport');
const finished = task('82', 'water the plants', '2026-06-03T08:15:00.000Z');
const deleting = task('83', 'cancel the subscription');
const renaming = task('84', 'draft name');

/** Tapping the title focuses it for editing and reveals the details button. */
async function openDetails(canvas: ReturnType<typeof within>, seeded: Task): Promise<void> {
  await userEvent.click(await canvas.findByRole('button', { name: `Edit ${seeded.title}` }));
  await userEvent.click(await canvas.findByRole('button', { name: `Details for ${seeded.title}` }));
  await canvas.findByRole('dialog', { name: 'Task' });
}

/**
 * The drawer is where a single task's timestamps live. A task that is not
 * finished shows an em dash for Completed — never a blank, which would read as
 * a surface that failed to load.
 */
export const OpenOnAnUnfinishedTask: Story = {
  parameters: { msw: { handlers: handlersFor(opening) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange / Act
    await openDetails(canvas, opening);

    // Assert
    const drawer = within(canvas.getByRole('dialog', { name: 'Task' }));
    await expect(drawer.getByRole('group', { name: 'Completed' })).toHaveTextContent('—');
    await expect(drawer.getByRole('group', { name: 'Created' })).not.toHaveTextContent('—');
    await expect(drawer.getByRole('group', { name: 'Last updated' })).not.toHaveTextContent('—');
    // Nothing has changed yet, so there is nothing to save.
    await expect(drawer.getByRole('button', { name: 'Save' })).toBeDisabled();
    // The list behind it is covered rather than merely dimmed.
    await expect(canvasElement.querySelector('.psykl-drawer-scrim')).toBeInTheDocument();
  },
};

/** A finished task carries the moment it was finished. */
export const OpenOnAFinishedTask: Story = {
  parameters: { msw: { handlers: handlersFor(finished) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange / Act
    await openDetails(canvas, finished);

    // Assert
    const drawer = within(canvas.getByRole('dialog', { name: 'Task' }));
    await expect(drawer.getByRole('group', { name: 'Completed' })).not.toHaveTextContent('—');
  },
};

/**
 * Delete is armed by the first press and performed by the second — a ring
 * around the same control, not a louder second one — and it leaves through the
 * sync queue like any other write. The DELETE handler answers 500 so the
 * enqueued op stays put for inspection.
 *
 * Mutation wiring enforced by:
 * components/web_client/src/components/TaskList/TaskRow/EditableTaskRow.tsx
 */
export const ArmedDeleteIsARing: Story = {
  parameters: {
    msw: {
      handlers: [...handlersFor(deleting), http.delete('*/tasks/:id', () => new HttpResponse(null, { status: 500 }))],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await openDetails(canvas, deleting);
    const drawer = within(canvas.getByRole('dialog', { name: 'Task' }));

    // Act — the first press only arms the action
    await userEvent.click(drawer.getByRole('button', { name: 'Delete task' }));

    // Assert — a ring, not a fill: the armed state must not paint the ground
    const armed = drawer.getByRole('button', { name: `Confirm deleting ${deleting.title}` });
    await expect(armed).toHaveAttribute('data-armed', 'true');
    const armedStyle = getComputedStyle(armed);
    await expect(armedStyle.borderStyle).toBe('solid');
    await expect(['transparent', 'rgba(0, 0, 0, 0)', 'none']).toContain(armedStyle.backgroundColor);

    // Act — the second press performs it
    await userEvent.click(armed);

    // Assert — `attempts > 0` proves the op went through the queue's replay
    // rather than a direct fetch, and that the retry settled before this ends.
    await waitFor(async () => {
      const queued = (await listSyncQueue()).filter((entry) => entry.entity_id === deleting.id);
      await expect(queued).toHaveLength(1);
      await expect(queued[0]?.op).toBe('delete');
      await expect(queued[0]?.attempts ?? 0).toBeGreaterThan(0);
    });
  },
};

/**
 * Renaming through the drawer patches the task through the same queue, and
 * anything that changes what a delete would destroy retires the arming.
 */
export const RenamingRetiresAnArmedDelete: Story = {
  parameters: {
    msw: {
      handlers: [...handlersFor(renaming), http.patch('*/tasks/:id', () => new HttpResponse(null, { status: 500 }))],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await openDetails(canvas, renaming);
    const drawer = within(canvas.getByRole('dialog', { name: 'Task' }));
    await userEvent.click(drawer.getByRole('button', { name: 'Delete task' }));
    await expect(drawer.getByRole('button', { name: `Confirm deleting ${renaming.title}` })).toBeInTheDocument();

    // Act
    await userEvent.type(drawer.getByRole('textbox', { name: 'Title' }), ' settled');

    // Assert — back to resting, so the next press cannot destroy anything
    await expect(drawer.getByRole('button', { name: 'Delete task' })).toBeInTheDocument();

    // Act
    await userEvent.click(drawer.getByRole('button', { name: 'Save' }));

    // Assert
    await waitFor(async () => {
      const queued = (await listSyncQueue()).filter((entry) => entry.entity_id === renaming.id);
      await expect(queued).toHaveLength(1);
      await expect(queued[0]?.op).toBe('patch');
      await expect((queued[0]?.body as { title?: string })?.title).toBe('draft name settled');
    });
  },
};
