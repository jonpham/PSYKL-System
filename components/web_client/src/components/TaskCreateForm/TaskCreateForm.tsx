import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';

import { apiClient, type Task, type TaskInput, taskMutationRequestParams } from '../../api/client';

interface TaskCreateFormProps {
  onCreated: (task: Task) => void;
}

export function TaskCreateForm({ onCreated }: TaskCreateFormProps) {
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
      const taskInput: TaskInput = {
        id: uuidv7(),
        title: trimmedTitle,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await apiClient.POST('/tasks', {
        ...taskMutationRequestParams(uuidv7()),
        body: taskInput,
      });

      if (error) {
        throw new Error('Failed to create task');
      }

      if (data) {
        onCreated(data);
        setTitle('');
      }
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
