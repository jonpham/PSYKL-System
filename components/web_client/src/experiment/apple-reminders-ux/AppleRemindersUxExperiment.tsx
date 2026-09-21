import './tokens.css';
import './apple-reminders-ux.css';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Toast } from '../../components/Toast';
import { setActiveListId, useActiveListId } from '../../hooks/useActiveList';
import { useLists } from '../../hooks/useLists';
import { useSyncDiscrepancy } from '../../hooks/useSyncDiscrepancy';
import { useTasks } from '../../hooks/useTasks';
import { HeaderGlyph, PlusGlyph } from './glyphs';
import { ListMenu } from './ListMenu';
import { ListsView } from './ListsView';
import { RecentlyDeletedView } from './RecentlyDeletedView';
import { SettingsView } from './SettingsView';
import { showCompletedStore } from './showCompletedStore';
import { SidebarNav } from './SidebarNav';
import { SyncStatus, useFailedSyncCount } from './SyncStatus';
import { TaskListView } from './TaskListView';
import type { Destination } from './types';

export function AppleRemindersUxExperiment() {
  const { canDelete, deleteList, lists } = useLists();
  const activeListId = useActiveListId();
  const { count: queuedCount } = useSyncDiscrepancy();
  const { tasks } = useTasks();
  const failedCount = useFailedSyncCount();
  const [destination, setDestination] = useState<Destination>('list');
  const [showCompleted, setShowCompleted] = useState(true);
  const [creatingList, setCreatingList] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeListId === null && lists[0]) {
      void setActiveListId(lists[0].id);
    }
  }, [activeListId, lists]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    closeButtonRef.current?.focus();
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', dismissOnEscape);
    return () => window.removeEventListener('keydown', dismissOnEscape);
  }, [closeSidebar, sidebarOpen]);

  const activeList = lists.find((list) => list.id === activeListId) ?? lists[0] ?? null;
  const title = destination === 'list' ? (activeList?.title ?? 'Tasks') : destinationTitle(destination);
  const completedCount = tasks.filter((task) => task.completed_at !== null).length;

  useEffect(() => {
    setShowCompleted(showCompletedStore.read(activeList?.id ?? null));
  }, [activeList?.id]);

  function toggleCompleted(next: boolean) {
    setShowCompleted(next);
    showCompletedStore.write(activeList?.id ?? null, next);
  }

  function deleteActiveList() {
    if (!activeList) return;
    void deleteList(activeList.id);
    const next = lists.find((list) => list.id !== activeList.id);
    if (next) void setActiveListId(next.id);
  }

  function selectList(listId: string) {
    void setActiveListId(listId);
    setDestination('list');
    closeSidebar();
  }

  function selectDestination(nextDestination: Exclude<Destination, 'list'>) {
    setDestination(nextDestination);
    closeSidebar();
  }

  return (
    <div className="reminders-experiment">
      <div className="reminders-experiment__layout">
        <button
          aria-expanded={sidebarOpen}
          aria-label="Open PSYKL navigation"
          className="reminders-experiment__header-button reminders-experiment__trigger"
          onClick={() => setSidebarOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <HeaderGlyph name="menu" />
          PSYKL
        </button>
        <aside className="reminders-experiment__sidebar" data-open={sidebarOpen}>
          <SidebarNav
            activeListId={activeList?.id ?? null}
            closeButtonRef={closeButtonRef}
            destination={destination}
            lists={lists}
            onClose={closeSidebar}
            onSelectDestination={selectDestination}
            onSelectList={selectList}
            syncNeedsAttention={queuedCount + failedCount > 0}
          />
        </aside>
        {sidebarOpen ? (
          <button
            aria-label="Dismiss PSYKL navigation"
            className="reminders-experiment__backdrop"
            onClick={closeSidebar}
            type="button"
          />
        ) : null}
        <div className="reminders-experiment__content">
          <Toast />
          {/* One header for every destination, so Sync, Lists, Recently Deleted
           * and Settings read as the same app as the task list. The action
           * column is the sync control on the surfaces where sync is the
           * relevant action, and the destination's own action elsewhere. */}
          <div className="reminders-experiment__content-header">
            <h2>{title}</h2>
            {destination === 'list' || destination === 'sync' ? (
              <SyncStatus
                active={destination === 'sync'}
                failedCount={failedCount}
                onOpen={() => setDestination('sync')}
                queuedCount={queuedCount}
              />
            ) : null}
            {destination === 'lists' ? (
              <button
                aria-label="New List"
                className="reminders-experiment__header-action"
                onClick={() => setCreatingList(true)}
                type="button"
              >
                <PlusGlyph />
              </button>
            ) : null}
            {destination === 'list' ? (
              <ListMenu
                canDelete={canDelete}
                completedCount={completedCount}
                onDeleteList={deleteActiveList}
                onToggleCompleted={toggleCompleted}
                showCompleted={showCompleted}
              />
            ) : null}
          </div>
          {destination === 'list' ? <TaskListView showCompleted={showCompleted} /> : null}
          {destination === 'lists' ? (
            <ListsView creating={creatingList} onCreated={() => setCreatingList(false)} onSelectList={selectList} />
          ) : null}
          {destination === 'recently-deleted' ? <RecentlyDeletedView /> : null}
          {destination === 'settings' ? <SettingsView /> : null}
        </div>
      </div>
    </div>
  );
}

function destinationTitle(destination: Exclude<Destination, 'list'>): string {
  if (destination === 'recently-deleted') return 'Recently Deleted';
  if (destination === 'lists') return 'Lists';
  return destination === 'settings' ? 'Settings' : 'Sync';
}
