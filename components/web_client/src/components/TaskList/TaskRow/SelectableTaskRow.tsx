import type { PointerEvent } from 'react';

import type { Task } from '../../../api/client';
import { TaskRow } from './TaskRow';

interface SelectableTaskRowProps {
  /** A batch is in flight: the row cannot be pooled, unpooled, or moved. */
  disabled?: boolean;
  isDragging?: boolean;
  isPending?: boolean;
  onDragStart?: (event: PointerEvent<HTMLButtonElement>) => void;
  onReorder?: (delta: -1 | 1) => void;
  onToggleSelect: () => void;
  selected: boolean;
  task: Task;
}

/**
 * The row in selection mode: both the mark and the title pool the task into the
 * batch, and nothing on the row mutates it on its own — the action bar does
 * that for the whole selection. Editing a title is deliberately unreachable
 * here, so a tap can only ever mean one thing.
 */
export function SelectableTaskRow({
  disabled = false,
  isDragging = false,
  isPending = false,
  onDragStart,
  onReorder,
  onToggleSelect,
  selected,
  task,
}: SelectableTaskRowProps) {
  const label = `${selected ? 'Deselect' : 'Select'} ${task.title}`;

  return (
    <TaskRow
      checkboxLabel={label}
      checked={selected}
      disabled={disabled}
      completed={task.completed_at !== null}
      isDragging={isDragging}
      isPending={isPending}
      onCheckboxClick={onToggleSelect}
      onDragStart={onDragStart}
      onReorder={onReorder}
      selected={selected}
      taskId={task.id}
      title={
        <button
          aria-label={label}
          className="psykl-task-row__title"
          data-selectable="true"
          disabled={disabled}
          onClick={onToggleSelect}
          type="button"
        >
          {task.title}
        </button>
      }
      titleText={task.title}
    />
  );
}
