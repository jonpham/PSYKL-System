import { useState } from 'react';

import { navigate, usePathname } from '../../hooks/usePathname';
import { experimentToolsStore } from '../experimentToolsStore';
import { experimentPath, experimentSlugFromPath, isExperimentPath } from '../paths';
import { experiments as registeredExperiments, findExperiment } from '../registry';
import type { Experiment } from '../registry.types';
import { ExperimentSwitcher } from './ExperimentSwitcher';

interface ExperimentToolsProps {
  experiments?: Experiment[];
}

/** The floating developer chrome: which experience is on screen, a picker to
 * swap to another one, and the switch that puts the tools away. Rendered on
 * every `/exp` surface and — while the tools are on — over production too, so
 * comparing a prototype against the shipped view is two taps either way. */
export function ExperimentTools({ experiments = registeredExperiments }: ExperimentToolsProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const slug = experimentSlugFromPath(pathname);
  const experienceName = currentExperienceName(pathname, slug, experiments);

  const close = () => {
    experimentToolsStore.write(false);
    navigate('/');
  };

  const select = (nextSlug: string | null) => {
    setPickerOpen(false);
    navigate(nextSlug === null ? '/' : experimentPath(nextSlug));
  };

  return (
    <>
      <aside
        aria-label="Experiment controls"
        style={{
          background: '#fff4e5',
          border: '1px solid #e0b070',
          borderRadius: 999,
          bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          boxShadow: '0 2px 10px rgb(0 0 0 / 18%)',
          alignItems: expanded ? 'center' : undefined,
          color: '#1f2937',
          display: expanded ? 'flex' : 'block',
          gap: expanded ? '0.5rem' : undefined,
          maxWidth: 'min(20rem, calc(100vw - 1.5rem))',
          padding: expanded ? '0.35rem' : 0,
          position: 'fixed',
          // Leading corner, so experiments own the trailing corner where a
          // primary action naturally sits on a phone.
          left: 'max(0.75rem, env(safe-area-inset-left))',
          zIndex: 1000,
        }}
      >
        {expanded ? (
          <>
            <button
              aria-expanded="true"
              aria-label="Collapse experiment controls"
              onClick={() => setExpanded(false)}
              style={iconButtonStyle}
              type="button"
            >
              <span aria-hidden="true">🧪</span>
            </button>
            <button
              aria-haspopup="dialog"
              aria-label={`Switch experience, currently ${experienceName}`}
              onClick={() => setPickerOpen(true)}
              style={experienceButtonStyle}
              type="button"
            >
              <span style={experienceLabelStyle}>{experienceName}</span>
              <span aria-hidden="true">▾</span>
            </button>
            <button aria-label="Close experiment tools" onClick={close} style={closeButtonStyle} type="button">
              Close
            </button>
          </>
        ) : (
          <button
            aria-expanded="false"
            aria-label="Expand experiment controls"
            onClick={() => setExpanded(true)}
            style={iconButtonStyle}
            type="button"
          >
            <span aria-hidden="true">🧪</span>
          </button>
        )}
      </aside>
      {pickerOpen ? (
        <ExperimentSwitcher
          currentSlug={slug}
          experiments={experiments}
          onClose={() => setPickerOpen(false)}
          onSelect={select}
        />
      ) : null}
    </>
  );
}

/** The experiments index is its own experience: it is not production, but it is
 * not one of the registered prototypes either. */
function currentExperienceName(pathname: string, slug: string | null, experiments: Experiment[]): string {
  if (!isExperimentPath(pathname)) {
    return 'Production';
  }

  if (slug === null) {
    return 'Experiments';
  }

  return findExperiment(slug, experiments)?.title ?? slug;
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

const experienceButtonStyle = {
  ...toolbarButtonStyle,
  fontSize: '0.875rem',
  gap: '0.25rem',
  minWidth: 0,
} as const;

/** Truncates rather than wraps: the pill must stay one row wide at 390px. */
const experienceLabelStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const closeButtonStyle = {
  ...toolbarButtonStyle,
  background: '#111827',
  borderRadius: 999,
  color: '#fff',
  flexShrink: 0,
  justifyContent: 'center',
  padding: '0.45rem 0.75rem',
} as const;
