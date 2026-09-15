import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { useState } from 'react';

import { TaskCreateForm } from '../../TaskCreateForm';
import { TaskList } from '../../TaskList';
import { RecentlyDeleted } from '../RecentlyDeleted';

/** Composes the real capture + list surfaces so the story can delete a Task
 * through the actual UI, then verify Recently Deleted picks it up — the
 * same "drive it for real, stub only the network" approach as
 * `ListSwitcher.stories.tsx`. */
function RecentlyDeletedHarness() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <TaskCreateForm />
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

export const RestoresADeletedTask: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Create a task', async () => {
      await userEvent.type(canvas.getByPlaceholderText('What needs doing?'), 'Milk{Enter}');
      await waitFor(() => expect(canvas.getByText('Milk')).toBeVisible());
    });

    await step('Delete it (two-tap confirm)', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Delete Milk' }));
      // findByRole (not getByRole): the first click arms the confirm state,
      // so wait for the re-rendered "Confirm delete" label rather than
      // racing the render (same pattern as TaskList.mutations.stories.tsx).
      await userEvent.click(await canvas.findByRole('button', { name: 'Confirm delete Milk' }));
      await waitFor(() => expect(canvas.queryByRole('button', { name: 'Edit Milk' })).toBeNull());
    });

    await step('It appears in Recently Deleted', async () => {
      await waitFor(() => {
        expect(canvas.getByRole('listitem', { name: 'Milk' })).toBeVisible();
      });
    });

    await step('Restore it and it returns to the list', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Restore Milk' }));
      await waitFor(() => {
        expect(canvas.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
      });
      await waitFor(() => expect(canvas.getByText('Milk')).toBeVisible());
    });
  },
};
