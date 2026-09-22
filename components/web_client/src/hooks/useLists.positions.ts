import { generateKeyBetween } from 'fractional-indexing';

import { listLists } from '../db/idb';
import type { ListRecord } from '../db/idb.types';

/**
 * Ordering positions are derived from storage, never from a render snapshot.
 *
 * A snapshot can be behind what IndexedDB already holds — the lists are still
 * loading, or another tab just wrote one — and a position computed against a
 * stale view collides with a position a stored list already has. Two lists
 * sharing a position can never be re-ordered again, because `generateKeyBetween`
 * cannot split a gap of zero; it throws `>= `.
 */
async function nextListPosition(): Promise<string> {
  const stored = await listLists();
  const last = stored.at(-1) ?? null;
  return generateKeyBetween(last?.position ?? null, null);
}

/**
 * The position that puts a list between two others, re-spacing the whole set
 * first if those two cannot be told apart.
 *
 * Devices can already be holding duplicate positions, written before positions
 * were derived from storage or merged from a device that was offline. Re-spacing
 * heals that in place rather than leaving the user with arrows that do nothing:
 * the re-spaced lists are returned so the caller can persist them.
 */
async function positionBetween(
  before: ListRecord | null,
  after: ListRecord | null,
): Promise<{ position: string; respaced: ListRecord[] }> {
  try {
    return { position: generateKeyBetween(before?.position ?? null, after?.position ?? null), respaced: [] };
  } catch {
    const respaced = respaceLists(await listLists());
    const positionOf = (list: ListRecord | null) =>
      list === null ? null : (respaced.find((candidate) => candidate.id === list.id)?.position ?? list.position);
    return { position: generateKeyBetween(positionOf(before), positionOf(after)), respaced };
  }
}

/** Re-issues evenly spaced positions in the order the lists are already in. */
function respaceLists(lists: ListRecord[]): ListRecord[] {
  let previous: string | null = null;
  return lists.map((list) => {
    previous = generateKeyBetween(previous, null);
    return { ...list, position: previous };
  });
}

export { nextListPosition, positionBetween, respaceLists };
