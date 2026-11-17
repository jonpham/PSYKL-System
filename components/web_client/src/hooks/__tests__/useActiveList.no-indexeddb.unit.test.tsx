import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getActiveListId, resetActiveListForTest, setActiveListId, useActiveListId } from '../useActiveList';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  resetActiveListForTest();
});

describe('the open list without IndexedDB', () => {
  it('opens the chosen list and keeps it across a reload', async () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);

    // Act
    await setActiveListId('0199ffff-0000-7000-8000-000000000001');
    resetActiveListForTest();
    const { result } = renderHook(() => useActiveListId());

    // Assert
    await waitFor(() => expect(result.current).toBe('0199ffff-0000-7000-8000-000000000001'));
    expect(getActiveListId()).toBe('0199ffff-0000-7000-8000-000000000001');
  });
});
