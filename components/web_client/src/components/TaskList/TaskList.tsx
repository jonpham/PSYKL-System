import { useTasks } from '../../hooks/useTasks';

export function TaskList() {
  const { error, loading, tasks } = useTasks();

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
