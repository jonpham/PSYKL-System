import 'fake-indexeddb/auto';

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { EditableTaskRow } from '../EditableTaskRow';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const ROW_WIDTH = 390;
const RAIL_WIDTH = 176;

const baseTask: Task = {
  id: '01940000-0000-7000-8000-0000000000e1',
  user_id: 'local',
  title: 'walk the dog',
  created_at: '2026-06-01T09:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-01T09:00:00.000Z',
  server_updated_at: '2026-06-01T09:00:00.500Z',
  deleted_at: null,
  list_id: null,
};

beforeEach(async () => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('psykl-task-row__rail') ? RAIL_WIDTH : ROW_WIDTH;
    },
  });
  mockReplay.mockResolvedValue(undefined);
  await putTask(baseTask);
});

afterEach(async () => {
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB('psykl');
});

function pointer(type: string, target: EventTarget, x = 0): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 40 }));
  });
}

function surface(): Element {
  const found = document.querySelector('.psykl-task-row__surface');
  if (!found) throw new Error('the row has no swipe surface');
  return found;
}

function renderRow() {
  render(
    <ul>
      <EditableTaskRow task={baseTask} />
    </ul>,
  );
  return screen.getByRole('listitem');
}

/**
 * A row the user is acting on is framed — a grey boundary with the task as a
 * rounded box inside it — so its edges are legible while it moves. Every other
 * row renders exactly as it did.
 */
describe('EditableTaskRow focus frame (Unit)', () => {
  it('leaves a row at rest unframed', () => {
    // Arrange / Act
    const row = renderRow();

    // Assert
    expect(row).toHaveAttribute('data-focused', 'false');
  });

  it('frames the row whose title is being edited', async () => {
    // Arrange
    const user = userEvent.setup();
    const row = renderRow();

    // Act
    await user.click(screen.getByRole('button', { name: /^edit walk the dog$/i }));

    // Assert
    expect(row).toHaveAttribute('data-focused', 'true');
  });

  it('frames the row under a finger mid-swipe', () => {
    // Arrange
    const row = renderRow();

    // Act — no release: the finger is still down
    pointer('pointerdown', surface(), ROW_WIDTH);
    pointer('pointermove', window, ROW_WIDTH - 60);

    // Assert
    expect(row).toHaveAttribute('data-focused', 'true');
  });

  it('measures the row once per swipe, not on every move', () => {
    // Arrange — a width read after the surface moves forces the browser to lay
    // the page out again, so a read per move is a layout per frame
    const reads = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get(this: HTMLElement) {
        reads();
        return this.classList.contains('psykl-task-row__rail') ? RAIL_WIDTH : ROW_WIDTH;
      },
    });
    renderRow();

    // Act — twelve moves
    pointer('pointerdown', surface(), ROW_WIDTH);
    for (let step = 1; step <= 12; step += 1) pointer('pointermove', window, ROW_WIDTH - step * 5);

    // Assert — the rail and the row, once each
    expect(reads.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('keeps the frame while the rail is held open, and drops it once it closes', async () => {
    // Arrange
    const user = userEvent.setup();
    const row = renderRow();
    pointer('pointerdown', surface(), ROW_WIDTH);
    pointer('pointermove', window, ROW_WIDTH - 140);
    pointer('pointerup', window);
    expect(row).toHaveAttribute('data-focused', 'true');

    // Act
    await user.click(screen.getByRole('button', { name: /^close actions for walk the dog$/i }));

    // Assert
    expect(row).toHaveAttribute('data-focused', 'false');
  });
});
