/**
 * Clamp a client-supplied timestamp to "now" when it is more than five
 * minutes in the future. Guards against a misbehaving or clock-skewed
 * client permanently winning every future Last-Write-Wins comparison.
 *
 * Shared by TaskService and ListService — do not duplicate this per entity.
 */
export function clampFutureTimestamp(timestamp: Date): Date {
  const now = new Date();
  const maxFuture = new Date(now.getTime() + 5 * 60 * 1000);
  return timestamp.getTime() > maxFuture.getTime() ? now : timestamp;
}
