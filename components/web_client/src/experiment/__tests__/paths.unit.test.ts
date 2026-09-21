import { describe, expect, it } from 'vitest';

import { experimentPath, experimentSlugFromPath, isExperimentPath } from '../paths';

describe('isExperimentPath', () => {
  it('matches the experiments root and any experiment below it', () => {
    expect(isExperimentPath('/exp')).toBe(true);
    expect(isExperimentPath('/exp/')).toBe(true);
    expect(isExperimentPath('/exp/task-sections')).toBe(true);
  });

  it('does not match the production app or a lookalike prefix', () => {
    expect(isExperimentPath('/')).toBe(false);
    expect(isExperimentPath('/expenses')).toBe(false);
  });
});

describe('experimentSlugFromPath', () => {
  it('returns the slug for an experiment route', () => {
    expect(experimentSlugFromPath('/exp/task-sections')).toBe('task-sections');
  });

  it('returns null for the index route so the router can list experiments', () => {
    expect(experimentSlugFromPath('/exp')).toBeNull();
    expect(experimentSlugFromPath('/exp/')).toBeNull();
  });

  it('returns null for a non-experiment path', () => {
    expect(experimentSlugFromPath('/')).toBeNull();
  });

  it('ignores trailing slashes and nested segments below the slug', () => {
    expect(experimentSlugFromPath('/exp/task-sections/')).toBe('task-sections');
    expect(experimentSlugFromPath('/exp/task-sections/detail')).toBe('task-sections');
  });
});

describe('experimentPath', () => {
  it('builds the route for a slug', () => {
    expect(experimentPath('task-sections')).toBe('/exp/task-sections');
  });
});
