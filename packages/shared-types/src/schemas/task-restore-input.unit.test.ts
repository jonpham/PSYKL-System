import { describe, expect, it } from 'vitest';

import { TaskRestoreInputSchema } from './task';

describe('TaskRestoreInputSchema', () => {
  it('accepts updated_at', () => {
    const valid = { updated_at: '2026-05-20T12:00:00.000Z' };
    expect(TaskRestoreInputSchema.parse(valid)).toEqual(valid);
  });

  it('rejects missing updated_at', () => {
    expect(() => TaskRestoreInputSchema.parse({})).toThrow();
  });

  it('rejects unknown fields', () => {
    expect(() =>
      TaskRestoreInputSchema.parse({
        updated_at: '2026-05-20T12:00:00.000Z',
        deleted_at: '2026-05-20T12:00:00.000Z',
      }),
    ).toThrow();
  });
});
