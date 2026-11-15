import { replay } from '../sync/replay';

const FLUSH_TIMEOUT_MS = 5_000;

/**
 * Sends every write waiting in the sync queue before Offline Mode turns off
 * (online-offline-modes DESIGN.md Decision 11), waiting at most `timeoutMs`.
 * It never rejects: whatever is not sent stays queued and goes out the next
 * time Offline Mode is on. Lives in `services/` so Settings never imports
 * `sync/` (Premise 3). A replay still running at the timeout carries on in the
 * background and releases its lock when it ends.
 */
async function flushSyncQueue(timeoutMs = FLUSH_TIMEOUT_MS): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  const flushed = replay({ ignoreBackoff: true }).then(
    () => undefined,
    (error: unknown) => {
      console.warn('Could not send waiting changes before turning Offline Mode off', error);
    },
  );
  try {
    await Promise.race([flushed, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export { FLUSH_TIMEOUT_MS, flushSyncQueue };
