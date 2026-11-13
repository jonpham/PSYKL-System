import { afterEach, describe, expect, it, vi } from 'vitest';

import { readOfflineMode, writeOfflineMode } from '../offlineMode';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('offlineMode preference', () => {
  it('reads as on when storage throws, so the app still starts on the sync path', () => {
    // Given
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    // When / Then
    expect(readOfflineMode()).toBe(true);
  });

  it('swallows a write that storage refuses', () => {
    // Given
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    // When / Then
    expect(() => writeOfflineMode(false)).not.toThrow();
  });

  it.each(['off', '0', 'False', ''])('reads an unrecognised stored value %j as on', (stored) => {
    // Given
    localStorage.setItem('psykl:offline-mode', stored);

    // When / Then
    expect(readOfflineMode()).toBe(true);
  });

  it('reads the exact string "false" as off', () => {
    // Given
    writeOfflineMode(false);

    // When / Then
    expect(readOfflineMode()).toBe(false);
  });
});
