import { describe, expect, it } from 'vitest';

import { NAG_THRESHOLD, syncDiscrepancyLevel, WRITE_CEILING } from '../sync-discrepancy';

describe('syncDiscrepancyLevel', () => {
  it('is ok below the nag threshold', () => {
    // Given/When/Then: 24 queued changes, one below the nag threshold
    expect(syncDiscrepancyLevel(NAG_THRESHOLD - 1)).toBe('ok');
  });

  it('is nag at the nag threshold', () => {
    expect(syncDiscrepancyLevel(NAG_THRESHOLD)).toBe('nag');
  });

  it('is nag just below the ceiling', () => {
    expect(syncDiscrepancyLevel(WRITE_CEILING - 1)).toBe('nag');
  });

  it('is ceiling at the write ceiling', () => {
    expect(syncDiscrepancyLevel(WRITE_CEILING)).toBe('ceiling');
  });
});
