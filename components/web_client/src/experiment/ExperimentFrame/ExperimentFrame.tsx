import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { ExperimentTools } from '../ExperimentTools';
import { experimentToolsStore } from '../experimentToolsStore';

interface ExperimentFrameProps {
  children: ReactNode;
  layout?: 'centered' | 'full';
  title: string;
}

/** Shared chrome for every `/exp/*` surface. The controls stay outside layout
 * flow so experiments own their full viewport and responsive measurements. */
export function ExperimentFrame({ children, layout = 'centered', title }: ExperimentFrameProps) {
  const fullWidth = layout === 'full';

  // Reaching any experiment is the activation gesture for the tools, which is
  // what keeps them visible after the developer switches back to production.
  useEffect(() => {
    experimentToolsStore.write(true);
  }, []);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        margin: fullWidth ? 0 : '0 auto',
        maxWidth: fullWidth ? 'none' : 640,
        padding: fullWidth ? 0 : '2rem',
      }}
    >
      <ExperimentTools />
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
