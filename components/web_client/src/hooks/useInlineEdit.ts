import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

/** Either element an inline field can be. A single-line name stays an `input`;
 * a task title is a `textarea`, because it has to wrap the way the rendered
 * title does. The hook does not care which — only that Enter ends the edit. */
type InlineField = HTMLInputElement | HTMLTextAreaElement;

interface UseInlineEditOptions {
  /** Called with the trimmed value, only when it actually changed. */
  onCommit: (value: string) => void;
  /** The stored value — the source of truth the draft starts from. */
  value: string;
}

interface InlineEdit {
  draft: string;
  editing: boolean;
  /** Spread onto the input; the caller still owns `value` and its label. */
  inputProps: {
    autoFocus: true;
    onBlur: (event: FocusEvent<InlineField>) => void;
    onChange: (event: ChangeEvent<InlineField>) => void;
    onKeyDown: (event: KeyboardEvent<InlineField>) => void;
  };
  /** Opens the field, seeded from the current stored value. */
  start: () => void;
}

/**
 * Editing a stored string in place: a task's title, a list's name.
 *
 * Blur is the single commit point — Enter and Escape blur the field rather than
 * committing directly, so there is one path to reason about — and Escape arms a
 * flag that makes the ensuing blur discard the draft. An unchanged or emptied
 * field commits nothing, and a value that changes elsewhere (another tab, a
 * sync from another device) flows into the draft rather than leaving a stale
 * one behind.
 *
 * The field may be an `input` or a `textarea`. Enter always ends the edit — in
 * a textarea that means it commits rather than inserting a newline, since a
 * task title is one paragraph that wraps, not a multi-line document.
 *
 * Deliberately NOT used by `CaptureRow`: capture creates rather than edits, so
 * it keeps the field open after a successful save, shows a retry message on
 * failure, and treats an empty field as "throw this row away" — different
 * semantics wearing similar state.
 */
function useInlineEdit({ onCommit, value }: UseInlineEditOptions): InlineEdit {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelRef = useRef(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit(next: string): void {
    const trimmed = next.trim();
    if (!trimmed || trimmed === value) {
      setDraft(value);
      return;
    }
    onCommit(trimmed);
  }

  return {
    draft,
    editing,
    inputProps: {
      autoFocus: true,
      onBlur: () => {
        if (cancelRef.current) {
          setDraft(value);
        } else {
          commit(draft);
        }
        cancelRef.current = false;
        setEditing(false);
      },
      onChange: (event) => setDraft(event.target.value),
      onKeyDown: (event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          cancelRef.current = true;
          event.currentTarget.blur();
        }
      },
    },
    start: () => {
      setDraft(value);
      setEditing(true);
    },
  };
}

export { useInlineEdit };
