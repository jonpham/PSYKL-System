import './lists-view.css';

import { useRef, useState } from 'react';

import { useLists } from '../../../hooks/useLists';
import { DestinationGlyph } from '../glyphs';

interface ListsViewProps {
  creating?: boolean;
  onCreated?: () => void;
  onSelectList?: (listId: string) => void;
}

/** Re-order lists, and add one. Renaming happens in the list itself, and
 * deletion lives in that list's options menu — this page stays uncluttered. */
export function ListsView({ creating = false, onCreated, onSelectList }: ListsViewProps) {
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
    <div className="reminders-lists">
      <ul className="reminders-lists__rows">
        {lists.map((list, index) => (
          <li className="reminders-lists__row" key={list.id}>
            <DestinationGlyph name="list" />
            <button className="reminders-lists__name" onClick={() => onSelectList?.(list.id)} type="button">
              {list.title}
            </button>
            <div className="reminders-lists__actions">
              <button
                aria-label={`Move ${list.title} up`}
                className="reminders-lists__action"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                type="button"
              >
                <MoveGlyph direction="up" />
              </button>
              <button
                aria-label={`Move ${list.title} down`}
                className="reminders-lists__action"
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
          <li className="reminders-lists__row">
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

  return (
    <input
      aria-label="New list name"
      autoFocus
      className="reminders-lists__input"
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
      type="text"
      value={draft}
    />
  );
}

function MoveGlyph({ direction }: { direction: 'down' | 'up' }) {
  return (
    <svg aria-hidden="true" className="reminders-lists__glyph" data-direction={direction} viewBox="0 0 24 24">
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}
