import { useLayoutEffect, useState } from 'react';

type PermanentFailDetail = {
  error: string;
  id: string;
  status: number;
};

function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    const onPermanentFail = (event: Event) => {
      const detail = (event as CustomEvent<PermanentFailDetail>).detail;
      setMessage(`Sync failed (${detail.status}): ${detail.error}`);
    };

    window.addEventListener('sync:permanent-fail', onPermanentFail);
    return () => {
      window.removeEventListener('sync:permanent-fail', onPermanentFail);
    };
  }, []);

  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        background: '#fff8e1',
        border: '1px solid #d9a400',
        borderRadius: 4,
        color: '#4f3800',
        marginBottom: '1rem',
        padding: '0.75rem',
      }}
    >
      {message}
    </div>
  );
}

export { Toast };
