/** TanStack Query keys for the online-only path, in one place so a write in
 * one hook can refresh another's cache (Spec 4 decision S4-2). */
const LISTS_QUERY_KEY = ['lists'] as const;
const RECENTLY_DELETED_QUERY_KEY = ['deleted'] as const;
const TASKS_QUERY_KEY = ['tasks'] as const;

export { LISTS_QUERY_KEY, RECENTLY_DELETED_QUERY_KEY, TASKS_QUERY_KEY };
