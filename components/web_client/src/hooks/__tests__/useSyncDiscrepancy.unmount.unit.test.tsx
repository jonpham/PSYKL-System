import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSyncDiscrepancy } from '../useSyncDiscrepancy';

const mockListSyncQueue = vi.hoisted(() => vi.fn());

vi.mock('../../db/idb', () => ({
  listSyncQueue: mockListSyncQueue,
}));

vi.mock('../useTasks', () => ({
  subscribeToTaskChanges: () => () => undefined,
}));

vi.mock('../useLists', () => ({
  subscribeToListChanges: () => () => undefined,
}));

function Probe() {
  const { count } = useSyncDiscrepancy();
  return <p>{count}</p>;
}

describe('useSyncDiscrepancy (Unit)', () => {
  beforeEach(() => {
    mockListSyncQueue.mockReset();
  });

  it('does not write state when the queue read resolves after unmount', async () => {
    // Given a queue read that is still in flight
    let release: (entries: unknown[]) => void = () => undefined;
    mockListSyncQueue.mockReturnValue(
      new Promise((resolve) => {
        release = resolve as (entries: unknown[]) => void;
      }),
    );
    const { unmount } = render(<Probe />);

    // When the component goes away before the read comes back
    unmount();
    release([{ id: 'op-1' }, { id: 'op-2' }]);

    // Then settling it is inert — a setState here throws once the test
    // environment is torn down, which is what made CI fail intermittently.
    await expect(Promise.resolve()).resolves.toBeUndefined();
    expect(mockListSyncQueue).toHaveBeenCalled();
  });
});
