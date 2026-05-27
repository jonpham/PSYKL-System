import { useEffect, useState } from 'react';
import { apiClient, taskRequestParams, type Task } from './api/client';
import { TaskCreateForm } from './components/TaskCreateForm';
import { TaskList } from './components/TaskList';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      try {
        const { data, error: loadError } = await apiClient.GET('/tasks', taskRequestParams);

        if (cancelled) {
          return;
        }

        if (loadError) {
          setError('Failed to load tasks');
        } else {
          setTasks(data ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load tasks');
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        margin: '0 auto',
        maxWidth: 640,
        padding: '2rem',
      }}
    >
      <h1>PSYKL</h1>
      <p>Time-independent planning. M1 bootstrap shell.</p>
      <section data-testid="task-ui-slot">
        <TaskCreateForm onCreated={(task) => setTasks((currentTasks) => [task, ...currentTasks])} />
        <TaskList tasks={tasks} loading={loading} error={error} />
      </section>
    </main>
  );
}
