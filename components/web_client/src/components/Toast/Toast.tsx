import { useLayoutEffect, useState } from 'react';

type PermanentFailDetail = {
  error: string;
  id: string;
  status: number;
};

type StaleWriteDetail = {
  task: { title: string };
};

const bannerStyle = {
  borderRadius: 4,
  marginBottom: '1rem',
  padding: '0.75rem',
};

function Toast() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [message, setMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    const onPermanentFail = (event: Event) => {
      const detail = (event as CustomEvent<PermanentFailDetail>).detail;
      setMessage(`Sync failed (${detail.status}): ${detail.error}`);
    };
    const onStaleWrite = (event: Event) => {
      const detail = (event as CustomEvent<StaleWriteDetail>).detail;
      setMessage(`"${detail.task.title}" was updated on another device and replaced your change.`);
    };
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener('sync:permanent-fail', onPermanentFail);
    window.addEventListener('sync:stale-write', onStaleWrite);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('sync:permanent-fail', onPermanentFail);
      window.removeEventListener('sync:stale-write', onStaleWrite);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline && !message) {
    return null;
  }

  return (
    <>
      {offline ? (
        <div
          role="status"
          style={{ ...bannerStyle, background: '#eef3fb', border: '1px solid #6b8fc7', color: '#20365c' }}
        >
          You’re offline. Changes will sync when you reconnect.
        </div>
      ) : null}
      {message ? (
        <div
          role="alert"
          style={{ ...bannerStyle, background: '#fff8e1', border: '1px solid #d9a400', color: '#4f3800' }}
        >
          {message}
        </div>
      ) : null}
    </>
  );
}

export { Toast };
