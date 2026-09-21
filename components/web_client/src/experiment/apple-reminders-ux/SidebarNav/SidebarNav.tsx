import './sidebar-nav.css';

import type { Ref } from 'react';
import { useState } from 'react';

import { ChevronGlyph, DestinationGlyph } from '../glyphs';
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
  syncNeedsAttention?: boolean;
}

export function SidebarNav({
  activeListId,
  closeButtonRef,
  destination,
  lists,
  onClose,
  onSelectDestination,
  onSelectList,
  syncNeedsAttention = false,
}: SidebarNavProps) {
  const [listsExpanded, setListsExpanded] = useState(true);

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

      <div className="reminders-sidebar-nav__heading">
        <p className="reminders-sidebar-nav__label" id="reminders-sidebar-lists">
          Lists
        </p>
        <button
          className="reminders-sidebar-nav__heading-action"
          onClick={() => onSelectDestination('lists')}
          type="button"
        >
          Edit Lists
        </button>
        <button
          aria-expanded={listsExpanded}
          aria-label={`${listsExpanded ? 'Collapse' : 'Expand'} Lists`}
          className="reminders-sidebar-nav__disclosure"
          data-expanded={listsExpanded}
          onClick={() => setListsExpanded((expanded) => !expanded)}
          type="button"
        >
          <ChevronGlyph />
        </button>
      </div>

      {listsExpanded ? (
        <ul aria-labelledby="reminders-sidebar-lists" className="reminders-sidebar-nav__items">
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
                  <DestinationGlyph name="list" />
                  {list.title}
                </button>
              </li>
            );
          })}
          {/* Recently Deleted is a list you can open, not a utility — review note 5. */}
          <li>
            <button
              aria-current={destination === 'recently-deleted' ? 'page' : undefined}
              className="reminders-sidebar-nav__item"
              onClick={() => onSelectDestination('recently-deleted')}
              type="button"
            >
              <DestinationGlyph name="recently-deleted" />
              Recently Deleted
            </button>
          </li>
        </ul>
      ) : null}

      <div className="reminders-sidebar-nav__utilities">
        <button
          aria-current={destination === 'sync' ? 'page' : undefined}
          aria-label={syncNeedsAttention ? 'Sync needs attention' : 'Sync clear'}
          className="reminders-sidebar-nav__item"
          data-status={syncNeedsAttention ? 'attention' : 'clear'}
          onClick={() => onSelectDestination('sync')}
          type="button"
        >
          <DestinationGlyph name="sync" />
          Sync
        </button>
        <button
          aria-current={destination === 'settings' ? 'page' : undefined}
          className="reminders-sidebar-nav__item"
          onClick={() => onSelectDestination('settings')}
          type="button"
        >
          <DestinationGlyph name="settings" />
          Settings
        </button>
      </div>
    </nav>
  );
}
