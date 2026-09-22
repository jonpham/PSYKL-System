import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Capture',
  component: TaskList,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

function created(title: string): Task {
  return {
    id: '01940000-0000-7000-8000-0000000000c1',
    user_id: 'local',
    title,
    created_at: '2026-05-27T10:00:00Z',
    completed_at: null,
    updated_at: '2026-05-27T10:00:00Z',
    server_updated_at: '2026-05-27T10:00:00.500Z',
    deleted_at: null,
    list_id: null,
  };
}

/**
 * The regression this guards is real-browser paint timing: with `autoFocus` the
 * input takes focus after paint, so characters typed in that window land on the
 * add button and are lost — "Book dentist" arrived as "k dentist". jsdom focuses
 * synchronously and cannot tell the two apart, so the guard has to live here.
 */
export const TypingStartsImmediately: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/tasks', () => HttpResponse.json([])),
        http.post('*/tasks', async ({ request }) => HttpResponse.json(created(((await request.json()) as Task).title))),
      ],
    },
  },
  render: () => <TaskList />,
  play: async ({ canvasElement }) => {
    // Arrange
    const canvas = within(canvasElement);
    const add = await canvas.findByRole('button', { name: 'New Task' });

    // Act — no wait between opening the row and typing into it
    await userEvent.click(add);
    await userEvent.keyboard('Book dentist');

    // Assert — every character landed, not just the ones after the paint
    await expect(canvas.getByRole('textbox', { name: 'New task title' })).toHaveValue('Book dentist');
  },
};

/* A failed save is not reachable through the network here: `createTask` queues
 * the write offline-first rather than throwing, so the row commits and clears.
 * The refusal path is the write ceiling, covered by e2e/offline_pressure, and
 * the rejecting-onCreate branch by CaptureRow's unit test. */
