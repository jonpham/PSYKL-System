import { AppleRemindersUxExperiment } from './apple-reminders-ux';
import type { Experiment } from './registry.types';

/** Every experiment reachable at `/exp/{slug}`. Adding one is a single entry
 * here plus a folder alongside this file; removing one is deleting both. */
const experiments: Experiment[] = [
  {
    Component: AppleRemindersUxExperiment,
    layout: 'full',
    slug: 'apple-reminders-ux',
    summary: 'Try Apple Reminders-grade navigation over existing PSYKL features.',
    title: 'Apple Reminders UX',
  },
];

function findExperiment(slug: string, registry: Experiment[] = experiments): Experiment | null {
  return registry.find((experiment) => experiment.slug === slug) ?? null;
}

export { experiments, findExperiment };
