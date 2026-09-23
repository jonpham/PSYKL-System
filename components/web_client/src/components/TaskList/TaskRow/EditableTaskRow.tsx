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
    <input aria-label="Edit title" className="psykl-task-row__input" maxLength={200} {...inputProps} value={draft} />
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
