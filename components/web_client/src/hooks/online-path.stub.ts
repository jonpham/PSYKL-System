/** Every write on the not-yet-built online-only path rejects through here, so
 * the stubs fail loudly instead of silently dropping a user's change. Deleted
 * when online-offline-modes Spec 2 implements the API client hooks. */
function notImplementedOnline(operation: string): Promise<never> {
  return Promise.reject(new Error(`${operation} is not available with Offline Mode off yet`));
}

export { notImplementedOnline };
