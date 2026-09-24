import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';

import { DeleteListDialog } from '../DeleteListDialog';

const meta: Meta<typeof DeleteListDialog> = {
  title: 'PSYKL/DeleteListDialog',
  component: DeleteListDialog,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof DeleteListDialog>;

/**
 * A list that still holds tasks gets the full question: both outcomes, in red,
 * with Cancel holding the focus so no destructive option is one keypress away.
 */
export const ChoosingWhatHappensToTheItems: Story = {
  args: { itemCount: 4, listTitle: 'Groceries', onCancel: fn(), onDelete: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await expect(canvas.getByRole('dialog', { name: 'Delete "Groceries"?' })).toBeInTheDocument();
    await expect(canvas.getByText('It still holds 4 items.')).toBeVisible();
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Delete With Items' }));

    // Assert
    await expect(args.onDelete).toHaveBeenCalledWith('with-items');
  },
};

/** Nothing inside: both outcomes are the same, so only one is offered. */
export const AnEmptyListHasNoChoiceToMake: Story = {
  args: { itemCount: 0, listTitle: 'Errands', onCancel: fn(), onDelete: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await expect(canvas.queryByRole('button', { name: 'Delete With Items' })).not.toBeInTheDocument();

    // Act
    await userEvent.click(canvas.getByRole('button', { name: 'Delete List' }));

    // Assert
    await expect(args.onDelete).toHaveBeenCalledWith('just-list');
  },
};

import '../../../styles/tokens.css';
