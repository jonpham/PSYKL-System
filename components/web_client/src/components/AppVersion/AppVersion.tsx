import './app-version.css';

import { useEffect, useState } from 'react';

import { fetchApiVersion, shortCommit } from '../../api/version';
import { type AppUpdateStatus, useAppUpdate, type UseAppUpdateOptions } from '../../hooks/useAppUpdate';

type ApiState = { status: 'loading' } | { status: 'ok'; commit: string } | { status: 'error' };

interface AppVersionProps {
  /** Seam for tests and stories; production renders with the real browser. */
  updateOptions?: UseAppUpdateOptions;
}

const buttonLabels: Record<AppUpdateStatus, string> = {
  checking: 'Checking…',
  failed: 'Check for updates',
  'up-to-date': 'Check for updates',
  'update-available': 'Update to Latest',
  updating: 'Updating…',
};

const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Settings → About. Shows the web bundle the user is running and, when the
 * origin is serving a newer one, the one-press update that swaps them without
 * reinstalling the PWA. The checking and updating work lives in `useAppUpdate`.
 */
export function AppVersion({ updateOptions }: AppVersionProps = {}) {
  const { applyUpdate, availableCommit, currentCommit, lastCheckedAt, recheck, status } = useAppUpdate(
    updateOptions ?? {},
  );
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

  // An available version only says something when it differs from the loaded
  // one; otherwise the row is noise and the check button carries the meaning.
  const updatePending = status === 'update-available' || status === 'updating';
  const busy = status === 'checking' || status === 'updating';
  const apiLabel = api.status === 'loading' ? '…' : api.status === 'error' ? 'unavailable' : shortCommit(api.commit);

  return (
    <section className="app-version">
      <dl className="app-version__rows">
        <div className="app-version__row">
          <dt>Current Version:</dt>
          <dd aria-label="current web version" title={`web_client build commit: ${currentCommit}`}>
            <code>{shortCommit(currentCommit)}</code>
          </dd>
        </div>
        {updatePending && availableCommit ? (
          <div className="app-version__row">
            <dt>Available:</dt>
            <dd aria-label="available web version" title={`deployed build commit: ${availableCommit}`}>
              <code>{shortCommit(availableCommit)}</code>
            </dd>
          </div>
        ) : null}
      </dl>

      <button
        className={updatePending ? 'app-version__button app-version__button--update' : 'app-version__button'}
        disabled={busy}
        onClick={status === 'update-available' ? applyUpdate : recheck}
        type="button"
      >
        {buttonLabels[status]}
      </button>

      <p className="app-version__status" role="status">
        {statusText(status, lastCheckedAt)}
      </p>

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

function statusText(status: AppUpdateStatus, lastCheckedAt: Date | null): string {
  switch (status) {
    case 'checking':
      return 'Checking for updates…';
    case 'failed':
      return "Couldn't check for updates";
    case 'update-available':
      return 'A new version is available';
    case 'updating':
      return 'Updating…';
    case 'up-to-date':
      return lastCheckedAt ? `Last checked: ${timestamp.format(lastCheckedAt)}` : 'Up to date';
  }
}
