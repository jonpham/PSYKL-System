import { useLayoutEffect, useRef, useState } from 'react';

import type { Task } from '../../../api/client';
import { useInlineEdit } from '../../../hooks/useInlineEdit';
import { useTasks } from '../../../hooks/useTasks';
import { TaskItemDrawer } from '../TaskItemDrawer';
import { TaskRow } from './TaskRow';

interface EditableTaskRowProps {
  isPending?: boolean;
  /** Set by a list that keeps one rail open at a time. Left out, the row
   * governs its own rail, which is what a story or a test rendering one row
   * wants. */
  railOpen?: boolean;
  onRailOpenChange?: (open: boolean) => void;
  task: Task;
}

/**
 * The ordinary list row: the mark toggles completion, and the title edits in
 * place. This is what a user sees whenever the list is not in selection mode.
 */
export function EditableTaskRow({
  isPending = false,
  onRailOpenChange,
  railOpen: controlledRailOpen,
  task,
}: EditableTaskRowProps) {
  const { deleteTask, patchTask } = useTasks();
  const [showingDetails, setShowingDetails] = useState(false);
  const [ownRailOpen, setOwnRailOpen] = useState(false);
  const railOpen = controlledRailOpen ?? ownRailOpen;
  const completed = task.completed_at !== null;

  function setRailOpen(open: boolean): void {
    setOwnRailOpen(open);
    onRailOpenChange?.(open);
  }

  function rename(title: string): void {
    const now = new Date().toISOString();
    void patchTask(task.id, { title, updated_at: now }, { ...task, title, updated_at: now });
  }

  const { draft, editing, inputProps, start } = useInlineEdit({ onCommit: rename, value: task.title });

  function remove(): void {
    const now = new Date().toISOString();
    void deleteTask(task.id, { deleted_at: now, updated_at: now }, { ...task, deleted_at: now, updated_at: now });
  }

  function toggleComplete(): void {
    const now = new Date().toISOString();
    const completedAt = task.completed_at ? null : now;
    void patchTask(
      task.id,
      { completed_at: completedAt, updated_at: now },
      { ...task, completed_at: completedAt, updated_at: now },
    );
  }

  // While the drawer is open the title is the drawer's to edit, so the row
  // shows it and nothing more — two live fields over one title would be two
  // places to type the same thing.
  const title = showingDetails ? (
    <span className="psykl-task-row__title">{task.title}</span>
  ) : editing ? (
    <AutoGrowingTitleField draft={draft} inputProps={inputProps} />
  ) : (
    <button aria-label={`Edit ${task.title}`} className="psykl-task-row__title" onClick={start} type="button">
      {task.title}
    </button>
  );

  return (
    <TaskRow
      action={
        editing && !showingDetails && !railOpen ? (
          <button
            aria-label={`Details for ${task.title}`}
            className="psykl-task-row__details"
            // Pointer-down, not click: the title field's blur would unmount this
            // button before a click ever landed on it.
            onPointerDown={(event) => {
              event.preventDefault();
              setShowingDetails(true);
            }}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 7.6v0.1" />
            </svg>
          </button>
        ) : null
      }
      checkboxLabel={completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
      checked={completed}
      completed={completed}
      isPending={isPending}
      onCheckboxClick={toggleComplete}
      selected={false}
      swipe={{
        dismissLabel: `Close actions for ${task.title}`,
        onCommit: remove,
        onDelete: remove,
        onDetails: () => {
          setRailOpen(false);
          setShowingDetails(true);
        },
        onOpenChange: setRailOpen,
        open: railOpen,
      }}
      taskId={task.id}
      title={title}
      titleText={task.title}
    >
      {showingDetails ? (
        <TaskItemDrawer onClose={() => setShowingDetails(false)} onDelete={remove} onRename={rename} task={task} />
      ) : null}
    </TaskRow>
  );
}

/**
 * The editing field, sized to its own content.
 *
 * A `textarea` is what lets the tapped title keep the wrap and the height the
 * rendered title had — an `input` cannot wrap, so a two-line title collapsed to
 * one and the row jumped under the user's finger. The height is driven from
 * `scrollHeight` on every keystroke so growing past a line pushes the row down
 * rather than scrolling inside a fixed box.
 */
function AutoGrowingTitleField({
  draft,
  inputProps,
}: {
  draft: string;
  inputProps: ReturnType<typeof useInlineEdit>['inputProps'];
}) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Layout effect, not effect: the measured height must be in place for the
  // first paint, or the row flashes at one line before settling.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [draft]);

  return (
    <textarea
      aria-label="Edit title"
      className="psykl-task-row__title"
      maxLength={200}
      ref={fieldRef}
      rows={1}
      {...inputProps}
      value={draft}
    />
  );
}
