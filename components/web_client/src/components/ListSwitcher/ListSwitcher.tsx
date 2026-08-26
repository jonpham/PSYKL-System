import type { SubmitEvent } from 'react';
import { useState } from 'react';

import { useLists } from '../../hooks/useLists';
import { ListRow } from './ListRow';

interface ListSwitcherProps {
  activeListId?: string | null;
  onClose?: () => void;
  onSelect: (listId: string) => void;
  open: boolean;
}

export function ListSwitcher({ activeListId = null, onClose, onSelect, open }: ListSwitcherProps) {
  const { canDelete, createList, deleteList, lists, renameList } = useLists();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!open) {
    return null;
  }

  async function handleCreateSubmit(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      return;
    }
    // Creating a list adds it to the (still-open) switcher; the user taps
    // the new row to select it, same as any other list (per UX.md § 5's
    // "creates a list and it appears in the list switcher" story — the sheet
    // does not auto-close on create).
    await createList(trimmed);
    setNewTitle('');
    setCreating(false);
  }

  return (
    <div
      aria-label="List switcher"
      role="dialog"
      style={{ border: '1px solid #ccc', borderRadius: 4, padding: '1rem' }}
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {lists.map((list) => (
          <ListRow
            active={list.id === activeListId}
            canDelete={canDelete}
            key={list.id}
            list={list}
            onDelete={(id) => void deleteList(id)}
            onRename={(id, title) => void renameList(id, title)}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {creating ? (
        <form
          onSubmit={(event) => void handleCreateSubmit(event)}
          style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
        >
          <label htmlFor="new-list-title" style={{ display: 'none' }}>
            List name
          </label>
          <input
            id="new-list-title"
            autoFocus
            onChange={(event) => setNewTitle(event.target.value)}
            style={{ flex: 1, padding: '0.375rem' }}
            type="text"
            value={newTitle}
          />
          <button type="submit">Add</button>
        </form>
      ) : (
        <button onClick={() => setCreating(true)} style={{ marginTop: '0.5rem' }} type="button">
          New List
        </button>
      )}
      {onClose ? (
        <button onClick={onClose} style={{ marginLeft: '0.5rem', marginTop: '0.5rem' }} type="button">
          Close
        </button>
      ) : null}
    </div>
  );
}
