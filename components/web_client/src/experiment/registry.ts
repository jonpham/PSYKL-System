import type { Experiment } from './registry.types';

/** Every experiment reachable at `/exp/{slug}`. Adding one is a single entry
 * here plus a folder alongside this file; removing one is deleting both.
 *
 * Empty is a valid resting state: the last experiment was promoted into the
 * production surface and deleted, and nothing has replaced it yet. */
const experiments: Experiment[] = [];

function findExperiment(slug: string, registry: Experiment[] = experiments): Experiment | null {
  return registry.find((experiment) => experiment.slug === slug) ?? null;
}

export { experiments, findExperiment };
