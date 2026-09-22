import './lists-page.css';

import { useLayoutEffect, useRef, useState } from 'react';

import { useLists } from '../../hooks/useLists';
import { DestinationGlyph } from '../AppShell/Glyphs';

interface ListsPageProps {
  creating?: boolean;
  onCreated?: () => void;
  onSelectList?: (listId: string) => void;
}

/** Re-order lists, and add one. Renaming happens in the list itself, and
 * deletion lives in that list's options menu — this page stays uncluttered. */
export function ListsPage({ creating = false, onCreated, onSelectList }: ListsPageProps) {
  const { createList, lists, moveList } = useLists();

  function move(index: number, direction: -1 | 1): void {
    const target = lists[index];
    if (!target) return;
    const [before, after] =
      direction === -1
        ? [lists[index - 2] ?? null, lists[index - 1] ?? null]
        : [lists[index + 1] ?? null, lists[index + 2] ?? null];
    void moveList(target.id, before, after);
  }

  return (
    <div className="psykl-lists">
      <ul className="psykl-lists__rows">
        {lists.map((list, index) => (
          <li className="psykl-lists__row" key={list.id}>
            <DestinationGlyph name="list" />
            <button className="psykl-lists__name" onClick={() => onSelectList?.(list.id)} type="button">
              {list.title}
            </button>
            <div className="psykl-lists__actions">
              <button
                aria-label={`Move ${list.title} up`}
                className="psykl-lists__action"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                type="button"
              >
                <MoveGlyph direction="up" />
              </button>
              <button
                aria-label={`Move ${list.title} down`}
                className="psykl-lists__action"
                disabled={index === lists.length - 1}
                onClick={() => move(index, 1)}
                type="button"
              >
                <MoveGlyph direction="down" />
              </button>
            </div>
          </li>
        ))}

        {creating ? (
          <li className="psykl-lists__row">
            <DestinationGlyph name="list" />
            <NewListName
              onCancel={() => onCreated?.()}
              onCommit={(title) => {
                onCreated?.();
                if (title) void createList(title);
              }}
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function NewListName({ onCancel, onCommit }: { onCancel: () => void; onCommit: (title: string) => void }) {
  const [draft, setDraft] = useState('');
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Not `autoFocus`: that lands after paint, and the first characters typed
  // were silently dropped — "Book dentist" arrived as "k dentist".
  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <input
      aria-label="New list name"
      className="psykl-lists__input"
      maxLength={100}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          onCancel();
          return;
        }
        onCommit(draft.trim());
      }}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') cancelledRef.current = true;
        if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur();
      }}
      ref={inputRef}
      type="text"
      value={draft}
    />
  );
}

function MoveGlyph({ direction }: { direction: 'down' | 'up' }) {
  return (
    <svg aria-hidden="true" className="psykl-lists__glyph" data-direction={direction} viewBox="0 0 24 24">
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}
