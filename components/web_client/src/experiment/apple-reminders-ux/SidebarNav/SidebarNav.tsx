import './sidebar-nav.css';

import type { Ref } from 'react';

import type { Destination } from '../types';

interface SidebarList {
  id: string;
  title: string;
}

interface SidebarNavProps {
  activeListId: string | null;
  closeButtonRef?: Ref<HTMLButtonElement>;
  destination: Destination;
  lists: SidebarList[];
  onClose: () => void;
  onSelectDestination: (destination: Exclude<Destination, 'list'>) => void;
  onSelectList: (listId: string) => void;
}

export function SidebarNav({
  activeListId,
  closeButtonRef,
  destination,
  lists,
  onClose,
  onSelectDestination,
  onSelectList,
}: SidebarNavProps) {
  return (
    <nav aria-label="PSYKL navigation" className="reminders-sidebar-nav">
      <button
        aria-label="Close PSYKL navigation"
        className="reminders-sidebar-nav__close"
        onClick={onClose}
        ref={closeButtonRef}
        type="button"
      >
        <span aria-hidden="true">×</span> PSYKL
      </button>
      <p className="reminders-sidebar-nav__label">Lists</p>
      <ul className="reminders-sidebar-nav__items">
        {lists.map((list) => {
          const current = destination === 'list' && list.id === activeListId;
          return (
            <li key={list.id}>
              <button
                aria-current={current ? 'page' : undefined}
                className="reminders-sidebar-nav__item"
                onClick={() => onSelectList(list.id)}
                type="button"
              >
                <span aria-hidden="true">•</span> {list.title}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="reminders-sidebar-nav__utilities">
        <button
          aria-current={destination === 'recently-deleted' ? 'page' : undefined}
          className="reminders-sidebar-nav__item"
          onClick={() => onSelectDestination('recently-deleted')}
          type="button"
        >
          <span aria-hidden="true">↺</span> Recently Deleted
        </button>
        <button
          aria-current={destination === 'settings' ? 'page' : undefined}
          className="reminders-sidebar-nav__item"
          onClick={() => onSelectDestination('settings')}
          type="button"
        >
          <span aria-hidden="true">⚙</span> Settings
        </button>
      </div>
    </nav>
  );
}
