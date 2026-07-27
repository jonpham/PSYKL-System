const SKELETON_ROW_HEIGHT = '2.5rem';
const DEFAULT_ROWS = 3;

const srOnlyStyle = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute' as const,
  whiteSpace: 'nowrap' as const,
  width: '1px',
};

interface TaskListSkeletonProps {
  rows?: number;
}

/**
 * Placeholder list shown while IndexedDB hydrates. Rows use a fixed height that
 * matches a real Task row so content does not shift when tasks load.
 */
export function TaskListSkeleton({ rows = DEFAULT_ROWS }: TaskListSkeletonProps) {
  return (
    <ul aria-busy="true" aria-label="Loading tasks" role="status" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li style={srOnlyStyle}>Loading tasks…</li>
      {Array.from({ length: rows }).map((_, index) => (
        <li
          aria-hidden="true"
          data-testid="task-skeleton-row"
          key={index}
          style={{
            background: 'linear-gradient(90deg, #f0f0f0, #e6e6e6, #f0f0f0)',
            borderBottom: '1px solid #eee',
            borderRadius: 2,
            height: SKELETON_ROW_HEIGHT,
            margin: '0.25rem 0',
          }}
        />
      ))}
    </ul>
  );
}
