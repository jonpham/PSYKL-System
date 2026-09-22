import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import App from '../../../App';
import { listSyncQueue } from '../../../db/idb';
import { listHandlers } from '../../../test/msw-handlers.lists';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Mutations',
  component: TaskList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

// Seed task used by every story below. The per-story `GET /tasks` handler
// returns it so `App` hydrates it through IndexedDB before the play function
// drives edit / complete / delete interactions.
const seedTask: Task = {
  id: '01940000-0000-7000-8000-0000000000c1',
  user_id: 'local',
  title: 'seed task',
  created_at: new Date('2026-06-01T09:00:00Z').toISOString(),
  completed_at: null,
  updated_at: new Date('2026-06-01T09:00:00Z').toISOString(),
  server_updated_at: new Date('2026-06-01T09:00:00.500Z').toISOString(),
  deleted_at: null,
  list_id: null,
};

// `<App />` bootstraps this device's default list on first render, so the
// list routes have to be answered too — a story whose fake back-end omits them
// leaves that create stuck in the sync queue for the rest of the story.
const seedListHandler = http.get('*/tasks', () => HttpResponse.json([seedTask]));
const appHandlers = [seedListHandler, ...listHandlers];

/**
 * Component-layer proof that the inline title edit routes through the sync
 * queue (`enqueue()` → IndexedDB) and never calls `fetch` from the component.
 * The `PATCH` handler returns 500 so the enqueued op is retried and stays in
 * `sync_queue` for inspection; a direct component `fetch` would leave the
 * queue empty.
 *
 * Mutation wiring enforced by:
 * components/web_client/src/components/TaskList/TaskRow/TaskRow.tsx
 */
export const EditTitleEnqueuesPatch: Story = {
  parameters: {
    msw: { handlers: [...appHandlers, http.patch('*/tasks/:id', () => new HttpResponse(null, { status: 500 }))] },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByRole('button', { name: /edit seed task/i });

    // Act
    await userEvent.click(canvas.getByRole('button', { name: /edit seed task/i }));
    const input = await canvas.findByRole('textbox', { name: /edit title/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'seed task edited{Enter}');

    // Assert — `App` also mounts the lists hook, which enqueues the default
    // list's own create op on first run, so filter to this task's entry.
    // `attempts > 0` (not just "entry exists"): `enqueueWithReplay`
    // (sync/page-triggers.ts) fires `runReplay()` as fire-and-forget, so the
    // entry is written to IDB before the mocked 500 round-trip completes.
    // Waiting for `scheduleRetry()`'s attempts bump forces this play()
    // function to not resolve until that background replay has actually
    // settled — otherwise it can land after the NEXT story's `deleteDB`
    // reset (preview.ts loader) and re-write this entry into the freshly
    // wiped database, bleeding state across stories (observed in CI).
    await waitFor(async () => {
      const queue = (await listSyncQueue()).filter((entry) => entry.entity_id === seedTask.id);
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({ entity_id: seedTask.id, entity_type: 'task', op: 'patch' });
      expect((queue[0]?.body as { title?: string }).title).toBe('seed task edited');
      expect(queue[0]?.attempts).toBeGreaterThan(0);
    });
    expect(await canvas.findByRole('button', { name: /edit seed task edited/i })).toBeInTheDocument();
  },
};

/**
 * Component-layer proof that the complete toggle enqueues a `patch` op setting
 * `completed_at`. `PATCH` returns 500 so the op remains queued for inspection.
 */
export const CompleteEnqueuesPatch: Story = {
  parameters: {
    msw: { handlers: [...appHandlers, http.patch('*/tasks/:id', () => new HttpResponse(null, { status: 500 }))] },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByRole('checkbox', { name: /mark seed task complete/i });

    // Act
    await userEvent.click(canvas.getByRole('checkbox', { name: /mark seed task complete/i }));

    // Assert — `App` also mounts the lists hook, which enqueues the default
    // list's own create op on first run, so filter to this task's entry.
    // `attempts > 0`: see EditTitleEnqueuesPatch's comment above — forces
    // this play() to wait for the fire-and-forget replay to settle before
    // the next story's `deleteDB` reset runs.
    await waitFor(async () => {
      const queue = (await listSyncQueue()).filter((entry) => entry.entity_id === seedTask.id);
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({ entity_id: seedTask.id, entity_type: 'task', op: 'patch' });
      expect((queue[0]?.body as { completed_at?: string | null }).completed_at).toEqual(expect.any(String));
      expect(queue[0]?.attempts).toBeGreaterThan(0);
    });
    expect(await canvas.findByRole('checkbox', { name: /mark seed task incomplete/i })).toBeChecked();
  },
};

/**
 * Stale-write reconciliation: the user edits a task locally (optimistic), but
 * the server responds with a newer row. On successful replay the sync engine
 * overwrites the local edit with the server row (last-write-wins), and the
 * IndexedDB-driven rerender replaces the local title in the UI.
 *
 * Reconciliation enforced by:
 * components/web_client/src/sync/replay.ts
 */
export const StaleWriteReconciliation: Story = {
  parameters: {
    msw: {
      handlers: [
        ...appHandlers,
        http.patch('*/tasks/:id', () =>
          HttpResponse.json({
            ...seedTask,
            title: 'server wins',
            updated_at: new Date('2026-06-01T12:00:00Z').toISOString(),
            server_updated_at: new Date('2026-06-01T12:00:00.500Z').toISOString(),
          }),
        ),
      ],
    },
  },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByRole('button', { name: /edit seed task/i });

    // Act
    await userEvent.click(canvas.getByRole('button', { name: /edit seed task/i }));
    const input = await canvas.findByRole('textbox', { name: /edit title/i });
    await userEvent.clear(input);
    await userEvent.type(input, 'local edit{Enter}');

    // Assert
    expect(await canvas.findByText('server wins')).toBeInTheDocument();
    expect(canvas.queryByText('local edit')).not.toBeInTheDocument();
    await waitFor(async () => expect(await listSyncQueue()).toHaveLength(0));
  },
};
