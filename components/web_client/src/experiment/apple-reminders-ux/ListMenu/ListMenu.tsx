import './list-menu.css';

import { useEffect, useRef, useState } from 'react';

interface ListMenuProps {
  canDelete?: boolean;
  completedCount: number;
  onDeleteList?: () => void;
  onToggleCompleted: (showCompleted: boolean) => void;
  showCompleted: boolean;
}

/** Reminders keeps low-frequency list operations behind one overflow control
 * rather than spending header chrome on them. Today it holds a single item. */
export function ListMenu({
  canDelete = false,
  completedCount,
  onDeleteList,
  onToggleCompleted,
  showCompleted,
}: ListMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const dismissOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      if (triggerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', dismiss);
    window.addEventListener('mousedown', dismissOnOutsideClick);
    return () => {
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('mousedown', dismissOnOutsideClick);
    };
  }, [open]);

  return (
    <div className="reminders-list-menu">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="List options"
        className="reminders-list-menu__trigger"
        onClick={() => {
          setOpen((current) => !current);
          setConfirmingDelete(false);
        }}
        ref={triggerRef}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="6" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="18" cy="12" r="1.6" />
        </svg>
      </button>

      {open ? (
        <div className="reminders-list-menu__sheet" ref={menuRef} role="menu">
          <button
            className="reminders-list-menu__item"
            onClick={() => {
              onToggleCompleted(!showCompleted);
              setOpen(false);
              triggerRef.current?.focus();
            }}
            role="menuitem"
            type="button"
          >
            {showCompleted ? 'Hide Completed' : `Show Completed (${completedCount})`}
          </button>

          {/* Deleting a list is soft and recoverable from Recently Deleted, but
           * it still takes a second tap rather than a dialog. */}
          {canDelete ? (
            <button
              className="reminders-list-menu__item"
              data-destructive="true"
              onClick={() => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                setConfirmingDelete(false);
                setOpen(false);
                onDeleteList?.();
              }}
              role="menuitem"
              type="button"
            >
              {confirmingDelete ? 'Delete List?' : 'Delete List'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
