import { VersionFooter } from '../../../components/VersionFooter';
import { ExperimentsIndex } from '../../ExperimentsIndex';

export function SettingsView() {
  return (
    <section aria-labelledby="reminders-settings-title">
      <h2 id="reminders-settings-title">Settings</h2>
      <h3>Experiments</h3>
      <p style={{ color: '#666' }}>Prototypes under evaluation. They may disappear without notice.</p>
      <ExperimentsIndex />
      <h3 style={{ marginTop: '2rem' }}>About</h3>
      <VersionFooter />
    </section>
  );
}
