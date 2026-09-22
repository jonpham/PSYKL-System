import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Ordering',
  component: TaskList,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    user_id: 'local',
    title: id,
    created_at: '2026-05-27T10:00:00Z',
    completed_at: null,
    updated_at: '2026-05-27T10:00:00Z',
    server_updated_at: '2026-05-27T10:00:00.500Z',
    deleted_at: null,
    list_id: null,
    ...overrides,
  };
}

const longTitle = 'plan the summer trip along the whole coast and back again before the weather turns';

/**
 * The hook hands tasks back newest-first; the list re-sorts so open tasks read
 * oldest-first and completed ones sink below them.
 */
export const CompletedSinkBelowOpen: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/tasks', () =>
          HttpResponse.json([
            task('done', { completed_at: '2026-05-27T13:00:00Z' }),
            task('newer', { created_at: '2026-05-27T12:00:00Z' }),
            task('older', { created_at: '2026-05-27T11:00:00Z' }),
          ]),
        ),
      ],
    },
  },
  render: () => <TaskList />,
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    await canvas.findByRole('listitem', { name: 'older' });

    // Assert
    const order = canvas.getAllByRole('listitem').map((row) => row.getAttribute('aria-label'));
    await expect(order).toEqual(['older', 'newer', 'done']);
  },
};

/** A title too long for one line wraps; the row grows rather than clipping it. */
export const LongTitleWraps: Story = {
  parameters: {
    msw: {
      handlers: [http.get('*/tasks', () => HttpResponse.json([task('long', { title: longTitle })]))],
    },
  },
  // The shell caps the content column; at Storybook's unbounded width nothing
  // would ever need to wrap.
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  render: () => <TaskList />,
  play: async ({ canvasElement }) => {
    // Arrange
    const row = await within(canvasElement).findByRole('listitem', { name: longTitle });

    // Assert — taller than a single-line row, with the whole title present
    await expect(row.getBoundingClientRect().height).toBeGreaterThan(44);
    await expect(within(row).getByRole('button', { name: `Edit ${longTitle}` })).toHaveTextContent(longTitle);
  },
};
