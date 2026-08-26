import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { Task, TaskInput } from '../../api/client';
import { enqueueWithReplay } from '../../sync/page-triggers';
import { enqueue, replay } from '../../sync/replay';

export function TaskCreateForm() {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const now = new Date().toISOString();
      const taskInput: TaskInput = {
        id: uuidv7(),
        title: trimmedTitle,
        updated_at: now,
      };
      const optimisticTask: Task = {
        id: taskInput.id,
        user_id: 'local',
        title: taskInput.title,
        created_at: now,
        completed_at: null,
        updated_at: taskInput.updated_at,
        server_updated_at: now,
        deleted_at: null,
        list_id: null,
      };

      await enqueueWithReplay({
        enqueue: () =>
          enqueue({ body: taskInput, entityId: taskInput.id, entityType: 'task', op: 'create', optimisticTask }),
        replay,
      });
      setTitle('');
    } catch {
      setErrorMessage('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <label htmlFor="task-title" style={{ display: 'none' }}>
          title
        </label>
        <input
          id="task-title"
          aria-label="title"
          maxLength={200}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs doing?"
          style={{ flex: 1, padding: '0.5rem' }}
          type="text"
          value={title}
        />
        <button type="submit" disabled={!title.trim() || submitting}>
          Create
        </button>
      </form>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </>
  );
}
