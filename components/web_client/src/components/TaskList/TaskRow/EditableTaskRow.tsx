import { useRef, useState } from 'react';

import type { Task } from '../../../api/client';
import { useTasks } from '../../../hooks/useTasks';
import { TaskRow } from './TaskRow';

interface EditableTaskRowProps {
  isPending?: boolean;
  task: Task;
}

/**
 * The ordinary list row: the mark toggles completion, and the title edits in
 * place. This is what a user sees whenever the list is not in selection mode.
 */
export function EditableTaskRow({ isPending = false, task }: EditableTaskRowProps) {
  const { patchTask } = useTasks();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const cancelEditRef = useRef(false);

  function commitTitle(value: string): void {
    const nextTitle = value.trim();
    if (!nextTitle || nextTitle === task.title) {
      return;
    }
    const now = new Date().toISOString();
    void patchTask(task.id, { title: nextTitle, updated_at: now }, { ...task, title: nextTitle, updated_at: now });
  }

  // Enter/Escape blur the input so `onBlur` is the single commit point; Escape
  // arms `cancelEditRef` so the ensuing blur discards the draft.
  function handleEditBlur(): void {
    if (!cancelEditRef.current) {
      commitTitle(draft);
    }
    cancelEditRef.current = false;
    setEditing(false);
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

  const completed = task.completed_at !== null;

  const title = editing ? (
    <input
      aria-label="Edit title"
      autoFocus
      className="psykl-task-row__input"
      maxLength={200}
      onBlur={handleEditBlur}
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
      aria-label={`Edit ${task.title}`}
      className="psykl-task-row__title"
      onClick={() => {
        setDraft(task.title);
        setEditing(true);
      }}
      type="button"
    >
      {task.title}
    </button>
  );

  return (
    <TaskRow
      checkboxLabel={completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
      checked={completed}
      completed={completed}
      isPending={isPending}
      onCheckboxClick={toggleComplete}
      selected={false}
      taskId={task.id}
      title={title}
      titleText={task.title}
    />
  );
}
