import { useEffect, useState } from 'react';

import { fetchApiVersion, getWebCommit, shortCommit } from '../../api/version';

type ApiState = { status: 'loading' } | { status: 'ok'; commit: string } | { status: 'error' };

/**
 * Deployment provenance surface: shows the build commit of both the web client
 * (baked via VITE_GIT_SHA) and the service-task API (fetched from GET /version),
 * with an at-a-glance indicator of whether the two halves of the deploy match.
 */
export function VersionFooter() {
  const webCommit = getWebCommit();
  const [api, setApi] = useState<ApiState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchApiVersion()
      .then((version) => {
        if (!cancelled) setApi({ status: 'ok', commit: version.commit });
      })
      .catch(() => {
        if (!cancelled) setApi({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  let apiLabel: string;
  let statusLabel: string;
  if (api.status === 'loading') {
    apiLabel = '…';
    statusLabel = 'checking…';
  } else if (api.status === 'error') {
    apiLabel = 'unavailable';
    statusLabel = 'api unreachable';
  } else {
    apiLabel = shortCommit(api.commit);
    statusLabel = api.commit === webCommit ? 'in sync' : 'version mismatch';
  }

  return (
    <footer
      className="version-footer"
      style={{
        marginTop: '2rem',
        fontSize: '0.75rem',
        color: '#888',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <span aria-label="web client commit" title={`web_client build commit: ${webCommit}`}>
        web <code>{shortCommit(webCommit)}</code>
      </span>
      {' · '}
      <span
        aria-label="api commit"
        title={api.status === 'ok' ? `service-task build commit: ${api.commit}` : undefined}
      >
        api <code>{apiLabel}</code>
      </span>{' '}
      <span role="status">{statusLabel}</span>
    </footer>
  );
}
