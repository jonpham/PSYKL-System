import '../../../styles/tokens.css';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { http, HttpResponse } from 'msw';

import type { Task } from '../../../api/client';
import App from '../../../App';
import { listHandlers } from '../../../test/msw-handlers.lists';
import { TaskList } from '../TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'PSYKL/TaskList Swipe Actions',
  component: TaskList,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof TaskList>;

function task(idSuffix: string, title: string): Task {
  return {
    completed_at: null,
    created_at: `2026-06-01T09:00:${idSuffix}.000Z`,
    deleted_at: null,
    id: `01940000-0000-7000-8000-0000000000${idSuffix}`,
    list_id: null,
    server_updated_at: '2026-06-02T11:30:00.500Z',
    title,
    updated_at: '2026-06-02T11:30:00.000Z',
    user_id: 'local',
  };
}

function handlersFor(seeded: Task[]) {
  return [http.get('*/tasks', () => HttpResponse.json(seeded)), ...listHandlers];
}

const swiped = task('91', 'book the dentist');
const neighbour = task('92', 'pick up the dry cleaning');
const editing = task('93', 'reply to the landlord');
const bystander = task('94', 'order more coffee');

function rowFor(canvasElement: HTMLElement, seeded: Task): HTMLElement {
  const row = canvasElement.querySelector<HTMLElement>(`[data-task-id="${seeded.id}"]`);
  if (!row) throw new Error(`no row for ${seeded.title}`);
  return row;
}

/**
 * A thumb's swipe as the browser reports it: pointer events at roughly a
 * frame apart, slow enough that the release is judged on distance rather than
 * read as a flick. `fraction` is of the row's own width, so the story holds at
 * whatever width Storybook renders it.
 */
async function swipeLeft(row: HTMLElement, fraction: number): Promise<void> {
  const surface = row.querySelector('.psykl-task-row__surface');
  if (!surface) throw new Error('the row has no swipe surface');
  const box = row.getBoundingClientRect();
  const y = box.top + box.height / 2;
  const startX = box.right - 8;
  const init = { bubbles: true, clientY: y, isPrimary: true, pointerId: 1, pointerType: 'touch' };
  surface.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: startX }));
  for (let travelled = 10; travelled <= box.width * fraction; travelled += 10) {
    window.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: startX - travelled }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  window.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: startX - box.width * fraction }));
}

/**
 * A swipe past a quarter of the row holds it open on Details and Delete, each
 * its own rounded box, with the row itself framed — a grey boundary around a
 * rounded white box — so its edges stay legible. The row beside it is
 * untouched.
 */
export const RailOpenOnAFramedRow: Story = {
  parameters: { msw: { handlers: handlersFor([swiped, neighbour]) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByRole('button', { name: `Edit ${swiped.title}` });
    const row = rowFor(canvasElement, swiped);

    // Act
    await swipeLeft(row, 0.4);

    // Assert
    const remove = await canvas.findByRole('button', { name: `Delete ${swiped.title}` });
    await expect(canvas.getByRole('button', { name: `Details for ${swiped.title}` })).toBeVisible();
    await expect(getComputedStyle(remove).borderRadius).toBe('10px');
    await expect(row).toHaveAttribute('data-focused', 'true');
    await expect(getComputedStyle(row).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    const surface = row.querySelector('.psykl-task-row__surface') as HTMLElement;
    await expect(getComputedStyle(surface).borderRadius).toBe('10px');
    const other = rowFor(canvasElement, neighbour);
    await expect(other).toHaveAttribute('data-focused', 'false');
    await expect(getComputedStyle(other).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  },
};

/**
 * The frame appears for an edit too — tapping a title is the other way a user
 * starts acting on one task — and it grows outward, so the title under the
 * user's finger does not move.
 */
export const FramedWhileEditing: Story = {
  parameters: { msw: { handlers: handlersFor([editing, bystander]) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    const title = await canvas.findByRole('button', { name: `Edit ${editing.title}` });
    const before = title.getBoundingClientRect();

    // Act
    await userEvent.click(title);

    // Assert
    const row = rowFor(canvasElement, editing);
    await expect(row).toHaveAttribute('data-focused', 'true');
    const field = await canvas.findByRole('textbox', { name: 'Edit title' });
    const after = field.getBoundingClientRect();
    await expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(1);
    await expect(rowFor(canvasElement, bystander)).toHaveAttribute('data-focused', 'false');
  },
};

/** The space below the last row starts a task, as the (+) does. */
export const EmptySpaceStartsATask: Story = {
  parameters: { msw: { handlers: handlersFor([]) } },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Arrange
    await canvas.findByText('Nothing to do yet.');
    const space = canvasElement.querySelector('.psykl-task-list__empty-space') as HTMLElement;

    // Act
    await userEvent.click(space);

    // Assert
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'New task title' })).toBeVisible());
  },
};
