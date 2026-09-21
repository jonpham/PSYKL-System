import './sidebar-nav.css';

import type { Ref } from 'react';
import { useState } from 'react';

import { ChevronGlyph, DestinationGlyph, HeaderGlyph } from '../glyphs';
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
        className="reminders-experiment__header-button"
        onClick={onClose}
        ref={closeButtonRef}
        type="button"
      >
        <HeaderGlyph name="close" />
        PSYKL
      </button>

      <ul className="reminders-sidebar-nav__items">
        {/* Lists is a destination in its own right — the row opens the editor,
         * the chevron unfolds the list names underneath it. */}
        <li>
          <div className="reminders-sidebar-nav__row">
            <button
              aria-current={destination === 'lists' ? 'page' : undefined}
              className="reminders-sidebar-nav__item"
              onClick={() => onSelectDestination('lists')}
              type="button"
            >
              <DestinationGlyph name="lists" />
              Lists
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
            <ul aria-label="Lists" className="reminders-sidebar-nav__sublist">
              {lists.map((list) => (
                <li key={list.id}>
                  <button
                    aria-current={destination === 'list' && list.id === activeListId ? 'page' : undefined}
                    className="reminders-sidebar-nav__subitem"
                    onClick={() => onSelectList(list.id)}
                    type="button"
                  >
                    {list.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </li>

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

        {/* Sync and Settings are app-level, not places your tasks live. */}
        <li className="reminders-sidebar-nav__divider">
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
        </li>

        <li>
          <button
            aria-current={destination === 'settings' ? 'page' : undefined}
            className="reminders-sidebar-nav__item"
            onClick={() => onSelectDestination('settings')}
            type="button"
          >
            <DestinationGlyph name="settings" />
            Settings
          </button>
        </li>
      </ul>
    </nav>
  );
}
