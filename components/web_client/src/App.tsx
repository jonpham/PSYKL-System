import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { DoneSelectingButton } from './components/AppShell/DoneSelectingButton';
import { PlusGlyph } from './components/AppShell/Glyphs';
import { DeleteListDialog } from './components/DeleteListDialog';
import { HeaderSyncStatus } from './components/HeaderSyncStatus';
import { ListMenu } from './components/ListMenu';
import { ListsPage } from './components/ListsPage';
import { RecentlyDeleted } from './components/RecentlyDeleted';
import { SettingsView } from './components/SettingsView';
import { SyncDestination } from './components/SyncDestination';
import { TaskList } from './components/TaskList';
import { setActiveListId, useActiveListId } from './hooks/useActiveList';
import { useCompletedVisibility } from './hooks/useCompletedVisibility';
import { useDestination } from './hooks/useDestination';
import { useListDeletion } from './hooks/useListDeletion';
import { useLists } from './hooks/useLists';
import { useUserSettings } from './hooks/useUserSettings';

export default function App() {
  const { canDeleteList, lists, renameList } = useLists();
  const { activeListItemCount, deleteActiveList } = useListDeletion();
  const { destination, goTo } = useDestination();
  const activeListId = useActiveListId();
  const { offlineMode } = useUserSettings();
  const { setShowCompleted, showCompleted } = useCompletedVisibility();
  const [completedCount, setCompletedCount] = useState(0);
  const [creatingList, setCreatingList] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [deletingList, setDeletingList] = useState(false);

  // Selection mode belongs to one list; walking away from the list leaves it.
  // The delete question belongs to one list too, and is retired the same way.
  useEffect(() => {
    if (destination !== 'list') {
      setSelecting(false);
      setDeletingList(false);
    }
  }, [destination]);

  // Sync is the sync path's destination. With Offline Mode off there is
  // nothing waiting on this device to show, so a link to it opens the list,
  // in place of the visit, so going back does not return to it.
  useEffect(() => {
    if (!offlineMode && destination === 'sync') {
      goTo('list', { replace: true });
    }
  }, [destination, goTo, offlineMode]);

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
        {offlineMode ? <HeaderSyncStatus active={destination === 'sync'} onOpen={() => goTo('sync')} /> : null}
        {destination === 'list' ? (
          <ListMenu
            canDelete={activeList !== null && canDeleteList(activeList.id)}
            completedCount={completedCount}
            onRequestDeleteList={() => setDeletingList(true)}
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
      showSync={offlineMode}
      onRenameTitle={
        destination === 'list' && selecting && activeList ? (next) => void renameList(activeList.id, next) : undefined
      }
      title={title}
    >
      <RecentlyDeleted open={destination === 'recently-deleted'} />
      {destination === 'settings' ? <SettingsView /> : null}
      {offlineMode ? <SyncDestination open={destination === 'sync'} /> : null}
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
      {deletingList && activeList ? (
        <DeleteListDialog
          itemCount={activeListItemCount}
          listTitle={activeList.title}
          onCancel={() => setDeletingList(false)}
          onDelete={(mode) => {
            setDeletingList(false);
            void deleteActiveList(mode);
          }}
        />
      ) : null}
    </AppShell>
  );
}
