import { ExperimentFrame } from '../ExperimentFrame';
import { ExperimentsIndex } from '../ExperimentsIndex';
import { experimentSlugFromPath } from '../paths';
import { experiments as registeredExperiments, findExperiment } from '../registry';
import type { Experiment } from '../registry.types';

interface ExperimentRouterProps {
  experiments?: Experiment[];
  pathname: string;
}

export function ExperimentRouter({ experiments = registeredExperiments, pathname }: ExperimentRouterProps) {
  const slug = experimentSlugFromPath(pathname);
  const experiment = slug === null ? null : findExperiment(slug, experiments);

  if (experiment !== null) {
    const { Component } = experiment;
    return (
      <ExperimentFrame layout={experiment.layout} title={experiment.title}>
        <Component />
      </ExperimentFrame>
    );
  }

  return (
    <ExperimentFrame title="Experiments">
      {slug === null ? null : (
        <p>
          No experiment is registered at <code>{`/exp/${slug}`}</code>.
        </p>
      )}
      <ExperimentsIndex experiments={experiments} />
    </ExperimentFrame>
  );
}
