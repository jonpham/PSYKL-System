import { describe, expect, it } from 'vitest';

import { NAG_THRESHOLD, syncPressureLevel, WRITE_CEILING } from '../sync-pressure';

describe('syncPressureLevel', () => {
  it('is ok below the nag threshold', () => {
    // Given/When/Then: 24 queued changes, one below the nag threshold
    expect(syncPressureLevel(NAG_THRESHOLD - 1)).toBe('ok');
  });

  it('is nag at the nag threshold', () => {
    expect(syncPressureLevel(NAG_THRESHOLD)).toBe('nag');
  });

  it('is nag just below the ceiling', () => {
    expect(syncPressureLevel(WRITE_CEILING - 1)).toBe('nag');
  });

  it('is ceiling at the write ceiling', () => {
    expect(syncPressureLevel(WRITE_CEILING)).toBe('ceiling');
  });
});
