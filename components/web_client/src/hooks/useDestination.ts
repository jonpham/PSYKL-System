import { navigate, usePathname } from './usePathname';

type Destination = 'list' | 'lists' | 'recently-deleted' | 'settings' | 'sync';

const PATHS: Record<Destination, string> = {
  list: '/',
  lists: '/lists',
  'recently-deleted': '/recently-deleted',
  settings: '/settings',
  sync: '/sync',
};

function pathForDestination(destination: Destination): string {
  return PATHS[destination];
}

function destinationForPath(pathname: string): Destination {
  const match = (Object.keys(PATHS) as Destination[]).find(
    (destination) => destination !== 'list' && PATHS[destination] === pathname,
  );
  return match ?? 'list';
}

function useDestination(): {
  destination: Destination;
  goTo: (next: Destination, options?: { replace?: boolean }) => void;
} {
  const pathname = usePathname();
  return {
    destination: destinationForPath(pathname),
    goTo: (next, options) => navigate(pathForDestination(next), options),
  };
}

export { type Destination, destinationForPath, pathForDestination, useDestination };
