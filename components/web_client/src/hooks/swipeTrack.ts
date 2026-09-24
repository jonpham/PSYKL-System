/**
 * The two decisions a swipe gesture has to make, as pure functions: whether
 * the gesture is horizontal at all, and where it should land when the finger
 * lifts. Both are held apart from the pointer plumbing in `useSwipeTrack` so
 * the thresholds can be pinned by a test without synthesising events.
 */

/** A flick this fast decides the outcome on its own, whatever the travel. */
const FLICK_VELOCITY = 0.5;

interface SettleInput {
  /** Travel past which a release performs the action instead of settling
   * open. Absent on a surface that has no destructive commit. */
  commitAt?: number;
  /** Travel past which a release settles open rather than closed, in px. */
  openAt: number;
  /** Distance from the closed position, in px. Positive means opening. */
  travel: number;
  /** Speed at the moment of release, in px/ms. Positive means opening. */
  velocity: number;
}

type SwipeVerdict = 'closed' | 'commit' | 'open';

/**
 * Whether a drag has committed to the horizontal axis.
 *
 * A gesture has to travel past `threshold` before it means anything — a tap
 * and a jitter both read as zero — and has to be more horizontal than vertical,
 * so a finger heading down the list scrolls it instead of opening a row. A
 * perfect diagonal is left to the scroller: the page moving is the recoverable
 * outcome, a row opening under a scrolling thumb is not.
 */
function claimsHorizontal(dx: number, dy: number, threshold: number): boolean {
  return Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy);
}

/**
 * Where the surface lands when the finger lifts.
 *
 * Commit wins first: a swipe that went the whole way is a deliberate act, and
 * a fast flick across that distance means it just as much as a slow drag does.
 * Below it, a flick decides by direction and everything slower decides by
 * distance.
 */
function settleVerdict({ commitAt, openAt, travel, velocity }: SettleInput): SwipeVerdict {
  if (commitAt !== undefined && travel >= commitAt) {
    return 'commit';
  }
  if (Math.abs(velocity) >= FLICK_VELOCITY) {
    return velocity > 0 ? 'open' : 'closed';
  }
  return travel >= openAt ? 'open' : 'closed';
}

export { claimsHorizontal, FLICK_VELOCITY, settleVerdict, type SwipeVerdict };
