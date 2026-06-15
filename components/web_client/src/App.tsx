import { TaskCreateForm } from './components/TaskCreateForm';
import { TaskList } from './components/TaskList';
import { Toast } from './components/Toast';

export default function App() {
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
      <Toast />
      <section data-testid="task-ui-slot">
        <TaskCreateForm />
        <TaskList />
      </section>
    </main>
  );
}
