import { readDeviceValue, writeDeviceValue } from './deviceStore';

const KEY_PREFIX = 'pref:show-completed:';

/** Whether a list shows its completed tasks is a property of how you like to
 * look at that list on this device, so it lives in the device store and is never
 * enqueued (to-do-ui DESIGN.md Decision 4). Keyed per list, so hiding completed
 * in one list leaves every other list alone. */
async function readCompletedVisibility(listId: string | null): Promise<boolean> {
  if (listId === null) {
    return true;
  }
  return (await readDeviceValue(`${KEY_PREFIX}${listId}`)) !== false;
}

async function writeCompletedVisibility(listId: string | null, visible: boolean): Promise<void> {
  if (listId === null) {
    return;
  }
  await writeDeviceValue(`${KEY_PREFIX}${listId}`, visible);
}

export { readCompletedVisibility, writeCompletedVisibility };
