import { useLayoutEffect, useRef } from 'react';

import type { Task } from '../../../api/client';
import { useInlineEdit } from '../../../hooks/useInlineEdit';
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
  const completed = task.completed_at !== null;

  const { draft, editing, inputProps, start } = useInlineEdit({
    onCommit: (title) => {
      const now = new Date().toISOString();
      void patchTask(task.id, { title, updated_at: now }, { ...task, title, updated_at: now });
    },
    value: task.title,
  });

  function toggleComplete(): void {
    const now = new Date().toISOString();
    const completedAt = task.completed_at ? null : now;
    void patchTask(
      task.id,
      { completed_at: completedAt, updated_at: now },
      { ...task, completed_at: completedAt, updated_at: now },
    );
  }

  const title = editing ? (
    <AutoGrowingTitleField draft={draft} inputProps={inputProps} />
  ) : (
    <button aria-label={`Edit ${task.title}`} className="psykl-task-row__title" onClick={start} type="button">
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
