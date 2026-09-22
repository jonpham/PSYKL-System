import { describe, expect, it } from 'vitest';

import { destinationForPath, pathForDestination } from '../useDestination';

describe('useDestination', () => {
  it('maps every destination to its path and back', () => {
    // Given every destination the drawer offers
    const destinations = ['list', 'lists', 'recently-deleted', 'settings', 'sync'] as const;

    // When / Then — the mapping round-trips
    for (const destination of destinations) {
      expect(destinationForPath(pathForDestination(destination))).toBe(destination);
    }
  });

  it('falls back to the list for a path it does not know', () => {
    // Given a path no destination claims
    // When / Then
    expect(destinationForPath('/nonsense')).toBe('list');
  });

  it('puts the active list at the root path', () => {
    // When / Then — the list is the app's home, not a sub-path
    expect(pathForDestination('list')).toBe('/');
  });
});
