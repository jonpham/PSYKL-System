import type { ReactNode } from 'react';

import { navigate } from '../../hooks/usePathname';

interface ExperimentFrameProps {
  children: ReactNode;
  title: string;
}

/** Shared chrome for every `/exp/*` surface. The banner exists so a screenshot
 * of an experiment can never be mistaken for the shipped product. */
export function ExperimentFrame({ children, title }: ExperimentFrameProps) {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        margin: '0 auto',
        maxWidth: 640,
        padding: '2rem',
      }}
    >
      <p
        role="note"
        style={{
          background: '#fff4e5',
          border: '1px solid #e0b070',
          borderRadius: 4,
          margin: 0,
          padding: '0.5rem 0.75rem',
        }}
      >
        Experiment — not production. Behaviour here is throwaway until it is promoted.
      </p>
      <h1>{title}</h1>
      {children}
      <button onClick={() => navigate('/')} style={{ marginTop: '1.5rem' }} type="button">
        Back to PSYKL
      </button>
    </main>
  );
}
