import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { ListSwitcher } from './components/ListSwitcher';
import { OutOfSyncBanner } from './components/OutOfSyncBanner';
import { RecentlyDeleted } from './components/RecentlyDeleted';
import { Settings } from './components/Settings';
import { SyncStatus, useFailedSyncCount } from './components/SyncStatus';
import { TaskCreateForm } from './components/TaskCreateForm';
import { TaskList } from './components/TaskList';
import { Toast } from './components/Toast';
import { VersionFooter } from './components/VersionFooter';
import { setActiveListId, useActiveListId } from './hooks/useActiveList';
import { useDestination } from './hooks/useDestination';
import { useLists } from './hooks/useLists';
import { useSyncDiscrepancy } from './hooks/useSyncDiscrepancy';

export default function App() {
  const { lists } = useLists();
  const { destination, goTo } = useDestination();
  const activeListId = useActiveListId();
  const { count: queuedCount } = useSyncDiscrepancy();
  const failedCount = useFailedSyncCount();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Defaults to the first list once one exists (the "Tasks" default list on
  // first run, per UX.md § 10 decision 1) if no active list has been chosen
  // yet on this device.
  useEffect(() => {
    if (activeListId === null && lists.length > 0) {
      const defaultList = lists[0];
      if (defaultList) {
        void setActiveListId(defaultList.id);
      }
    }
  }, [activeListId, lists]);

  const activeList = lists.find((list) => list.id === activeListId) ?? lists[0] ?? null;
  const activeListTitle = activeList?.title ?? 'Tasks';

  const title =
    destination === 'list'
      ? activeListTitle
      : destination === 'recently-deleted'
        ? 'Recently Deleted'
        : destination === 'settings'
          ? 'Settings'
          : destination === 'lists'
            ? 'Lists'
            : 'Sync';

  return (
    <AppShell
      headerAction={
        destination === 'list' || destination === 'sync' ? (
          <SyncStatus
            active={destination === 'sync'}
            failedCount={failedCount}
            onOpen={() => goTo('sync')}
            queuedCount={queuedCount}
          />
        ) : undefined
      }
      title={title}
    >
      <Toast />
      <ListSwitcher
        activeListId={activeListId}
        onClose={() => setSwitcherOpen(false)}
        onSelect={(listId) => {
          void setActiveListId(listId);
          setSwitcherOpen(false);
        }}
        open={switcherOpen}
      />
      <RecentlyDeleted onClose={() => goTo('list')} open={destination === 'recently-deleted'} />
      <Settings onClose={() => goTo('list')} open={destination === 'settings'} />
      <OutOfSyncBanner />
      {destination === 'list' ? (
        <section data-testid="task-ui-slot">
          <TaskCreateForm />
          <TaskList />
        </section>
      ) : null}
      <VersionFooter />
    </AppShell>
  );
}
