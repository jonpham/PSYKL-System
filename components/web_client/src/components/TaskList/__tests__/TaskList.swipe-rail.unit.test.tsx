import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({
  useTasks: mockUseTasks,
}));
vi.mock('../../../hooks/useCompletedVisibility', () => ({
  useCompletedVisibility: () => ({ setShowCompleted: () => {}, showCompleted: true }),
}));
vi.mock('../../../hooks/useSyncDiscrepancy', () => ({
  useSyncDiscrepancy: () => ({ count: 0, level: 'ok' }),
}));

const ROW_WIDTH = 390;
const RAIL_WIDTH = 176;

/** See the row's own swipe suite: without a controlled clock every synthetic
 * gesture lands inside a millisecond and reads as a flick. */
const SAMPLE_INTERVAL_MS = 100;
let clock = 0;

function task(id: string): Task {
  return {
    completed_at: null,
    created_at: `2026-06-01T09:0${id}:00.000Z`,
    deleted_at: null,
    id,
    list_id: null,
    server_updated_at: '2026-06-01T09:00:00.500Z',
    title: id,
    updated_at: '2026-06-01T09:00:00.000Z',
    user_id: 'local',
  };
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('psykl-task-row__rail') ? RAIL_WIDTH : ROW_WIDTH;
    },
  });
  clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  mockUseTasks.mockReset();
  mockUseTasks.mockReturnValue({
    createTask: vi.fn(),
    deleteTask: vi.fn(),
    error: null,
    loading: false,
    patchTask: vi.fn(),
    tasks: [task('1'), task('2')],
  });
});

function pointer(type: string, target: EventTarget, x = 0, y = 0): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  });
}

function swipeOpen(rowLabel: string): void {
  const surface = screen.getByRole('listitem', { name: rowLabel }).querySelector('.psykl-task-row__surface');
  if (!surface) throw new Error(`no swipe surface on ${rowLabel}`);
  pointer('pointerdown', surface, ROW_WIDTH, 40);
  clock += SAMPLE_INTERVAL_MS;
  pointer('pointermove', window, ROW_WIDTH - 70, 40);
  clock += SAMPLE_INTERVAL_MS;
  pointer('pointermove', window, ROW_WIDTH - 140, 40);
  pointer('pointerup', window);
}

function openRows(): string[] {
  return screen
    .getAllByRole('listitem')
    .filter((row) => row.getAttribute('data-swipe-open') === 'true')
    .map((row) => row.getAttribute('aria-label') ?? '');
}

describe('TaskList swipe rail coordination (Unit)', () => {
  it('holds one row open at a time, so a second swipe closes the first', () => {
    // Arrange
    render(<TaskList />);

    // Act
    swipeOpen('1');
    swipeOpen('2');

    // Assert
    expect(openRows()).toEqual(['2']);
  });

  it('closes the open row when the list is scrolled away from it', () => {
    // Arrange
    render(<TaskList />);
    swipeOpen('1');
    expect(openRows()).toEqual(['1']);

    // Act
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    // Assert
    expect(openRows()).toEqual([]);
  });

  it('closes the open row when the list enters selection mode', () => {
    // Arrange
    const { rerender } = render(<TaskList />);
    swipeOpen('1');

    // Act
    rerender(<TaskList selecting />);

    // Assert — selection rows carry a drag handle in that column, not a rail
    expect(document.querySelector('.psykl-task-row__rail')).toBeNull();
    rerender(<TaskList />);
    expect(openRows()).toEqual([]);
  });
});
