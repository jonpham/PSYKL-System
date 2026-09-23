import './editable-title.css';

import { useInlineEdit } from '../../../hooks/useInlineEdit';

interface EditableTitleProps {
  onRename: (title: string) => void;
  title: string;
}

/**
 * The list name, renamed from the list itself.
 *
 * Reachable only in selection mode: the header is already given over to editing
 * the list there, so the name can be edited without competing with the list
 * menu the header carries the rest of the time. Commit semantics come from
 * `useInlineEdit`, the same ones a task row's title has.
 */
export function EditableTitle({ onRename, title }: EditableTitleProps) {
  const { draft, editing, inputProps, start } = useInlineEdit({ onCommit: onRename, value: title });

  return (
    <h2 className="psykl-editable-title">
      {editing ? (
        <input
          aria-label="List name"
          className="psykl-editable-title__input"
          maxLength={100}
          {...inputProps}
          value={draft}
        />
      ) : (
        <button aria-label={`Rename ${title}`} className="psykl-editable-title__trigger" onClick={start} type="button">
          {title}
        </button>
      )}
    </h2>
  );
}
