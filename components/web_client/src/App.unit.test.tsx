import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App shell', () => {
  it('renders the PSYKL header', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /PSYKL/i, level: 1 })).toBeInTheDocument();
  });

  it('renders a placeholder section for the Task UI', () => {
    render(<App />);
    expect(screen.getByTestId('task-ui-slot')).toBeInTheDocument();
  });
});
