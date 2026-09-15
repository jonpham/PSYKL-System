import { describe, expect, it } from 'vitest';

import { DeletedResponseSchema } from './list';

describe('DeletedResponseSchema', () => {
  it('accepts empty lists and tasks arrays', () => {
    expect(DeletedResponseSchema.parse({ lists: [], tasks: [] })).toEqual({ lists: [], tasks: [] });
  });

  it('rejects a missing tasks field', () => {
    expect(() => DeletedResponseSchema.parse({ lists: [] })).toThrow();
  });
});
