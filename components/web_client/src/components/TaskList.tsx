import type { Task } from '../api/client';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export function TaskList({ tasks, loading, error }: TaskListProps) {
  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (tasks.length === 0) {
    return <p>No tasks yet. Create one above.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {tasks.map((task) => (
        <li key={task.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
          <span>{task.title}</span>
          <time dateTime={task.created_at} style={{ color: '#666', float: 'right', fontSize: '0.85em' }}>
            {new Date(task.created_at).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  );
}
