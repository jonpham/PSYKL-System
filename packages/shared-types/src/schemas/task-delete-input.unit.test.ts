import { describe, expect, it } from 'vitest';
import { TaskDeleteInputSchema } from './task';

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

  it('rejects deleted_at that differs from updated_at', () => {
    expect(() =>
      TaskDeleteInputSchema.parse({
        deleted_at: '2026-05-20T12:00:00.000Z',
        updated_at: '2026-05-20T12:05:00.000Z',
      }),
    ).toThrow();
  });
});
