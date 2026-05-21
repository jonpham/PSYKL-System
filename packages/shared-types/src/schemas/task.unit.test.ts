import { describe, expect, it } from 'vitest';
import { TaskInputSchema, TaskResponseSchema, TaskSchema } from './task';

describe('TaskSchema', () => {
  it('accepts a valid Task record', () => {
    const valid = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: 'first task',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    const parsed = TaskSchema.parse(valid);
    expect(parsed).toEqual(valid);
  });

  it('rejects a Task with empty title', () => {
    const bad = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: '',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task with title >200 chars', () => {
    const bad = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: 'x'.repeat(201),
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });

  it('rejects a Task missing user_id', () => {
    const bad = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      title: 'no user',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(() => TaskSchema.parse(bad)).toThrow();
  });
});

describe('TaskInputSchema', () => {
  it('accepts a request body with only title', () => {
    const valid = { title: 'incoming task' };
    const parsed = TaskInputSchema.parse(valid);
    expect(parsed.title).toBe('incoming task');
  });

  it('rejects a request body missing title', () => {
    expect(() => TaskInputSchema.parse({})).toThrow();
  });

  it('rejects a request body with extra fields', () => {
    const bad = { title: 'x', user_id: 'spoofed' };
    expect(() => TaskInputSchema.parse(bad)).toThrow();
  });
});

describe('TaskResponseSchema', () => {
  it('is identical in shape to TaskSchema', () => {
    const valid = {
      id: '0193e1c0-1234-7000-8000-000000000000',
      user_id: 'local',
      title: 'response shape',
      created_at: '2026-05-20T12:00:00.000Z',
    };
    expect(TaskResponseSchema.parse(valid)).toEqual(TaskSchema.parse(valid));
  });
});
