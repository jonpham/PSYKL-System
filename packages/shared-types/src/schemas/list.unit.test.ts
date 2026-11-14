import { describe, expect, it } from 'vitest';

import { DEFAULT_LIST_ID, DEFAULT_LIST_TITLE, ListInputSchema } from './list';

const valid = {
  id: '018f0000-0000-7000-8000-000000000001',
  title: 'Groceries',
  position: 'a0',
  updated_at: '2026-08-18T10:00:00.000Z',
};

describe('ListInputSchema', () => {
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

  it('accepts a list input without a position, for the server to assign', () => {
    const withoutPosition = { id: valid.id, title: valid.title, updated_at: valid.updated_at };
    expect(ListInputSchema.parse(withoutPosition)).toEqual(withoutPosition);
  });

  it('still rejects an empty position', () => {
    expect(() => ListInputSchema.parse({ ...valid, position: '' })).toThrow();
  });
});

describe('default list', () => {
  it('has an id every create accepts, matching the PWA', () => {
    const parsed = ListInputSchema.parse({
      id: DEFAULT_LIST_ID,
      title: DEFAULT_LIST_TITLE,
      updated_at: valid.updated_at,
    });
    expect(parsed.id).toBe('00000000-0000-7000-8000-000000000001');
  });
});
