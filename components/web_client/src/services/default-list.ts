/**
 * The default list every account starts with (online-offline-modes DESIGN.md
 * Decisions 15, 16). It has a fixed id, so every device and the server agree on
 * it without a round trip, and it can never be deleted.
 *
 * MUST equal DEFAULT_LIST_ID in packages/shared-types/src/schemas/list.ts. The
 * PWA does not import that package at runtime, because it would bundle Zod.
 * Neither data path reads IndexedDB here, so both may import it.
 */
const DEFAULT_LIST_ID = '00000000-0000-7000-8000-000000000001';

function isDefaultList(id: string): boolean {
  return id === DEFAULT_LIST_ID;
}

export { DEFAULT_LIST_ID, isDefaultList };
