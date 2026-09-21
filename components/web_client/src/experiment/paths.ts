const experimentRoot = '/exp';

function isExperimentPath(pathname: string): boolean {
  return pathname === experimentRoot || pathname.startsWith(`${experimentRoot}/`);
}

/** Returns `null` for the index route (`/exp`) and for anything outside the
 * experiment surface, so the router can treat both as "show the list". */
function experimentSlugFromPath(pathname: string): string | null {
  if (!isExperimentPath(pathname)) {
    return null;
  }

  const slug = pathname.slice(experimentRoot.length).split('/').filter(Boolean)[0];
  return slug ?? null;
}

function experimentPath(slug: string): string {
  return `${experimentRoot}/${slug}`;
}

export { experimentPath, experimentRoot, experimentSlugFromPath, isExperimentPath };
