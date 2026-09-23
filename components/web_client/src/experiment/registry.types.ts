import type { ComponentType } from 'react';

/** An experiment that is still registered is, by definition, being explored:
 * discarding, pausing past a verdict, or promoting one all end with its code
 * and this entry deleted, so no status is carried here. */
interface Experiment {
  Component: ComponentType;
  layout?: 'centered' | 'full';
  slug: string;
  summary: string;
  title: string;
}

export type { Experiment };
