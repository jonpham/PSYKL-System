import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { PlusGlyph } from './components/AppShell/Glyphs';
import { ListMenu } from './components/ListMenu';
import { ListsPage } from './components/ListsPage';
import { OutOfSyncBanner } from './components/OutOfSyncBanner';
import { RecentlyDeleted } from './components/RecentlyDeleted';
import { Settings } from './components/Settings';
import { SyncStatus, useFailedSyncCount } from './components/SyncStatus';
import { SyncView } from './components/SyncView';
import { TaskList } from './components/TaskList';
import { Toast } from './components/Toast';
import { VersionFooter } from './components/VersionFooter';
import { setActiveListId, useActiveListId } from './hooks/useActiveList';
import { useCompletedVisibility } from './hooks/useCompletedVisibility';
import { useDestination } from './hooks/useDestination';
import { useLists } from './hooks/useLists';
import { useSyncDiscrepancy } from './hooks/useSyncDiscrepancy';
import { useSyncRecords } from './hooks/useSyncRecords';

export default function App() {
  const { canDelete, deleteList, lists } = useLists();
  const { destination, goTo } = useDestination();
  const activeListId = useActiveListId();
  const { count: queuedCount } = useSyncDiscrepancy();
  const failedCount = useFailedSyncCount();
  const { setShowCompleted, showCompleted } = useCompletedVisibility();
  const [completedCount, setCompletedCount] = useState(0);
  const syncRecords = useSyncRecords();
  const [creatingList, setCreatingList] = useState(false);

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

  const headerAction =
    destination === 'list' || destination === 'sync' ? (
      <>
        <SyncStatus
          active={destination === 'sync'}
          failedCount={failedCount}
          onOpen={() => goTo('sync')}
          queuedCount={queuedCount}
        />
        {destination === 'list' ? (
          <ListMenu
            canDelete={canDelete}
            completedCount={completedCount}
            onDeleteList={() => {
              if (activeList) void deleteList(activeList.id);
            }}
            onToggleCompleted={setShowCompleted}
            showCompleted={showCompleted}
          />
        ) : null}
      </>
    ) : destination === 'lists' ? (
      <button
        aria-label="New List"
        className="psykl-app-shell__header-action"
        onClick={() => setCreatingList(true)}
        type="button"
      >
        <PlusGlyph />
      </button>
    ) : undefined;

  return (
    <AppShell headerAction={headerAction} title={title}>
      <Toast />
      <RecentlyDeleted onClose={() => goTo('list')} open={destination === 'recently-deleted'} />
      <Settings onClose={() => goTo('list')} open={destination === 'settings'} />
      <OutOfSyncBanner />
      {destination === 'sync' ? <SyncView failed={syncRecords.failed} queued={syncRecords.queued} /> : null}
      {destination === 'lists' ? (
        <ListsPage
          creating={creatingList}
          onCreated={() => setCreatingList(false)}
          onSelectList={(listId) => {
            void setActiveListId(listId);
            goTo('list');
          }}
        />
      ) : null}
      {destination === 'list' ? (
        <section data-testid="task-ui-slot">
          <TaskList onCompletedCountChange={setCompletedCount} />
        </section>
      ) : null}
      <VersionFooter />
    </AppShell>
  );
}
