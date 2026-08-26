import { getSharedChannel } from './broadcast-channel';

/**
 * Small wrapper around the shared `BroadcastChannel` (see
 * `broadcast-channel.ts`) that lazily wires up a listener for one message
 * type and exposes `post`/`reset`. Both `useLists` and `useTasks` had their
 * own copy of this plumbing; this is the single implementation.
 */
function createChannelNotifier(channelName: string, messageType: string, onRemoteMessage: () => void) {
  let channel: BroadcastChannel | null = null;

  function ensureChannel(): BroadcastChannel | null {
    if (channel || typeof BroadcastChannel === 'undefined') {
      return channel;
    }
    const shared = getSharedChannel(channelName);
    if (!shared) {
      return null;
    }
    shared.addEventListener('message', (event) => {
      if ((event.data as { type?: string }).type === messageType) {
        onRemoteMessage();
      }
    });
    channel = shared;
    return channel;
  }

  function post(): void {
    ensureChannel()?.postMessage({ type: messageType });
  }

  function reset(): void {
    channel = null;
  }

  return { ensureChannel, post, reset };
}

export { createChannelNotifier };
