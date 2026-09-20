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
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {experiments.map((experiment) => (
        <li key={experiment.slug} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
          <button
            onClick={() => navigate(experimentPath(experiment.slug))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
              textAlign: 'left',
            }}
            type="button"
          >
            <strong>{experiment.title}</strong>
          </button>
          <span style={{ color: '#666', fontSize: '0.85em', marginLeft: '0.5rem' }}>{experiment.status}</span>
          <p style={{ color: '#666', margin: '0.25rem 0 0' }}>{experiment.summary}</p>
        </li>
      ))}
    </ul>
  );
}
