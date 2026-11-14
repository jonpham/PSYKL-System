import { describe, expect, it } from 'vitest';

import { DEFAULT_LIST_ID, isDefaultList } from '../default-list';

describe('isDefaultList', () => {
  it('recognises the default list by its fixed id', () => {
    expect(isDefaultList('00000000-0000-7000-8000-000000000001')).toBe(true);
    expect(DEFAULT_LIST_ID).toBe('00000000-0000-7000-8000-000000000001');
  });

  it('does not treat any other list as the default', () => {
    expect(isDefaultList('0199aaaa-0000-7000-8000-000000000001')).toBe(false);
  });
});
