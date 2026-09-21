import type { ReactNode } from 'react';
import { useState } from 'react';

import { navigate } from '../../hooks/usePathname';

interface ExperimentFrameProps {
  children: ReactNode;
  layout?: 'centered' | 'full';
  title: string;
}

/** Shared floating chrome for every `/exp/*` surface. It stays outside layout
 * flow so experiments own their full viewport and responsive measurements. */
export function ExperimentFrame({ children, layout = 'centered', title }: ExperimentFrameProps) {
  const fullWidth = layout === 'full';
  const [controlsExpanded, setControlsExpanded] = useState(false);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        margin: fullWidth ? 0 : '0 auto',
        maxWidth: fullWidth ? 'none' : 640,
        padding: fullWidth ? 0 : '2rem',
      }}
    >
      <aside
        aria-label="Experiment controls"
        style={{
          background: '#fff4e5',
          border: '1px solid #e0b070',
          borderRadius: 999,
          bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          boxShadow: '0 2px 10px rgb(0 0 0 / 18%)',
          alignItems: controlsExpanded ? 'center' : undefined,
          display: controlsExpanded ? 'flex' : 'block',
          gap: controlsExpanded ? '0.5rem' : undefined,
          maxWidth: 'min(20rem, calc(100vw - 1.5rem))',
          padding: controlsExpanded ? '0.35rem' : 0,
          position: 'fixed',
          // Leading corner, so experiments own the trailing corner where a
          // primary action naturally sits on a phone.
          left: 'max(0.75rem, env(safe-area-inset-left))',
          zIndex: 1000,
        }}
      >
        {controlsExpanded ? (
          <>
            <button
              aria-expanded="true"
              aria-label="Collapse experiment controls"
              onClick={() => setControlsExpanded(false)}
              style={iconButtonStyle}
              type="button"
            >
              <span aria-hidden="true">🧪</span>
            </button>
            <p role="note" style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'nowrap' }}>
              Not production
            </p>
            <button aria-label="Close experiment" onClick={() => navigate('/')} style={closeButtonStyle} type="button">
              Close
            </button>
          </>
        ) : (
          <button
            aria-expanded="false"
            aria-label="Expand experiment controls"
            onClick={() => setControlsExpanded(true)}
            style={iconButtonStyle}
            type="button"
          >
            <span aria-hidden="true">🧪</span>
          </button>
        )}
      </aside>
      <h1
        style={
          fullWidth
            ? {
                clip: 'rect(0 0 0 0)',
                clipPath: 'inset(50%)',
                height: 1,
                overflow: 'hidden',
                position: 'absolute',
                whiteSpace: 'nowrap',
                width: 1,
              }
            : undefined
        }
      >
        {title}
      </h1>
      {children}
    </main>
  );
}

const toolbarButtonStyle = {
  alignItems: 'center',
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  font: 'inherit',
  gap: '0.5rem',
  justifyContent: 'center',
  padding: 0,
} as const;

const iconButtonStyle = {
  ...toolbarButtonStyle,
  borderRadius: '50%',
  fontSize: '1.15rem',
  height: '2.5rem',
  width: '2.5rem',
} as const;

const closeButtonStyle = {
  ...toolbarButtonStyle,
  background: '#111827',
  borderRadius: 999,
  color: '#fff',
  justifyContent: 'center',
  padding: '0.45rem 0.75rem',
} as const;
