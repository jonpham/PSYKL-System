import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { TaskCreateForm } from './TaskCreateForm';

const meta: Meta<typeof TaskCreateForm> = {
  title: 'PSYKL/TaskCreateForm',
  component: TaskCreateForm,
  args: {
    onCreated: fn(),
  },
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
 *  1. `onCreated` is invoked exactly once with a Task matching the typed title.
 *  2. The input clears after a successful create (so the form is ready for the
 *     next entry).
 */
export const CreatesTaskOnSubmit: Story = {
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByRole('textbox', { name: /title/i }) as HTMLInputElement;
    const submit = canvas.getByRole('button', { name: /create/i });

    await step('Type a title and submit', async () => {
      await userEvent.type(input, 'integration test');
      await userEvent.click(submit);
    });

    await step('onCreated fires once with the new Task', async () => {
      await waitFor(() => expect(args.onCreated).toHaveBeenCalledTimes(1));
      const created = (args.onCreated as ReturnType<typeof fn>).mock.calls[0]?.[0];
      expect(created).toMatchObject({
        title: 'integration test',
        user_id: 'local',
      });
    });

    await step('Input clears after a successful create', async () => {
      await waitFor(() => expect(input.value).toBe(''));
    });
  },
};

/** Idle render — useful for the Manual Visual Check surface. */
export const Empty: Story = {};
