type EnqueueWithReplayInput = {
  enqueue: () => Promise<void>;
  replay: () => Promise<void>;
};

type PageSyncTriggers = {
  replay: () => Promise<void>;
};

async function enqueueWithReplay(input: EnqueueWithReplayInput): Promise<void> {
  await input.enqueue();
}

function registerPageSyncTriggers(input: PageSyncTriggers): void {
  void input;
}

export { enqueueWithReplay, registerPageSyncTriggers };
