import { describe, expect, it } from 'vitest';

import { ListRestoreInputSchema } from './list';

describe('ListRestoreInputSchema', () => {
  it('accepts updated_at', () => {
    const valid = { updated_at: '2026-05-20T12:00:00.000Z' };
    expect(ListRestoreInputSchema.parse(valid)).toEqual(valid);
  });

  it('rejects missing updated_at', () => {
    expect(() => ListRestoreInputSchema.parse({})).toThrow();
  });

  it('rejects unknown fields', () => {
    expect(() =>
      ListRestoreInputSchema.parse({
        updated_at: '2026-05-20T12:00:00.000Z',
        deleted_at: '2026-05-20T12:00:00.000Z',
      }),
    ).toThrow();
  });
});
