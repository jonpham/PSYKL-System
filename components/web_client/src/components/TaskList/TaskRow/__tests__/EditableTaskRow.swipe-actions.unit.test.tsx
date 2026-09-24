import 'fake-indexeddb/auto';

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { listSyncQueue, listTasks, putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { EditableTaskRow } from '../EditableTaskRow';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const ROW_WIDTH = 390;
const RAIL_WIDTH = 176;

/** One sample per 100ms, which is roughly what a thumb on a phone produces.
 * Left to the real clock every synthetic gesture lands inside a millisecond
 * and reads as a flick fast enough to decide the outcome on its own. */
const SAMPLE_INTERVAL_MS = 100;
let clock = 0;

const baseTask: Task = {
  id: '01940000-0000-7000-8000-0000000000d1',
  user_id: 'local',
  title: 'walk the dog',
  created_at: '2026-06-01T09:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-01T09:00:00.000Z',
  server_updated_at: '2026-06-01T09:00:00.500Z',
  deleted_at: null,
  list_id: null,
};

/**
 * Every threshold in the row rail is a fraction of a measured width, and jsdom
 * measures everything as zero — which would make every swipe a full swipe. The
 * two widths the row reads are stubbed to the iPhone values the design targets.
 */
beforeEach(async () => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('psykl-task-row__rail') ? RAIL_WIDTH : ROW_WIDTH;
    },
  });
  clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  mockReplay.mockResolvedValue(undefined);
  await putTask(baseTask);
});

afterEach(async () => {
  vi.restoreAllMocks();
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB('psykl');
});

function pointer(type: string, target: EventTarget, x = 0, y = 0): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  });
}

/** A swipe leftwards across `distance` pixels, released at the end of it. */
function swipeLeft(distance: number): void {
  const surface = document.querySelector('.psykl-task-row__surface');
  if (!surface) throw new Error('the row has no swipe surface');
  pointer('pointerdown', surface, ROW_WIDTH, 40);
  clock += SAMPLE_INTERVAL_MS;
  pointer('pointermove', window, ROW_WIDTH - distance / 2, 40);
  clock += SAMPLE_INTERVAL_MS;
  pointer('pointermove', window, ROW_WIDTH - distance, 40);
  pointer('pointerup', window);
}

function row(): HTMLElement {
  return screen.getByRole('listitem');
}

describe('EditableTaskRow swipe actions (Unit)', () => {
  it('holds the row open on its actions after a swipe past the opening threshold', () => {
    // Arrange
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );

    // Act — a little over a quarter of the row
    swipeLeft(140);

    // Assert
    expect(row()).toHaveAttribute('data-swipe-open', 'true');
    expect(screen.getByRole('button', { name: /^details for walk the dog$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete walk the dog$/i })).toBeInTheDocument();
  });

  it('snaps back with nothing changed when the swipe stops short', async () => {
    // Arrange
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );

    // Act
    swipeLeft(60);

    // Assert
    expect(row()).toHaveAttribute('data-swipe-open', 'false');
    expect(await listTasks()).toEqual([expect.objectContaining({ deleted_at: null })]);
  });

  it('deletes the task outright on a full swipe', async () => {
    // Arrange
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );

    // Act — past 60% of the row
    swipeLeft(300);

    // Assert — the ordinary soft delete, queued for the server like any other
    await waitFor(async () => {
      expect(await listTasks()).toEqual([expect.objectContaining({ deleted_at: expect.any(String) })]);
    });
    const queue = await listSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ op: 'delete', entity_type: 'task', entity_id: baseTask.id });
  });

  it('deletes from the open rail in one press, because the swipe was the deliberate act', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );
    swipeLeft(140);

    // Act
    await user.click(screen.getByRole('button', { name: /^delete walk the dog$/i }));

    // Assert
    await waitFor(async () => {
      expect(await listTasks()).toEqual([expect.objectContaining({ deleted_at: expect.any(String) })]);
    });
  });

  it('opens the details drawer from the open rail, and closes the rail behind it', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );
    swipeLeft(140);

    // Act
    await user.click(screen.getByRole('button', { name: /^details for walk the dog$/i }));

    // Assert
    expect(screen.getByRole('dialog', { name: /task/i })).toBeInTheDocument();
    expect(row()).toHaveAttribute('data-swipe-open', 'false');
  });

  it('keeps the rail out of reach until it is open', () => {
    // Arrange
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );

    // Assert — inert, so its buttons are neither tabbable nor announced
    expect(document.querySelector('.psykl-task-row__rail')).toHaveAttribute('inert');

    // Act
    swipeLeft(140);

    // Assert
    expect(document.querySelector('.psykl-task-row__rail')).not.toHaveAttribute('inert');
  });

  it('covers the row it slid off, so a tap closes the rail rather than editing', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );
    swipeLeft(140);

    // Act
    await user.click(screen.getByRole('button', { name: /^close actions for walk the dog$/i }));

    // Assert
    expect(row()).toHaveAttribute('data-swipe-open', 'false');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
