import './editable-title.css';

import { useEffect, useRef, useState } from 'react';

interface EditableTitleProps {
  onRename: (title: string) => void;
  title: string;
}

/**
 * The list name, renamed from the list itself.
 *
 * Reachable only in selection mode: the header is already given over to
 * editing the list there, so the name can be edited without competing with the
 * list menu the header carries the rest of the time. The commit semantics
 * mirror a task row's inline edit — blur is the single commit point, Enter and
 * Escape blur, and Escape discards the draft.
 */
export function EditableTitle({ onRename, title }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const cancelEditRef = useRef(false);

  // A rename from another device (or another tab) should show here too, rather
  // than leaving a stale name behind a button that claims to rename it.
  useEffect(() => {
    setDraft(title);
  }, [title]);

  function commit(value: string): void {
    const nextTitle = value.trim();
    if (!nextTitle || nextTitle === title) {
      setDraft(title);
      return;
    }
    onRename(nextTitle);
  }

  function handleBlur(): void {
    if (!cancelEditRef.current) {
      commit(draft);
    } else {
      setDraft(title);
    }
    cancelEditRef.current = false;
    setEditing(false);
  }

  return (
    <h2 className="psykl-editable-title">
      {editing ? (
        <input
          aria-label="List name"
          autoFocus
          className="psykl-editable-title__input"
          maxLength={100}
          onBlur={handleBlur}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            } else if (event.key === 'Escape') {
              cancelEditRef.current = true;
              event.currentTarget.blur();
            }
          }}
          value={draft}
        />
      ) : (
        <button
          aria-label={`Rename ${title}`}
          className="psykl-editable-title__trigger"
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
          type="button"
        >
          {title}
        </button>
      )}
    </h2>
  );
}
