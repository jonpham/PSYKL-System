import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { useState } from 'react';

import { ListSwitcher } from '../ListSwitcher';

/** Stateful wrapper — `ListSwitcher` itself is controlled, so the story owns
 * `open`/`activeListId` the way `App.tsx` does. */
function ListSwitcherHarness() {
  const [open, setOpen] = useState(true);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  return (
    <ListSwitcher
      activeListId={activeListId}
      onClose={() => setOpen(false)}
      onSelect={(listId) => {
        setActiveListId(listId);
        setOpen(false);
      }}
      open={open}
    />
  );
}

const meta: Meta<typeof ListSwitcherHarness> = {
  title: 'PSYKL/ListSwitcher',
  component: ListSwitcherHarness,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof ListSwitcherHarness>;

/**
 * Component-layer UI test: creates a list, renames it, and selects it.
 * `/lists` routes are stubbed through the default MSW handler set wired in
 * `.storybook/preview.ts` (msw-storybook-addon); `useLists` itself never
 * calls the network directly (it only writes to IndexedDB + the sync
 * queue), so this exercises the local-first path the same way
 * `useLists.unit.test.ts` does.
 */
export const CreatesRenamesAndSelectsAList: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('The default Tasks list is visible on open', async () => {
      await waitFor(() => {
        expect(canvas.getByRole('listitem', { name: 'Tasks' })).toBeVisible();
      });
    });

    await step('Create a new list', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'New List' }));
      await userEvent.type(canvas.getByLabelText('List name'), 'Groceries');
      await userEvent.click(canvas.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(canvas.getByRole('listitem', { name: 'Groceries' })).toBeVisible();
      });
    });

    await step('Rename the new list', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Rename Groceries' }));
      const renameInput = canvas.getByLabelText('Rename Groceries');
      await userEvent.clear(renameInput);
      await userEvent.type(renameInput, 'Weekly Groceries{Enter}');

      await waitFor(() => {
        expect(canvas.getByRole('listitem', { name: 'Weekly Groceries' })).toBeVisible();
      });
    });

    await step('Select the renamed list', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Weekly Groceries' }));

      // Selecting a list closes the sheet (the harness mirrors App.tsx).
      await waitFor(() => {
        expect(canvas.queryByRole('dialog', { name: 'List switcher' })).toBeNull();
      });
    });
  },
};

/** Idle render — useful for the Manual Visual Check surface. */
export const Open: Story = {};
