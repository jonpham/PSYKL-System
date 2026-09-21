import './tokens.css';
import './apple-reminders-ux.css';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Toast } from '../../components/Toast';
import { setActiveListId, useActiveListId } from '../../hooks/useActiveList';
import { useLists } from '../../hooks/useLists';
import { useSyncDiscrepancy } from '../../hooks/useSyncDiscrepancy';
import { useTasks } from '../../hooks/useTasks';
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
  const { lists } = useLists();
  const activeListId = useActiveListId();
  const { count: queuedCount } = useSyncDiscrepancy();
  const { tasks } = useTasks();
  const failedCount = useFailedSyncCount();
  const [destination, setDestination] = useState<Destination>('list');
  const [showCompleted, setShowCompleted] = useState(true);
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
          className="reminders-experiment__trigger"
          onClick={() => setSidebarOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <span aria-hidden="true">☰</span> PSYKL
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
           * and Settings read as the same app as the task list. */}
          <div className="reminders-experiment__content-header">
            <h2>{title}</h2>
            {destination === 'list' ? (
              <ListMenu
                completedCount={completedCount}
                onToggleCompleted={toggleCompleted}
                showCompleted={showCompleted}
              />
            ) : null}
            <SyncStatus
              active={destination === 'sync'}
              failedCount={failedCount}
              onOpen={() => setDestination('sync')}
              queuedCount={queuedCount}
            />
          </div>
          {destination === 'list' ? <TaskListView showCompleted={showCompleted} /> : null}
          {destination === 'lists' ? <ListsView /> : null}
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
