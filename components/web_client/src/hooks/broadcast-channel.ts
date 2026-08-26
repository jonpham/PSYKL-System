const channels = new Map<string, BroadcastChannel>();

function getSharedChannel(name: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  let channel = channels.get(name);
  if (!channel) {
    channel = new BroadcastChannel(name);
    channels.set(name, channel);
  }
  return channel;
}

function resetSharedChannelsForTest(): void {
  channels.forEach((channel) => channel.close());
  channels.clear();
}

export { getSharedChannel, resetSharedChannelsForTest };
