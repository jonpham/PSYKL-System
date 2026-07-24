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
