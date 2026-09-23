import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { DoneSelectingButton } from './components/AppShell/DoneSelectingButton';
import { PlusGlyph } from './components/AppShell/Glyphs';
import { ListMenu } from './components/ListMenu';
import { ListsPage } from './components/ListsPage';
import { RecentlyDeleted } from './components/RecentlyDeleted';
import { SettingsView } from './components/SettingsView';
import { SyncStatus, useFailedSyncCount } from './components/SyncStatus';
import { SyncView } from './components/SyncView';
import { TaskList } from './components/TaskList';
import { setActiveListId, useActiveListId } from './hooks/useActiveList';
import { useCompletedVisibility } from './hooks/useCompletedVisibility';
import { useDestination } from './hooks/useDestination';
import { useLists } from './hooks/useLists';
import { useSyncDiscrepancy } from './hooks/useSyncDiscrepancy';
import { useSyncRecords } from './hooks/useSyncRecords';

export default function App() {
  const { canDelete, deleteList, lists, renameList } = useLists();
  const { destination, goTo } = useDestination();
  const activeListId = useActiveListId();
  const { count: queuedCount } = useSyncDiscrepancy();
  const failedCount = useFailedSyncCount();
  const { setShowCompleted, showCompleted } = useCompletedVisibility();
  const [completedCount, setCompletedCount] = useState(0);
  const syncRecords = useSyncRecords();
  const [creatingList, setCreatingList] = useState(false);
  const [selecting, setSelecting] = useState(false);

  // Selection mode belongs to one list; walking away from the list leaves it.
  useEffect(() => {
    if (destination !== 'list') {
      setSelecting(false);
    }
  }, [destination]);

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

  // Selection mode owns the header: the way out is the only control there, so
  // the sync affordance steps aside until the user leaves the mode.
  const headerAction =
    destination === 'list' && selecting ? (
      <DoneSelectingButton onClick={() => setSelecting(false)} />
    ) : destination === 'list' || destination === 'sync' ? (
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
            onSelectItems={() => setSelecting(true)}
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
    <AppShell
      headerAction={headerAction}
      onRenameTitle={
        destination === 'list' && selecting && activeList ? (next) => void renameList(activeList.id, next) : undefined
      }
      title={title}
    >
      <RecentlyDeleted open={destination === 'recently-deleted'} />
      {destination === 'settings' ? <SettingsView /> : null}
      {destination === 'sync' ? (
        <SyncView
          failed={syncRecords.failed}
          onDismissReplacedEdit={syncRecords.dismissReplacedEdit}
          queued={syncRecords.queued}
          replacedEdits={syncRecords.replacedEdits}
        />
      ) : null}
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
          <TaskList
            onCompletedCountChange={setCompletedCount}
            onExitSelection={() => setSelecting(false)}
            selecting={selecting}
          />
        </section>
      ) : null}
    </AppShell>
  );
}
