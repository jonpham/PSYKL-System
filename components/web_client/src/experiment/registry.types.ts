import type { ComponentType } from 'react';

/** `exploring` is the default; `paused` marks a discovery the operator stopped
 * short of a verdict. Discarded and promoted experiments are deleted from the
 * registry outright rather than carrying a status. */
type ExperimentStatus = 'exploring' | 'paused';

interface Experiment {
  Component: ComponentType;
  layout?: 'centered' | 'full';
  slug: string;
  status: ExperimentStatus;
  summary: string;
  title: string;
}

export type { Experiment, ExperimentStatus };
