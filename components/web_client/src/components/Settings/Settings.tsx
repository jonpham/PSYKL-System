import { ExperimentsIndex } from '../../experiment';

interface SettingsProps {
  onClose?: () => void;
  open: boolean;
}

export function Settings({ onClose, open }: SettingsProps) {
  if (!open) {
    return null;
  }

  return (
    <div aria-label="Settings" role="dialog" style={{ border: '1px solid #ccc', borderRadius: 4, padding: '1rem' }}>
      <h2 style={{ margin: '0 0 0.5rem' }}>Experiments</h2>
      <p style={{ color: '#666', margin: '0 0 0.75rem' }}>
        Prototypes under evaluation. They are throwaway and may disappear without notice.
      </p>
      <ExperimentsIndex />
      {onClose ? (
        <button onClick={onClose} style={{ marginTop: '0.5rem' }} type="button">
          Close
        </button>
      ) : null}
    </div>
  );
}
