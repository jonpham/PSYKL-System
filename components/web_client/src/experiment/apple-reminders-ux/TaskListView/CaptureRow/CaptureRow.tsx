import './capture-row.css';

import { useLayoutEffect, useRef, useState } from 'react';

interface CaptureRowProps {
  onCancel: () => void;
  onCreate: (title: string) => Promise<void>;
}

/** Reminders' capture: an empty row appended in place, where Return saves and
 * immediately offers the next one, and leaving an empty row throws it away. */
export function CaptureRow({ onCancel, onCreate }: CaptureRowProps) {
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  // `autoFocus` focuses after paint, so keystrokes typed in that window land on
  // the New Reminder button and are lost — "Book dentist" arrived as "k dentist".
  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function save(title: string): Promise<boolean> {
    savingRef.current = true;
    try {
      await onCreate(title);
      setDraft('');
      setErrorMessage(null);
      return true;
    } catch {
      setErrorMessage('That task could not be saved. It is still here — try again.');
      return false;
    } finally {
      savingRef.current = false;
    }
  }

  async function handleKeyDown(key: string): Promise<void> {
    if (key === 'Escape') {
      onCancel();
      return;
    }
    if (key !== 'Enter') return;

    const title = draft.trim();
    if (!title) {
      onCancel();
      return;
    }
    const saved = await save(title);
    if (saved) {
      inputRef.current?.focus();
    }
  }

  async function handleBlur(): Promise<void> {
    if (savingRef.current) return;
    const title = draft.trim();
    if (!title) {
      onCancel();
      return;
    }
    const saved = await save(title);
    if (saved) {
      onCancel();
    }
  }

  return (
    <li className="reminders-capture-row">
      <span aria-hidden="true" className="reminders-capture-row__bullet">
        <svg viewBox="0 0 22 22">
          <circle cx="11" cy="11" fill="none" r="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <input
        aria-label="New task title"
        className="reminders-capture-row__input"
        maxLength={200}
        onBlur={() => void handleBlur()}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => void handleKeyDown(event.key)}
        ref={inputRef}
        type="text"
        value={draft}
      />
      {errorMessage ? (
        <p className="reminders-capture-row__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </li>
  );
}
