const baseUrl = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000';

export interface ComponentVersion {
  component: string;
  commit: string;
}

/** Short display form of a commit (first 7 chars), passing through the "dev" sentinel. */
export function shortCommit(commit: string): string {
  return commit !== 'dev' && commit.length > 7 ? commit.slice(0, 7) : commit;
}

/** The web client's own build commit, baked at build time via VITE_GIT_SHA. */
export function getWebCommit(): string {
  const raw = import.meta.env['VITE_GIT_SHA'] as string | undefined;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : 'dev';
}

/**
 * The commit of the bundle currently published at the origin, read from the
 * build-stamped `/version.json` that sits outside the service worker's
 * precache. Never served from cache, so it answers "is my app stale?".
 */
export async function fetchAvailableWebVersion(): Promise<string> {
  const response = await globalThis.fetch('/version.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`version manifest request failed: ${response.status}`);
  }

  // A missing manifest is answered by nginx's SPA fallback with index.html,
  // which would otherwise parse as "no commit" rather than as a failure.
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    throw new Error(`version manifest was not json: ${contentType || 'unknown content type'}`);
  }

  const body = (await response.json()) as { commit?: unknown };
  const commit = typeof body.commit === 'string' ? body.commit.trim() : '';
  if (commit.length === 0) {
    throw new Error('version manifest is missing a commit');
  }
  return commit;
}

/** Fetch the service-task build commit from its GET /version endpoint. */
export async function fetchApiVersion(): Promise<ComponentVersion> {
  const response = await globalThis.fetch(`${baseUrl}/version`, {
    headers: { 'X-User-Id': 'local' },
  });
  if (!response.ok) {
    throw new Error(`version request failed: ${response.status}`);
  }
  return (await response.json()) as ComponentVersion;
}
