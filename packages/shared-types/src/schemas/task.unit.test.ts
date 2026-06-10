import { describe, expect, it } from 'vitest';
import { TaskDeleteInputSchema, TaskInputSchema, TaskPatchInputSchema, TaskResponseSchema, TaskSchema } from './task';

const uuidV7 = '0193e1c0-1234-7000-8000-000000000000';
const uuidV4 = '0193e1c0-1234-4000-8000-000000000000';

const validTask = {
  id: uuidV7,
  user_id: 'local',
  title: 'first task',
  created_at: '2026-05-20T12:00:00.000Z',
  completed_at: null,
  updated_at: '2026-05-20T12:00:00.000Z',
  server_updated_at: '2026-05-20T12:00:00.500Z',
  deleted_at: null,
};

describe('TaskSchema', () => {
  it('accepts a valid Task record', () => {
    const parsed = TaskSchema.parse(validTask);
    expect(parsed).toEqual(validTask);
  });

  it('accepts completed and tombstoned Task timestamps', () => {
    const valid = {
      ...validTask,
      completed_at: '2026-05-20T13:00:00.000Z',
      deleted_at: '2026-05-20T14:00:00.000Z',
    };

    expect(TaskSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a Task with empty title', () => {
    const bad = {
      ...validTask,
      title: '',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task with title >200 chars', () => {
    const bad = {
      ...validTask,
      title: 'x'.repeat(201),
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task missing user_id', () => {
    const bad = {
      ...validTask,
      user_id: undefined,
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task missing updated_at', () => {
    const bad = {
      ...validTask,
      updated_at: undefined,
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task with a non-v7 UUID id', () => {
    const bad = {
      ...validTask,
      id: uuidV4,
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });
});

describe('TaskInputSchema', () => {
  it('accepts a request body with client-supplied UUID v7 id, title, and updated_at', () => {
    const valid = {
      id: uuidV7,
      title: 'incoming task',
      updated_at: '2026-05-20T12:00:00.000Z',
    };
    const parsed = TaskInputSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it('rejects a request body missing client-supplied id', () => {
    expect(() => TaskInputSchema.parse({ title: 'incoming task', updated_at: '2026-05-20T12:00:00.000Z' })).toThrow();
  });

  it('rejects a request body with a non-v7 UUID id', () => {
    expect(() =>
      TaskInputSchema.parse({ id: uuidV4, title: 'incoming task', updated_at: '2026-05-20T12:00:00.000Z' }),
    ).toThrow();
  });

  it('rejects a request body missing updated_at', () => {
    expect(() => TaskInputSchema.parse({ id: uuidV7, title: 'incoming task' })).toThrow();
  });

  it('rejects a request body missing title', () => {
    expect(() => TaskInputSchema.parse({ id: uuidV7, updated_at: '2026-05-20T12:00:00.000Z' })).toThrow();
  });

  it('rejects a request body with extra fields', () => {
    const bad = { id: uuidV7, title: 'x', updated_at: '2026-05-20T12:00:00.000Z', user_id: 'spoofed' };
    expect(() => TaskInputSchema.parse(bad)).toThrow();
  });
});

describe('TaskPatchInputSchema', () => {
  it('accepts a title update with updated_at', () => {
    const valid = {
      title: 'no user',
      updated_at: '2026-05-20T12:00:00.000Z',
    };
    expect(TaskPatchInputSchema.parse(valid)).toEqual(valid);
  });

  it('accepts complete and uncomplete updates', () => {
    expect(
      TaskPatchInputSchema.parse({ completed_at: '2026-05-20T12:00:00.000Z', updated_at: '2026-05-20T12:00:00.000Z' }),
    ).toEqual({
      completed_at: '2026-05-20T12:00:00.000Z',
      updated_at: '2026-05-20T12:00:00.000Z',
    });
    expect(TaskPatchInputSchema.parse({ completed_at: null, updated_at: '2026-05-20T12:00:00.000Z' })).toEqual({
      completed_at: null,
      updated_at: '2026-05-20T12:00:00.000Z',
    });
  });

  it('rejects an update missing updated_at', () => {
    expect(() => TaskPatchInputSchema.parse({ title: 'missing timestamp' })).toThrow();
  });

  it('rejects an update with no patch fields', () => {
    expect(() => TaskPatchInputSchema.parse({ updated_at: '2026-05-20T12:00:00.000Z' })).toThrow();
  });

  it('rejects deleted_at because deletes use TaskDeleteInputSchema', () => {
    expect(() =>
      TaskPatchInputSchema.parse({ deleted_at: '2026-05-20T12:00:00.000Z', updated_at: '2026-05-20T12:00:00.000Z' }),
    ).toThrow();
  });
});

describe('TaskDeleteInputSchema', () => {
  it('accepts deleted_at and updated_at', () => {
    const valid = {
      deleted_at: '2026-05-20T12:00:00.000Z',
      updated_at: '2026-05-20T12:00:00.000Z',
    };
    expect(TaskDeleteInputSchema.parse(valid)).toEqual(valid);
  });

  it('rejects missing deleted_at', () => {
    expect(() => TaskDeleteInputSchema.parse({ updated_at: '2026-05-20T12:00:00.000Z' })).toThrow();
  });

  it('rejects missing updated_at', () => {
    expect(() => TaskDeleteInputSchema.parse({ deleted_at: '2026-05-20T12:00:00.000Z' })).toThrow();
  });
});

describe('TaskResponseSchema', () => {
  it('is identical in shape to TaskSchema', () => {
    const valid = { ...validTask, title: 'response shape' };
    expect(TaskResponseSchema.parse(valid)).toEqual(TaskSchema.parse(valid));
  });
});
