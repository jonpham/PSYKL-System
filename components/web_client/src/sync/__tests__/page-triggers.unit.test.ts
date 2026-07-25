import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enqueueWithReplay, registerPageSyncTriggers } from '../page-triggers';

describe('page sync triggers', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('replays when the page comes online', async () => {
    const replay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const notify = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    registerPageSyncTriggers({ notify, replay });
    window.dispatchEvent(new Event('online'));

    expect(replay).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
  });

  it('replays when the document becomes visible', async () => {
    const notify = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const replay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    registerPageSyncTriggers({ notify, replay });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(replay).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
  });

  it('does not replay when the document is hidden', async () => {
    const replay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    registerPageSyncTriggers({ replay });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(replay).not.toHaveBeenCalled();
  });

  it('enqueues a mutation and then replays it', async () => {
    const enqueue = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const notify = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    let finishReplay: () => void = () => undefined;
    const replay = vi.fn<() => Promise<void>>().mockReturnValue(
      new Promise((resolve) => {
        finishReplay = resolve;
      }),
    );

    await enqueueWithReplay({ enqueue, notify, replay });

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(replay).toHaveBeenCalledTimes(1);
    expect(enqueue.mock.invocationCallOrder[0]).toBeLessThan(replay.mock.invocationCallOrder[0] ?? 0);
    finishReplay();
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(2));
    expect(replay.mock.invocationCallOrder[0]).toBeLessThan(notify.mock.invocationCallOrder[1] ?? 0);
  });

  it('registers Background Sync after enqueueing a mutation', async () => {
    const enqueue = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const notify = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const registerSync = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const replay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await enqueueWithReplay({ enqueue, notify, registerSync, replay });

    expect(registerSync).toHaveBeenCalledTimes(1);
    expect(enqueue.mock.invocationCallOrder[0]).toBeLessThan(registerSync.mock.invocationCallOrder[0] ?? 0);
  });
});
