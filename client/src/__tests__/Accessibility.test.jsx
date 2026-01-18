import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from '../pages/Login';
import { ThemeProvider, createTheme } from '@mui/material';

// Extend expect with jest-axe
expect.extend(toHaveNoViolations);

// Mock the useAuth hook to avoid API calls and context issues
vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    user: null,
    loading: false,
    isAuthenticated: false,
  }),
}));

const theme = createTheme();

describe('Accessibility Tests', () => {
  it('Login page should have no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ThemeProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
