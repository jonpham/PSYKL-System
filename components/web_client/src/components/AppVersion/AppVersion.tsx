import './app-version.css';

import { useEffect, useState } from 'react';

import { fetchApiVersion, shortCommit } from '../../api/version';
import { type AppUpdateStatus, useAppUpdate, type UseAppUpdateOptions } from '../../hooks/useAppUpdate';

type ApiState = { status: 'loading' } | { status: 'ok'; commit: string } | { status: 'error' };

interface AppVersionProps {
  /** Seam for tests and stories; production renders with the real browser. */
  updateOptions?: UseAppUpdateOptions;
}

const statusLabels: Record<AppUpdateStatus, string> = {
  checking: 'Checking for updates…',
  failed: "Couldn't check for updates",
  'up-to-date': 'Up to date',
  'update-available': 'A new version is available',
  updating: 'Updating…',
};

/**
 * Settings → About → Version. Shows the web bundle the user is running against
 * the one the origin is serving, and offers the one-press update that swaps
 * them without reinstalling the PWA. The service-task build commit stays as a
 * provenance detail below.
 */
export function AppVersion({ updateOptions }: AppVersionProps = {}) {
  const { applyUpdate, availableCommit, currentCommit, recheck, status } = useAppUpdate(updateOptions ?? {});
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

  const availableLabel =
    status === 'checking' ? 'checking…' : availableCommit === null ? 'unavailable' : shortCommit(availableCommit);
  const apiLabel = api.status === 'loading' ? '…' : api.status === 'error' ? 'unavailable' : shortCommit(api.commit);

  return (
    <section className="app-version">
      <h4>Version</h4>

      <dl className="app-version__rows">
        <div className="app-version__row">
          <dt>Current</dt>
          <dd aria-label="current web version" title={`web_client build commit: ${currentCommit}`}>
            <code>{shortCommit(currentCommit)}</code>
          </dd>
        </div>
        <div className="app-version__row">
          <dt>Available</dt>
          <dd
            aria-label="available web version"
            title={availableCommit ? `deployed build commit: ${availableCommit}` : undefined}
          >
            <code>{availableLabel}</code>
          </dd>
        </div>
      </dl>

      <p className="app-version__status" role="status">
        {statusLabels[status]}
      </p>

      {status === 'update-available' || status === 'updating' ? (
        <button className="app-version__update" disabled={status === 'updating'} onClick={applyUpdate} type="button">
          {status === 'updating' ? 'Updating…' : 'Update to latest version'}
        </button>
      ) : null}

      {status === 'failed' ? (
        <button className="app-version__retry" onClick={recheck} type="button">
          Try again
        </button>
      ) : null}

      <p className="app-version__detail">
        <span
          aria-label="api build"
          title={api.status === 'ok' ? `service-task build commit: ${api.commit}` : undefined}
        >
          API build <code>{apiLabel}</code>
        </span>
      </p>
    </section>
  );
}
