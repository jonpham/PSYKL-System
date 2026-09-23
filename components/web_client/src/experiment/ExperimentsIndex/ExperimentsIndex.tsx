import { navigate } from '../../hooks/usePathname';
import { experimentPath } from '../paths';
import { experiments as registeredExperiments } from '../registry';
import type { Experiment } from '../registry.types';

interface ExperimentsIndexProps {
  experiments?: Experiment[];
}

export function ExperimentsIndex({ experiments = registeredExperiments }: ExperimentsIndexProps) {
  if (experiments.length === 0) {
    return <p>No experiments are registered right now.</p>;
  }

  return (
    <ul style={{ display: 'grid', gap: '0.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
      {experiments.map((experiment) => (
        <li key={experiment.slug}>
          <button onClick={() => navigate(experimentPath(experiment.slug))} style={rowStyle} type="button">
            <strong>{experiment.title}</strong>
            <span style={summaryStyle}>{experiment.summary}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** The whole row is the target, and every color comes from the theme tokens —
 * an inherited user-agent button color renders black on the dark surface this
 * list sits on in Settings. */
const rowStyle = {
  background: 'transparent',
  border: '1px solid var(--separator, #c6c6c8)',
  borderRadius: 'var(--radius-control, 10px)',
  color: 'var(--text-primary, #000)',
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
