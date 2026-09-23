import type { Task } from '../../api/client';

/** Moves one entry to another index, clamping rather than dropping it. */
function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) {
    return next;
  }
  const target = Math.min(Math.max(to, 0), next.length);
  next.splice(target, 0, moved);
  return next;
}

/**
 * The index a drag is currently over, from the vertical midpoints of the rows
 * it can land on. Past the last midpoint the drag belongs to the last row, so a
 * pointer dragged off the bottom of the list still has somewhere to drop.
 */
function targetIndexFor(midpoints: readonly number[], y: number): number {
  if (midpoints.length === 0) {
    return 0;
  }
  const crossed = midpoints.filter((midpoint) => y > midpoint).length;
  return Math.min(crossed, midpoints.length - 1);
}

/**
 * Re-orders tasks into the order the user dragged them into.
 *
 * The hand order is held in React state for this iteration (see the feature's
 * implementation notes): it survives re-renders and re-sorts, not a reload.
 * Tasks the order has never seen — captured or synced since the last drag —
 * keep their incoming order and follow the ones it has, so an arriving task is
 * never silently reshuffled into the middle of a list the user arranged.
 */
function applyHandOrder(tasks: readonly Task[], order: readonly string[]): Task[] {
  if (order.length === 0) {
    return [...tasks];
  }
  const ranked = tasks.filter((task) => order.includes(task.id));
  const unranked = tasks.filter((task) => !order.includes(task.id));
  return [...ranked.sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id)), ...unranked];
}

export { applyHandOrder, moveItem, targetIndexFor };
