import './app-shell.css';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { setActiveListId, useActiveListId } from '../../hooks/useActiveList';
import { useDestination } from '../../hooks/useDestination';
import { useLists } from '../../hooks/useLists';
import { BrandMark } from './BrandMark';
import { EditableTitle } from './EditableTitle';
import { SidebarNav } from './SidebarNav';

interface AppShellProps {
  children: ReactNode;
  headerAction?: ReactNode;
  /** Present only where the title is the user's to change, which today means
   * a list in selection mode; otherwise the title is a plain heading. */
  onRenameTitle?: (title: string) => void;
  title: string;
}

function AppShell({ children, headerAction, onRenameTitle, title }: AppShellProps) {
  const { destination, goTo } = useDestination();
  const { lists } = useLists();
  const activeListId = useActiveListId();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    closeButtonRef.current?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [closeSidebar, sidebarOpen]);

  return (
    <div className="psykl-app-shell">
      <div className="psykl-app-shell__layout">
        <button
          aria-expanded={sidebarOpen}
          aria-label="Open PSYKL navigation"
          className="psykl-app-shell__header-button psykl-app-shell__trigger"
          onClick={() => setSidebarOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <BrandMark /> PSYKL
        </button>
        <aside className="psykl-app-shell__sidebar" data-open={sidebarOpen}>
          <SidebarNav
            activeListId={activeListId}
            closeButtonRef={closeButtonRef}
            destination={destination}
            lists={lists}
            onClose={closeSidebar}
            onSelectDestination={(next) => {
              goTo(next);
              closeSidebar();
            }}
            onSelectList={(id) => {
              void setActiveListId(id);
              goTo('list');
              closeSidebar();
            }}
          />
        </aside>
        {sidebarOpen ? (
          <button
            aria-label="Dismiss PSYKL navigation"
            className="psykl-app-shell__backdrop"
            onClick={closeSidebar}
            type="button"
          />
        ) : null}
        <main className="psykl-app-shell__main">
          <div className="psykl-app-shell__content">
            <div className="psykl-app-shell__content-header" data-destination={destination}>
              {onRenameTitle ? <EditableTitle onRename={onRenameTitle} title={title} /> : <h2>{title}</h2>}
              {headerAction}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
