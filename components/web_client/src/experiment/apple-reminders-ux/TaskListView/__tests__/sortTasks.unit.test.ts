import { describe, expect, it } from 'vitest';

import type { Task } from '../../../../api/client';
import { sortTasks } from '../sortTasks';

function task(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    completed_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
    list_id: 'list-1',
    server_updated_at: '2026-01-01T00:00:00.000Z',
    title: overrides.id,
    updated_at: '2026-01-01T00:00:00.000Z',
    user_id: 'local',
    ...overrides,
  };
}

describe('sortTasks', () => {
  it('puts open tasks oldest-first so new ones append at the bottom', () => {
    // Given the newest-first order the tasks hook returns
    const tasks = [
      task({ id: 'c', created_at: '2026-03-01T00:00:00.000Z' }),
      task({ id: 'b', created_at: '2026-02-01T00:00:00.000Z' }),
      task({ id: 'a', created_at: '2026-01-01T00:00:00.000Z' }),
    ];

    // When
    const sorted = sortTasks(tasks);

    // Then
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });

  it('sinks completed tasks below every open task, most recently completed first', () => {
    // Given
    const tasks = [
      task({ id: 'done-old', completed_at: '2026-04-01T00:00:00.000Z' }),
      task({ id: 'open', created_at: '2026-02-01T00:00:00.000Z' }),
      task({ id: 'done-new', completed_at: '2026-05-01T00:00:00.000Z' }),
    ];

    // When
    const sorted = sortTasks(tasks);

    // Then
    expect(sorted.map((entry) => entry.id)).toEqual(['open', 'done-new', 'done-old']);
  });

  it('leaves the caller array untouched', () => {
    // Given
    const tasks = [task({ id: 'b', created_at: '2026-02-01T00:00:00.000Z' }), task({ id: 'a' })];

    // When
    sortTasks(tasks);

    // Then
    expect(tasks.map((entry) => entry.id)).toEqual(['b', 'a']);
  });
});
