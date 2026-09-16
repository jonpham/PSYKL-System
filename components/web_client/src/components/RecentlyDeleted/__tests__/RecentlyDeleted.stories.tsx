import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { useState } from 'react';

import type { Task } from '../../../api/client';
import { putTask } from '../../../db/idb';
import { TaskList } from '../../TaskList';
import { RecentlyDeleted } from '../RecentlyDeleted';

/** Composes the real list surface so the story can restore a Task through
 * the actual UI and verify it reappears — the same "drive it for real,
 * stub only the network" approach as `ListSwitcher.stories.tsx`.
 *
 * `TaskCreateForm` is deliberately NOT mounted here: every `useTasks()`
 * call (including TaskCreateForm's, and useSyncPressure's inside it)
 * subscribes to the same task-change notifications `useRecentlyDeleted`'s
 * own reload() reacts to. Create-then-delete via the real UI is already
 * covered by `TaskCreateForm.stories.tsx` and
 * `TaskList.mutations.stories.tsx`; this story seeds an already-deleted
 * Task directly (below) so it isolates what it's actually testing —
 * restore — from that unrelated concurrent-reload churn, which was
 * flaking under CI's slower/more contended runner (see git history on
 * this file for the specific races found and fixed along the way). */
function RecentlyDeletedHarness() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <TaskList />
      <button onClick={() => setOpen(true)} type="button">
        Recently Deleted
      </button>
      <RecentlyDeleted onClose={() => setOpen(false)} open={open} />
    </div>
  );
}

const meta: Meta<typeof RecentlyDeletedHarness> = {
  title: 'PSYKL/RecentlyDeleted',
  component: RecentlyDeletedHarness,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof RecentlyDeletedHarness>;

// restore() routes through sync-client.ts's enqueueOptimistic, which does a
// real IndexedDB round-trip (write the optimistic row + queue entry, then
// notify + fire-and-forget replay) before the UI reflects it. The default
// waitFor timeout (1000ms, raised globally in .storybook/preview.ts to
// 5000ms) was tight enough to flake under CI's slower/more contended
// runner even though it was comfortably clear locally.
const MUTATION_WAIT_TIMEOUT_MS = 5000;

const dayMs = 24 * 60 * 60 * 1000;
const deletedTwoDaysAgo: Task = {
  id: '0196f0a4-8b5a-7000-8000-0000000000d1',
  user_id: 'local',
  title: 'Milk',
  created_at: new Date(Date.now() - 2 * dayMs).toISOString(),
  completed_at: null,
  updated_at: new Date(Date.now() - 2 * dayMs).toISOString(),
  server_updated_at: new Date(Date.now() - 2 * dayMs).toISOString(),
  deleted_at: new Date(Date.now() - 2 * dayMs).toISOString(),
  list_id: null,
};

export const RestoresADeletedTask: Story = {
  loaders: [
    async () => {
      // Runs after preview.ts's global deleteDB('psykl') reset (project-level
      // loaders execute before story-level ones), seeding this story's fixture
      // directly rather than driving create + delete through the real UI.
      await putTask(deletedTwoDaysAgo);
      return {};
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('It appears in Recently Deleted', async () => {
      await waitFor(
        () => {
          expect(canvas.getByRole('listitem', { name: 'Milk' })).toBeVisible();
        },
        { timeout: MUTATION_WAIT_TIMEOUT_MS },
      );
    });

    await step('Restore it and it returns to the list', async () => {
      // findByRole (not getByRole): useRecentlyDeleted.ts's reload() churns
      // through several concurrent notify-triggered reloads around every
      // mutation (see its staleness-guard comment) — a synchronous getByRole
      // right after the previous step's mutation cascade can catch the DOM
      // between two of those re-renders under CI's slower/busier render
      // cycle.
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Restore Milk' }, { timeout: MUTATION_WAIT_TIMEOUT_MS }),
      );
      await waitFor(
        () => {
          expect(canvas.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
        },
        { timeout: MUTATION_WAIT_TIMEOUT_MS },
      );
      await waitFor(() => expect(canvas.getByText('Milk')).toBeVisible(), { timeout: MUTATION_WAIT_TIMEOUT_MS });
    });
  },
};
