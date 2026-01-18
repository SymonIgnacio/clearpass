import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { ThemeProvider, createTheme } from '@mui/material';

// Extend expect with jest-axe
expect.extend(toHaveNoViolations);

// Mock AuthContext
vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    user: { 
      role: '1', 
      username: 'admin',
      id: 1 
    },
    isAuthenticated: true,
  }),
}));

// Mock API requests
vi.mock('../utils/api', () => ({
  apiRequest: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      overall: {
        total_residents: 100,
        total_seniors: 10,
        total_pwd: 5,
        total_single_parents: 8
      },
      residents: 100,
      active_blotter: 5,
      certificates: 12
    })
  })
}));

const theme = createTheme();

describe('Dashboard Accessibility', () => {
  it('Dashboard should have no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Wait for content to load
    await waitFor(() => {
      expect(container.querySelector('h4')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
