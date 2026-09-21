import './lists-view.css';

import { useRef, useState } from 'react';

import { useLists } from '../../../hooks/useLists';
import { DestinationGlyph } from '../glyphs';

/** Rename and re-order lists — the mechanism review note 4 found missing.
 * Re-ordering is click-driven rather than drag-driven on purpose: the gesture
 * belongs to a later iteration, and click order is testable today. */
export function ListsView() {
  const { createList, lists, moveList, renameList } = useLists();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
            {editingId === list.id ? (
              <InlineName
                initial={list.title}
                label="List name"
                onCancel={() => setEditingId(null)}
                onCommit={(title) => {
                  setEditingId(null);
                  if (title !== list.title) void renameList(list.id, title);
                }}
              />
            ) : (
              <button
                aria-label={`Rename ${list.title}`}
                className="reminders-lists__name"
                onClick={() => setEditingId(list.id)}
                type="button"
              >
                {list.title}
              </button>
            )}
            <div className="reminders-lists__move">
              <button
                aria-label={`Move ${list.title} up`}
                className="reminders-lists__move-button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                type="button"
              >
                <MoveGlyph direction="up" />
              </button>
              <button
                aria-label={`Move ${list.title} down`}
                className="reminders-lists__move-button"
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
            <InlineName
              initial=""
              label="New list name"
              onCancel={() => setCreating(false)}
              onCommit={(title) => {
                setCreating(false);
                if (title) void createList(title);
              }}
            />
          </li>
        ) : null}
      </ul>

      <button className="reminders-lists__add" onClick={() => setCreating(true)} type="button">
        <span aria-hidden="true">+</span> New List
      </button>
    </div>
  );
}

interface InlineNameProps {
  initial: string;
  label: string;
  onCancel: () => void;
  onCommit: (title: string) => void;
}

function InlineName({ initial, label, onCancel, onCommit }: InlineNameProps) {
  const [draft, setDraft] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  return (
    <input
      aria-label={label}
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
      ref={inputRef}
      type="text"
      value={draft}
    />
  );
}

function MoveGlyph({ direction }: { direction: 'down' | 'up' }) {
  return (
    <svg aria-hidden="true" className="reminders-lists__move-glyph" data-direction={direction} viewBox="0 0 24 24">
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}
