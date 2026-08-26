import { useEffect, useState } from 'react';

import { ListSwitcher } from './components/ListSwitcher';
import { TaskCreateForm } from './components/TaskCreateForm';
import { TaskList } from './components/TaskList';
import { Toast } from './components/Toast';
import { VersionFooter } from './components/VersionFooter';
import { setActiveListId, useActiveListId } from './hooks/useActiveList';
import { useLists } from './hooks/useLists';

export default function App() {
  const { lists } = useLists();
  const activeListId = useActiveListId();
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

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        margin: '0 auto',
        maxWidth: 640,
        padding: '2rem',
      }}
    >
      <h1>PSYKL</h1>
      <p>Time-independent planning. M1 bootstrap shell.</p>
      <Toast />
      <button
        aria-label={`Open list switcher: ${activeListTitle}`}
        onClick={() => setSwitcherOpen(true)}
        style={{
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: '1rem',
          margin: '1rem 0 0',
          padding: '0.5rem 0.75rem',
        }}
        type="button"
      >
        {activeListTitle}
      </button>
      <ListSwitcher
        activeListId={activeListId}
        onClose={() => setSwitcherOpen(false)}
        onSelect={(listId) => {
          void setActiveListId(listId);
          setSwitcherOpen(false);
        }}
        open={switcherOpen}
      />
      <section data-testid="task-ui-slot">
        <TaskCreateForm />
        <TaskList />
      </section>
      <VersionFooter />
    </main>
  );
}
