import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { useState } from 'react';

import { ListMenu } from '../ListMenu';

const meta: Meta<typeof ListMenu> = {
  title: 'PSYKL/ListMenu',
  component: ListMenu,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof ListMenu>;

/** Hiding completed tasks and showing them again, driven through the menu. */
export const HideThenShowCompleted: Story = {
  render: function Render() {
    const [showCompleted, setShowCompleted] = useState(true);
    return (
      <div>
        <ListMenu
          canDelete
          completedCount={2}
          onRequestDeleteList={fn()}
          onToggleCompleted={setShowCompleted}
          showCompleted={showCompleted}
        />
        <p>{showCompleted ? 'completed shown' : 'completed hidden'}</p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'List options' });

    // Act — hide them
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Hide Completed' }));

    // Assert
    await expect(canvas.getByText('completed hidden')).toBeInTheDocument();

    // Act — bring them back, now labelled with how many are waiting
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Show Completed (2)' }));

    // Assert
    await expect(canvas.getByText('completed shown')).toBeInTheDocument();
  },
};
