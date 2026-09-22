import './sidebar-nav.css';

import type { Ref } from 'react';
import { useState } from 'react';

import type { Destination } from '../../../hooks/useDestination';
import { ChevronGlyph, DestinationGlyph, HeaderGlyph } from '../Glyphs';

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

function SidebarNav({
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
    <nav aria-label="PSYKL navigation" className="psykl-sidebar-nav">
      <button
        aria-label="Close PSYKL navigation"
        className="psykl-app-shell__header-button"
        onClick={onClose}
        ref={closeButtonRef}
        type="button"
      >
        <HeaderGlyph name="close" /> PSYKL
      </button>
      <ul className="psykl-sidebar-nav__items">
        <li>
          <div className="psykl-sidebar-nav__row">
            <button
              aria-current={destination === 'lists' ? 'page' : undefined}
              className="psykl-sidebar-nav__item"
              onClick={() => onSelectDestination('lists')}
              type="button"
            >
              <DestinationGlyph name="lists" /> Lists
            </button>
            <button
              aria-expanded={listsExpanded}
              aria-label={`${listsExpanded ? 'Collapse' : 'Expand'} Lists`}
              className="psykl-sidebar-nav__disclosure"
              data-expanded={listsExpanded}
              onClick={() => setListsExpanded((value) => !value)}
              type="button"
            >
              <ChevronGlyph />
            </button>
          </div>
          {listsExpanded ? (
            <ul aria-label="Lists" className="psykl-sidebar-nav__sublist">
              {lists.map((list) => (
                <li key={list.id}>
                  <button
                    aria-current={destination === 'list' && list.id === activeListId ? 'page' : undefined}
                    className="psykl-sidebar-nav__subitem"
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
            className="psykl-sidebar-nav__item"
            onClick={() => onSelectDestination('recently-deleted')}
            type="button"
          >
            <DestinationGlyph name="recently-deleted" /> Recently Deleted
          </button>
        </li>
        <li className="psykl-sidebar-nav__divider">
          <button
            aria-current={destination === 'sync' ? 'page' : undefined}
            className="psykl-sidebar-nav__item"
            data-status={syncNeedsAttention ? 'attention' : 'clear'}
            onClick={() => onSelectDestination('sync')}
            type="button"
          >
            <DestinationGlyph name="sync" /> Sync
          </button>
        </li>
        <li>
          <button
            aria-current={destination === 'settings' ? 'page' : undefined}
            className="psykl-sidebar-nav__item"
            onClick={() => onSelectDestination('settings')}
            type="button"
          >
            <DestinationGlyph name="settings" /> Settings
          </button>
        </li>
      </ul>
    </nav>
  );
}

export { SidebarNav };
