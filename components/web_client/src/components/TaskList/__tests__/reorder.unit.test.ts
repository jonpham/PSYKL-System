import { describe, expect, it } from 'vitest';

import type { Task } from '../../../api/client';
import { applyHandOrder, moveItem, targetIndexFor } from '../reorder';

function task(id: string, completedAt: string | null = null): Task {
  return {
    completed_at: completedAt,
    created_at: '2026-05-20T12:00:00.000Z',
    deleted_at: null,
    id,
    list_id: null,
    server_updated_at: '2026-05-20T12:00:00.500Z',
    title: id,
    updated_at: '2026-05-20T12:00:00.000Z',
    user_id: 'local',
  };
}

describe('moveItem (Unit)', () => {
  it('moves an item down to the requested index', () => {
    // Given
    const items = ['a', 'b', 'c'];

    // When
    const moved = moveItem(items, 0, 2);

    // Then
    expect(moved).toEqual(['b', 'c', 'a']);
  });

  it('moves an item up to the requested index', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the order alone when the item does not move', () => {
    const items = ['a', 'b', 'c'];

    expect(moveItem(items, 1, 1)).toEqual(items);
  });

  it('clamps an index past either end rather than dropping the item', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 9)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, -4)).toEqual(['c', 'a', 'b']);
  });
});

describe('targetIndexFor (Unit)', () => {
  it('reports the index whose row the pointer is currently over', () => {
    // Given three rows whose vertical midpoints are 10, 30, and 50
    const midpoints = [10, 30, 50];

    // When / Then
    expect(targetIndexFor(midpoints, 5)).toBe(0);
    expect(targetIndexFor(midpoints, 20)).toBe(1);
    expect(targetIndexFor(midpoints, 40)).toBe(2);
    expect(targetIndexFor(midpoints, 999)).toBe(2);
  });

  it('reports 0 when there is nothing to drag over', () => {
    expect(targetIndexFor([], 100)).toBe(0);
  });
});

describe('applyHandOrder (Unit)', () => {
  it('orders tasks by the hand order the user dragged them into', () => {
    // Given
    const tasks = [task('a'), task('b'), task('c')];

    // When
    const ordered = applyHandOrder(tasks, ['c', 'a', 'b']);

    // Then
    expect(ordered.map((entry) => entry.id)).toEqual(['c', 'a', 'b']);
  });

  it('keeps tasks the hand order has never seen in their incoming order, after the ones it has', () => {
    const tasks = [task('a'), task('new'), task('b')];

    expect(applyHandOrder(tasks, ['b', 'a']).map((entry) => entry.id)).toEqual(['b', 'a', 'new']);
  });

  it('ignores ids in the hand order that are no longer in the list', () => {
    const tasks = [task('a'), task('b')];

    expect(applyHandOrder(tasks, ['gone', 'b', 'a']).map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it('returns the tasks untouched when no hand order exists yet', () => {
    const tasks = [task('a'), task('b')];

    expect(applyHandOrder(tasks, [])).toEqual(tasks);
  });
});
