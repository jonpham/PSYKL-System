import { notifyTasksChanged } from '../hooks/useTasks';
import { registerPsyklSync } from '../sw/sw-registration';
import { replay as replayQueue } from './replay';

type PageSyncTriggers = {
  notify?: () => Promise<unknown>;
  replay?: () => Promise<unknown>;
};

type EnqueueWithReplayInput<T> = {
  enqueue: () => Promise<T>;
  notify?: () => Promise<unknown>;
  registerSync?: () => Promise<unknown>;
  replay?: () => Promise<unknown>;
};

async function enqueueWithReplay<T>(input: EnqueueWithReplayInput<T>): Promise<T> {
  const result = await input.enqueue();
  const notify = input.notify ?? notifyTasksChanged;
  await notify();
  void (input.registerSync ?? registerPsyklSync)();
  void runReplay(input.replay ?? replayQueue, notify);
  return result;
}

function registerPageSyncTriggers(input: PageSyncTriggers = {}): () => void {
  const notify = input.notify ?? notifyTasksChanged;
  const replay = input.replay ?? replayQueue;
  const onOnline = () => {
    void runReplay(replay, notify);
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void runReplay(replay, notify);
    }
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

async function runReplay(replay: () => Promise<unknown>, notify: () => Promise<unknown>): Promise<void> {
  try {
    await replay();
    await notify();
  } catch (error) {
    console.error('Sync replay failed', error);
  }
}

export { enqueueWithReplay, registerPageSyncTriggers };
