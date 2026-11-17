/** `useRecentlyDeleted`'s restore rejects through here with Offline Mode off
 * until online-offline-modes Spec 4 makes Recently Deleted work on both paths,
 * then this file is deleted. A named error, so a refused restore is never
 * dropped silently. */
function notImplementedOnline(operation: string): Promise<never> {
  return Promise.reject(new Error(`${operation} is not available with Offline Mode off yet`));
}

export { notImplementedOnline };
