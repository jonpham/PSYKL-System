import { useEffect, useRef } from 'react';

import type { Experiment } from '../../registry.types';

interface ExperimentSwitcherProps {
  /** `null` means the developer is on the production surface. */
  currentSlug: string | null;
  experiments: Experiment[];
  onClose: () => void;
  onSelect: (slug: string | null) => void;
}

/** The experience picker. Production is a synthetic first row rather than a
 * registry entry, so it is always offered however many experiments exist. */
export function ExperimentSwitcher({ currentSlug, experiments, onClose, onSelect }: ExperimentSwitcherProps) {
  const firstChoiceRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstChoiceRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div style={scrimStyle}>
      <div aria-label="Switch experience" aria-modal="true" role="dialog" style={dialogStyle}>
        <header style={headerStyle}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Switch experience</h2>
          <button aria-label="Close experience picker" onClick={onClose} style={dismissStyle} type="button">
            <span aria-hidden="true">✕</span>
          </button>
        </header>
        <ul style={{ display: 'grid', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li>
            <button
              aria-current={currentSlug === null ? 'true' : undefined}
              onClick={() => onSelect(null)}
              ref={firstChoiceRef}
              style={choiceStyle}
              type="button"
            >
              <strong>Production</strong>
              <span style={summaryStyle}>The shipped PSYKL app.</span>
            </button>
          </li>
          {experiments.map((experiment) => (
            <li key={experiment.slug}>
              <button
                aria-current={currentSlug === experiment.slug ? 'true' : undefined}
                onClick={() => onSelect(experiment.slug)}
                style={choiceStyle}
                type="button"
              >
                <strong>{experiment.title}</strong>
                <span style={summaryStyle}>{experiment.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const scrimStyle = {
  alignItems: 'center',
  background: 'rgb(0 0 0 / 40%)',
  display: 'flex',
  inset: 0,
  justifyContent: 'center',
  padding: '1rem',
  position: 'fixed',
  zIndex: 1001,
} as const;

const dialogStyle = {
  background: 'var(--bg-elevated, #fff)',
  borderRadius: 'var(--radius-control, 10px)',
  boxShadow: '0 8px 30px rgb(0 0 0 / 30%)',
  color: 'var(--text-primary, #000)',
  maxHeight: '80vh',
  maxWidth: '30rem',
  overflowY: 'auto',
  padding: '1rem',
  width: '100%',
} as const;

const headerStyle = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.75rem',
} as const;

const dismissStyle = {
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  minHeight: 'var(--row-min, 44px)',
  minWidth: 'var(--row-min, 44px)',
} as const;

const choiceStyle = {
  background: 'transparent',
  border: '1px solid var(--separator, #c6c6c8)',
  borderRadius: 'var(--radius-control, 10px)',
  color: 'inherit',
  cursor: 'pointer',
  display: 'grid',
  font: 'inherit',
  gap: '0.15rem',
  minHeight: 'var(--row-min, 44px)',
  padding: '0.6rem 0.75rem',
  textAlign: 'left',
  width: '100%',
} as const;

const summaryStyle = {
  color: 'var(--text-secondary, #8e8e93)',
  fontSize: '0.85em',
} as const;
