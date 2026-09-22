import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { ListsPage } from '../ListsPage';

const meta: Meta<typeof ListsPage> = {
  title: 'PSYKL/ListsPage',
  component: ListsPage,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof ListsPage>;

/**
 * Drives the page the way a user does: name a new list, commit it with Return,
 * then move it up past the default list. `useLists` talks to the real hook, so
 * the re-order proves the neighbour arithmetic lands the moved list first.
 */
export const CreateThenReorder: Story = {
  args: { creating: true },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const input = await canvas.findByLabelText('New list name');

    // Act — name it and commit
    await userEvent.type(input, 'Groceries{Enter}');

    // Assert — the list joins the page below the default one
    const groceries = await canvas.findByRole('button', { name: 'Groceries' });
    await expect(groceries).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Move Groceries down' })).toBeDisabled();

    // Act — move it above the default list
    await userEvent.click(canvas.getByRole('button', { name: 'Move Groceries up' }));

    // Assert — it is now first, so it can no longer move up
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Move Groceries up' })).toBeDisabled();
    });
  },
};
