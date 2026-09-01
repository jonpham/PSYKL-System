import type { SubmitEvent } from 'react';
import { useState } from 'react';

import type { ListRecord } from '../../../db/idb.types';

interface ListRowProps {
  active?: boolean;
  canDelete: boolean;
  list: ListRecord;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onSelect: (id: string) => void;
}

export function ListRow({ active = false, canDelete, list, onDelete, onRename, onSelect }: ListRowProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(list.title);

  function handleRenameSubmit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = draftTitle.trim();
    if (trimmed) {
      onRename(list.id, trimmed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <li aria-label={list.title} role="listitem" style={{ padding: '0.375rem 0' }}>
        <form onSubmit={handleRenameSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <label htmlFor={`rename-list-${list.id}`} style={{ display: 'none' }}>
            {`Rename ${list.title}`}
          </label>
          <input
            id={`rename-list-${list.id}`}
            onChange={(event) => setDraftTitle(event.target.value)}
            style={{ flex: 1, padding: '0.375rem' }}
            type="text"
            value={draftTitle}
          />
          <button type="submit">Save</button>
        </form>
      </li>
    );
  }

  return (
    <li
      aria-label={list.title}
      role="listitem"
      style={{ alignItems: 'center', display: 'flex', gap: '0.5rem', padding: '0.375rem 0' }}
    >
      <button
        onClick={() => onSelect(list.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          flex: 1,
          fontWeight: active ? 700 : 400,
          padding: '0.25rem 0',
          textAlign: 'left',
        }}
        type="button"
      >
        {list.title}
      </button>
      <button aria-label={`Rename ${list.title}`} onClick={() => setEditing(true)} type="button">
        Rename
      </button>
      {canDelete ? (
        <button aria-label={`Delete ${list.title}`} onClick={() => onDelete(list.id)} type="button">
          Delete
        </button>
      ) : null}
    </li>
  );
}
