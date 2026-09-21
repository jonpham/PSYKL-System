const KEY_PREFIX = 'reminders-exp:show-completed:';

/** Whether a list shows its completed tasks is a property of how you like to
 * look at that list on this device, so it lives in localStorage and is never
 * synced. Reads and writes are guarded: private windows and blocked site data
 * both throw here. */
const showCompletedStore = {
  read(listId: string | null): boolean {
    if (listId === null) return true;
    try {
      return window.localStorage.getItem(`${KEY_PREFIX}${listId}`) !== 'false';
    } catch {
      return true;
    }
  },

  write(listId: string | null, showCompleted: boolean): void {
    if (listId === null) return;
    try {
      window.localStorage.setItem(`${KEY_PREFIX}${listId}`, String(showCompleted));
    } catch {
      // A preference we cannot persist is not worth failing the interaction for.
    }
  },
};

export { showCompletedStore };
