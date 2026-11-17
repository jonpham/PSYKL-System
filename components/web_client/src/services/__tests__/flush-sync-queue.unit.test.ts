import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockReplay } = vi.hoisted(() => ({ mockReplay: vi.fn() }));
vi.mock('../../sync/replay', () => ({ replay: mockReplay }));

import { FLUSH_TIMEOUT_MS, flushSyncQueue } from '../flush-sync-queue';

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('flushSyncQueue', () => {
  it('replays every queued write, ignoring retry delays', async () => {
    // Given
    mockReplay.mockResolvedValue({ failed: 0, replayed: 1, retried: 0 });

    // When
    await flushSyncQueue();

    // Then
    expect(mockReplay).toHaveBeenCalledWith({ ignoreBackoff: true });
  });

  it('gives up waiting after 5 seconds', async () => {
    // Given
    vi.useFakeTimers();
    mockReplay.mockReturnValue(new Promise(() => {}));
    let settled = false;

    // When
    void flushSyncQueue().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(FLUSH_TIMEOUT_MS);

    // Then
    expect(FLUSH_TIMEOUT_MS).toBe(5_000);
    expect(settled).toBe(true);
  });

  it('resolves even when the replay throws', async () => {
    // Given
    mockReplay.mockRejectedValue(new Error('IndexedDB unavailable'));

    // When / Then
    await expect(flushSyncQueue()).resolves.toBeUndefined();
  });
});
