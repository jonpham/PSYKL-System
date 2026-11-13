/** Every write on the not-yet-built online-only path rejects through here, so
 * the stubs fail loudly instead of silently dropping a user's change. Deleted
 * when online-offline-modes Spec 3 implements the API client hooks. */
function notImplementedOnline(operation: string): Promise<never> {
  return Promise.reject(new Error(`${operation} is not available with Offline Mode off yet`));
}

/** Whether the online-only path works yet. Settings colors the Offline Mode
 * switch from this (DESIGN.md Decision 12); Spec 3 sets it to `true` when the
 * API client hooks are real, then deletes this file. */
const ONLINE_PATH_AVAILABLE = false;

export { notImplementedOnline, ONLINE_PATH_AVAILABLE };
