import './apple-reminders-ux.css';

import { useCallback, useEffect, useRef, useState } from 'react';

import { OutOfSyncBanner } from '../../components/OutOfSyncBanner';
import { RecentlyDeleted } from '../../components/RecentlyDeleted';
import { TaskCreateForm } from '../../components/TaskCreateForm';
import { TaskList } from '../../components/TaskList';
import { Toast } from '../../components/Toast';
import { setActiveListId, useActiveListId } from '../../hooks/useActiveList';
import { useLists } from '../../hooks/useLists';
import { SettingsView } from './SettingsView';
import { SidebarNav } from './SidebarNav';
import type { Destination } from './types';

export function AppleRemindersUxExperiment() {
  const { lists } = useLists();
  const activeListId = useActiveListId();
  const [destination, setDestination] = useState<Destination>('list');
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
          {destination === 'settings' ? null : <h2>{title}</h2>}
          {destination === 'list' ? (
            <>
              <OutOfSyncBanner />
              <TaskCreateForm />
              <TaskList />
            </>
          ) : null}
          {destination === 'recently-deleted' ? <RecentlyDeleted open /> : null}
          {destination === 'settings' ? <SettingsView /> : null}
        </div>
      </div>
    </div>
  );
}

function destinationTitle(destination: Exclude<Destination, 'list'>): string {
  return destination === 'recently-deleted' ? 'Recently Deleted' : 'Settings';
}
