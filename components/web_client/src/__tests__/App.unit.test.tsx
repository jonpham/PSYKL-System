import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '../App';

describe('App shell', () => {
  it('renders the PSYKL header', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /PSYKL/i, level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders a placeholder section for the Task UI', async () => {
    render(<App />);
    expect(screen.getByTestId('task-ui-slot')).toBeInTheDocument();
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });
});
