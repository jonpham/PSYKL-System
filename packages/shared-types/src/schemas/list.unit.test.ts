import { describe, expect, it } from 'vitest';

import { ListInputSchema } from './list';

describe('ListInputSchema', () => {
  const valid = {
    id: '018f0000-0000-7000-8000-000000000001',
    title: 'Groceries',
    position: 'a0',
    updated_at: '2026-08-18T10:00:00.000Z',
  };

  it('accepts a well-formed list input', () => {
    expect(ListInputSchema.parse(valid)).toEqual(valid);
  });

  it('rejects a blank title', () => {
    expect(() => ListInputSchema.parse({ ...valid, title: '' })).toThrow();
  });

  it('rejects a non-v7 id', () => {
    expect(() => ListInputSchema.parse({ ...valid, id: 'not-a-uuid' })).toThrow();
  });

  it('rejects an unknown key', () => {
    expect(() => ListInputSchema.parse({ ...valid, colour: 'red' })).toThrow();
  });
});
