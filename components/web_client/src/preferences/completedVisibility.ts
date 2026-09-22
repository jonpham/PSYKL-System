import { getMeta, putMeta } from '../db/idb';

const KEY_PREFIX = 'pref:show-completed:';

/** Whether a list shows its completed tasks is a property of how you like to
 * look at that list on this device, so it lives in `sync_meta` and is never
 * enqueued (to-do-ui DESIGN.md Decision 4). Keyed per list, so hiding completed
 * in one list leaves every other list alone. */
async function readCompletedVisibility(listId: string | null): Promise<boolean> {
  if (listId === null) {
    return true;
  }
  const entry = await getMeta(`${KEY_PREFIX}${listId}`);
  return entry?.value !== false;
}

async function writeCompletedVisibility(listId: string | null, visible: boolean): Promise<void> {
  if (listId === null) {
    return;
  }
  await putMeta({ key: `${KEY_PREFIX}${listId}`, value: visible });
}

export { readCompletedVisibility, writeCompletedVisibility };
