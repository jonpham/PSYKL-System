import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { listTasks } from '../../../db/idb';
import { TaskCreateForm } from '../TaskCreateForm';

const meta: Meta<typeof TaskCreateForm> = {
  title: 'PSYKL/TaskCreateForm',
  component: TaskCreateForm,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof TaskCreateForm>;

/**
 * Component-layer UI test (replaces the retired Vitest
 * TaskCreateForm.component.test.tsx). The play function types a title, clicks
 * Create, awaits the MSW-stubbed POST /tasks success path, and asserts:
 *
 *  1. The returned Task is persisted in IndexedDB.
 *  2. The input clears after a successful create (so the form is ready for the
 *     next entry).
 */
export const CreatesTaskOnSubmit: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByRole('textbox', { name: /title/i }) as HTMLInputElement;
    const submit = canvas.getByRole('button', { name: /create/i });

    await step('Type a title and submit', async () => {
      await userEvent.type(input, 'integration test');
      await userEvent.click(submit);
    });

    await step('Created Task is persisted locally', async () => {
      await waitFor(async () => {
        expect(await listTasks()).toEqual([
          expect.objectContaining({
            title: 'integration test',
            user_id: 'local',
          }),
        ]);
      });
    });

    await step('Input clears after a successful create', async () => {
      await waitFor(() => expect(input.value).toBe(''));
    });
  },
};

/** Idle render — useful for the Manual Visual Check surface. */
export const Empty: Story = {};
