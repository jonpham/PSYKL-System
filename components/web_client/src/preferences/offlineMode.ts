const KEY = 'psykl:offline-mode';

/**
 * Offline Mode picks the app's data path: `true` reads and writes through
 * IndexedDB and the sync queue, `false` talks to the server directly. Unlike
 * the other device preferences it lives in `localStorage`, not `sync_meta` —
 * the online-only path exists for browsers that may have no IndexedDB at all
 * (online-offline-modes DESIGN.md Decision 5). Defaults to on; storage that
 * throws (private mode, blocked site data) reads as the default.
 */
function readOfflineMode(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}

function writeOfflineMode(offlineMode: boolean): void {
  try {
    localStorage.setItem(KEY, String(offlineMode));
  } catch {
    // Unpersisted: the choice still applies until the page reloads.
  }
}

export { readOfflineMode, writeOfflineMode };
