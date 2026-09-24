import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import App from '../../../App';
import { listSyncQueue } from '../../../db/idb';
import { listHandlers } from '../../../test/msw-handlers.lists';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Selection',
  component: TaskList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

// Each story seeds its own two tasks. A story that deletes or moves a task
// must not be able to change what a later story finds on screen: the sync
// queue retries in the background and can land after the next story's IndexedDB
// reset (see TaskList.mutations.stories.tsx).
function task(id: string, title: string, minute: string): Task {
  return {
    completed_at: null,
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

interface Seed {
  first: Task;
  second: Task;
}

function seed(suffix: string, idSuffix: string): Seed {
  return {
    first: task(`01940000-0000-7000-8000-0000000000${idSuffix}1`, `oats ${suffix}`, '00'),
    second: task(`01940000-0000-7000-8000-0000000000${idSuffix}2`, `bread ${suffix}`, '01'),
  };
}

// `<App />` bootstraps this device's default list on first render, so the list
// routes have to be answered too — otherwise that create sticks in the queue
// and pollutes the assertions below.
function handlersFor({ first, second }: Seed) {
  return [http.get('*/tasks', () => HttpResponse.json([first, second])), ...listHandlers];
}

/**
 * Opens a list from the sidebar by its exact name.
 *
 * Seeded tasks carry `list_id: null`, which only resolves to a list while the
 * default list is the active one (useTasks.sync.ts), and the active list is
 * device state that outlives a single story — so a story that changes it puts
 * it back, and a story that depends on it asks for it rather than assuming.
 */
async function openList(canvas: ReturnType<typeof within>, name: string): Promise<void> {
  await userEvent.click(canvas.getByRole('button', { name: 'Open PSYKL navigation' }));
  const nav = within(await canvas.findByRole('navigation', { name: 'PSYKL navigation' }));
  await userEvent.click(await nav.findByRole('button', { name }));
}

const entering = seed('entering', 'd');
const deleting = seed('deleting', 'e');
const moving = seed('moving', 'f');
const visual = seed('visual', 'a');

/**
 * Entering selection mode is a mode switch, not a row state: the capture
 * button leaves, the action bar takes its plane, and the actions stay
 * unavailable until something is pooled.
 *
 * Mode wiring enforced by:
 * components/web_client/src/App.tsx
 */
export const EnteringSelectionMode: Story = {
  parameters: { msw: { handlers: handlersFor(entering) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByRole('button', { name: `Edit ${entering.first.title}` });

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'List options' }));
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Select Items' }));

    // Assert
    await expect(canvas.queryByRole('button', { name: 'New Task' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Delete selected tasks' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Done selecting' })).toBeInTheDocument();
    // The title selects rather than opening the editor while the mode is on.
    await expect(canvas.queryByRole('button', { name: `Edit ${entering.first.title}` })).not.toBeInTheDocument();
  },
};

/**
 * A batch delete is armed by the first press and performed by the second, and
 * it leaves through the sync queue like any other write — never a component
 * `fetch`. The DELETE handler answers 500 so the enqueued op stays put for
 * inspection.
 *
 * Mutation wiring enforced by:
 * components/web_client/src/components/TaskList/useTaskSelection.ts
 */
export const ConfirmedDeleteEnqueuesOps: Story = {
  parameters: {
    msw: {
      handlers: [...handlersFor(deleting), http.delete('*/tasks/:id', () => new HttpResponse(null, { status: 500 }))],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByRole('button', { name: `Edit ${deleting.first.title}` });
    await userEvent.click(canvas.getByRole('button', { name: 'List options' }));
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Select Items' }));
    await userEvent.click(canvas.getByRole('button', { name: `Select ${deleting.first.title}` }));

    // Act — the first press only arms the action
    await userEvent.click(canvas.getByRole('button', { name: 'Delete selected tasks' }));
    const armed = canvas.getByRole('button', { name: 'Confirm deleting 1 task' });
    await expect(armed).toHaveAttribute('data-armed', 'true');
    // A ring, not a fill: the armed state must not paint the button's ground.
    const armedStyle = getComputedStyle(armed);
    await expect(armedStyle.boxShadow).toContain('inset');
    await expect(['transparent', 'rgba(0, 0, 0, 0)', 'none']).toContain(armedStyle.backgroundColor);
    await userEvent.click(armed);

    // Assert — `attempts > 0` proves the op went through the queue's replay
    // rather than a direct fetch, and that the background retry has settled
    // before this story ends (see TaskList.mutations.stories.tsx).
    await waitFor(async () => {
      const queued = (await listSyncQueue()).filter((entry) => entry.entity_id === deleting.first.id);
      await expect(queued).toHaveLength(1);
      await expect(queued[0]?.op).toBe('delete');
      await expect(queued[0]?.attempts ?? 0).toBeGreaterThan(0);
    });
  },
};

/**
 * Moving a batch patches each task's `list_id` through the same queue, and the
 * drawer never offers the list the user is already looking at.
 *
 * Mutation wiring enforced by:
 * components/web_client/src/components/TaskList/useTaskSelection.ts
 */
export const MoveDrawerEnqueuesPatches: Story = {
  parameters: {
    msw: {
      handlers: [...handlersFor(moving), http.patch('*/tasks/:id', () => new HttpResponse(null, { status: 500 }))],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange — a second list gives the drawer somewhere to send the tasks
    await canvas.findByRole('button', { name: `Edit ${moving.first.title}` });
    await openList(canvas, 'Lists');
    await userEvent.click(await canvas.findByRole('button', { name: 'New List' }));
    const listTitle = await canvas.findByRole('textbox', { name: /new list name/i });
    await userEvent.type(listTitle, 'Weekend{Enter}');
    await openList(canvas, 'Tasks');

    await userEvent.click(await canvas.findByRole('button', { name: 'List options' }));
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Select Items' }));
    await userEvent.click(canvas.getByRole('button', { name: `Select ${moving.second.title}` }));

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Move selected tasks' }));
    const drawer = within(await canvas.findByRole('dialog', { name: 'Move to:' }));
    await expect(drawer.queryByRole('radio', { name: 'Tasks' })).not.toBeInTheDocument();
    await userEvent.click(drawer.getByRole('radio', { name: 'Weekend' }));
    await userEvent.click(drawer.getByRole('button', { name: 'Move' }));

    // Assert
    await waitFor(async () => {
      const queued = (await listSyncQueue()).filter((entry) => entry.entity_id === moving.second.id);
      await expect(queued).toHaveLength(1);
      await expect(queued[0]?.op).toBe('patch');
      await expect(queued[0]?.attempts ?? 0).toBeGreaterThan(0);
    });
  },
};

/** Selection mode, two rows pooled — Manual Visual Check surface. */
export const SelectionBarVisual: Story = {
  parameters: { msw: { handlers: handlersFor(visual) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openList(canvas, 'Tasks');
    await canvas.findByRole('button', { name: `Edit ${visual.first.title}` });
    await userEvent.click(canvas.getByRole('button', { name: 'List options' }));
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Select Items' }));
    await userEvent.click(canvas.getByRole('button', { name: `Select ${visual.first.title}` }));
    await userEvent.click(canvas.getByRole('button', { name: `Select ${visual.second.title}` }));
  },
};
