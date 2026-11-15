import 'fake-indexeddb/auto';

import { act, render, screen, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetUseListsForTest, useLists } from '../../../hooks/useLists';
import { type UserSettings, useUserSettings } from '../../../hooks/useUserSettings';
import { readOfflineMode, writeOfflineMode } from '../../../preferences/offlineMode';
import { DEFAULT_LIST_ID } from '../../../services/default-list';
import { server } from '../../../test/setup';
import { SettingsProvider } from '../SettingsProvider';

const onMount = vi.fn();
let setOfflineMode: (offlineMode: boolean) => void = () => {};

function Probe() {
  const settings = useUserSettings();
  setOfflineMode = settings.setOfflineMode;
  useEffect(() => {
    onMount();
  }, []);
  return <p>{settings.offlineMode ? 'offline-mode-on' : 'offline-mode-off'}</p>;
}

afterEach(async () => {
  localStorage.clear();
  onMount.mockClear();
  resetUseListsForTest();
  await deleteDB('psykl');
});

function ListTitles() {
  const { lists } = useLists();
  return <p>{lists.map((list) => list.title).join(', ') || 'none'}</p>;
}

const tasksList = {
  created_at: '2026-11-14T10:00:00.000Z',
  deleted_at: null,
  id: DEFAULT_LIST_ID,
  position: 'a0',
  server_updated_at: '2026-11-14T10:00:00.000Z',
  title: 'Tasks',
  updated_at: '2026-11-14T10:00:00.000Z',
  user_id: 'local',
};

describe('SettingsProvider — Offline Mode off', () => {
  it('lets the lists be read from the server', async () => {
    // Arrange
    writeOfflineMode(false);
    server.use(http.get('*/lists', () => HttpResponse.json([tasksList])));

    // Act
    render(
      <SettingsProvider>
        <ListTitles />
      </SettingsProvider>,
    );

    // Assert
    expect(await screen.findByText('Tasks')).toBeInTheDocument();
  });

  it('starts each Offline Mode off session from an empty cache', async () => {
    // Arrange
    writeOfflineMode(false);
    let reads = 0;
    server.use(
      http.get('*/lists', () => {
        reads += 1;
        return HttpResponse.json([tasksList]);
      }),
    );
    let settings: UserSettings | undefined;
    function Capture() {
      settings = useUserSettings();
      return <ListTitles />;
    }
    render(
      <SettingsProvider>
        <Capture />
      </SettingsProvider>,
    );
    await screen.findByText('Tasks');

    // Act — on (the sync path pulls the lists too), then off again
    act(() => settings!.setOfflineMode(true));
    await waitFor(() => expect(reads).toBeGreaterThan(1));
    const readsBeforeSecondSession = reads;
    act(() => settings!.setOfflineMode(false));

    // Assert — the new session asked the server again instead of reusing a cache
    await waitFor(() => expect(reads).toBe(readsBeforeSecondSession + 1));
    expect(await screen.findByText('Tasks')).toBeInTheDocument();
  });
});

describe('SettingsProvider', () => {
  it('defaults Offline Mode on when nothing is stored', () => {
    // Act
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    // Assert
    expect(screen.getByText('offline-mode-on')).toBeInTheDocument();
  });

  it('reads a stored Offline Mode', () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    // Assert
    expect(screen.getByText('offline-mode-off')).toBeInTheDocument();
  });

  it('persists a change and remounts its children so every hook picks the new path', () => {
    // Arrange
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    expect(onMount).toHaveBeenCalledTimes(1);

    // Act
    act(() => setOfflineMode(false));

    // Assert
    expect(screen.getByText('offline-mode-off')).toBeInTheDocument();
    expect(readOfflineMode()).toBe(false);
    expect(onMount).toHaveBeenCalledTimes(2);
  });
});
