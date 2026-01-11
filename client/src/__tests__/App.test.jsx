import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiRequest: vi.fn(),
}));

vi.mock('../components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../components/Header', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('../components/AppShell', () => ({
  default: ({ children }) => (
    <div data-testid="app-shell">
      <div data-testid="sidebar" />
      <div data-testid="header" />
      {children}
    </div>
  ),
}));

vi.mock('../pages/Login', () => ({ default: () => <div data-testid="login-page" /> }));
vi.mock('../pages/ResidentLogin', () => ({ default: () => <div data-testid="resident-login-page" /> }));
vi.mock('../pages/ResidentRegister', () => ({ default: () => <div data-testid="resident-register-page" /> }));
vi.mock('../pages/OfficerLogin', () => ({ default: () => <div data-testid="officer-login-page" /> }));
vi.mock('../pages/Unauthorized', () => ({ default: () => <div data-testid="unauthorized-page" /> }));
vi.mock('../pages/MfaOtp', () => ({ default: () => <div data-testid="mfa-otp-page" /> }));

vi.mock('../pages/Dashboard', () => ({ default: () => <div data-testid="dashboard-page" /> }));

import { api } from '../utils/api';
import { ThemeModeProvider } from '../contexts/ThemeModeContext.jsx';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  test('shows login when /auth/me returns 401', async () => {
    api.get.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    render(
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    );

    expect(await screen.findByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  test('shows sidebar/header when /auth/me returns user', async () => {
    api.get.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { username: 'captain', role: 'captain' } }),
    });

    render(
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });
});
