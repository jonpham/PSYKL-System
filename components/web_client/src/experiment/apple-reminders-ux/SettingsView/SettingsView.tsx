import './settings-view.css';

import { VersionFooter } from '../../../components/VersionFooter';
import { ExperimentsIndex } from '../../ExperimentsIndex';

export function SettingsView() {
  return (
    <section className="reminders-settings">
      <h3 className="reminders-settings__heading">Experiments</h3>
      <p className="reminders-settings__note">Prototypes under evaluation. They may disappear without notice.</p>
      <ExperimentsIndex />
      <h3 className="reminders-settings__heading">About</h3>
      <VersionFooter />
    </section>
  );
}
