import { replay as replayQueue } from './replay';

type PageSyncTriggers = {
  replay?: () => Promise<unknown>;
};

type EnqueueWithReplayInput<T> = {
  enqueue: () => Promise<T>;
  replay?: () => Promise<unknown>;
};

async function enqueueWithReplay<T>(input: EnqueueWithReplayInput<T>): Promise<T> {
  const result = await input.enqueue();
  await runReplay(input.replay ?? replayQueue);
  return result;
}

function registerPageSyncTriggers(input: PageSyncTriggers = {}): () => void {
  const replay = input.replay ?? replayQueue;
  const onOnline = () => {
    void runReplay(replay);
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void runReplay(replay);
    }
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

async function runReplay(replay: () => Promise<unknown>): Promise<void> {
  try {
    await replay();
  } catch (error) {
    console.error('Sync replay failed', error);
  }
}

export { enqueueWithReplay, registerPageSyncTriggers };
