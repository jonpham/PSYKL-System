import type { Task } from '../../api/client';

/**
 * Reminders orders a single list oldest-first so a newly captured task lands at
 * the bottom, next to the capture field. The tasks hook hands back newest-first,
 * so the experiment re-sorts rather than asking the shared hook to change.
 * Completed tasks sink below every open task, most recently completed first, so
 * a row that was just checked settles at the top of the completed group.
 */
function sortTasks(tasks: Task[]): Task[] {
  const open = tasks.filter((task) => task.completed_at === null);
  const completed = tasks.filter((task) => task.completed_at !== null);

  return [
    ...open.sort((left, right) => left.created_at.localeCompare(right.created_at)),
    ...completed.sort((left, right) => (right.completed_at ?? '').localeCompare(left.completed_at ?? '')),
  ];
}

export { sortTasks };
