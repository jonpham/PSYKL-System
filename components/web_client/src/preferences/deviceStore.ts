import { getMeta, putMeta } from '../db/idb';
import type { JsonValue } from '../db/idb.types';

const LOCAL_PREFIX = 'psykl:';

/**
 * Device-local values (appearance, contrast, "show completed" per list, the
 * open list) live in IndexedDB's `sync_meta`, and fall back to `localStorage`
 * when IndexedDB cannot be opened: a browser without it, or with site data
 * blocked. The app then still runs with Offline Mode off (online-offline-modes
 * DESIGN.md Decision 13; Spec 4 decisions S4-5, S4-6). Each call tries
 * IndexedDB first; nothing is copied between the two.
 */
async function readDeviceValue(key: string): Promise<JsonValue | undefined> {
  try {
    return (await getMeta(key))?.value;
  } catch {
    return readLocal(key);
  }
}

async function writeDeviceValue(key: string, value: JsonValue): Promise<void> {
  try {
    await putMeta({ key, value });
  } catch {
    writeLocal(key, value);
  }
}

function readLocal(key: string): JsonValue | undefined {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${key}`);
    return raw === null ? undefined : (JSON.parse(raw) as JsonValue);
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, value: JsonValue): void {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Unpersisted: the choice still applies until the page reloads.
  }
}

export { readDeviceValue, writeDeviceValue };
