import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminReports from '../pages/AdminReports';
import { api, apiRequest } from '../utils/api';

// Mock dependencies
vi.mock('../utils/api', () => ({
  api: {
    get: vi.fn(),
  },
  apiRequest: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ search: '' }),
  useNavigate: () => vi.fn(),
}));

const mockNotify = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notify: mockNotify,
  }),
}));

describe('AdminReports Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful report responses
    api.get.mockImplementation((url) => {
      if (url.includes('/admin/reports/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user_statistics: {
              total_users: 100,
              active_users: 90,
              it_admins: 2,
              captains: 1,
              secretaries: 1,
              clerks: 5,
              blotter_officers: 2,
              residents: 89
            },
            login_statistics: { total_attempts: 500, successful_logins: 450, failed_logins: 50 },
            recent_users: []
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders loading state initially', () => {
    render(<AdminReports />);
    expect(screen.getByText(/Loading Reports Dashboard/i)).toBeInTheDocument();
  });

  it('loads and displays user reports by default', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('triggers PDF generation when export button is clicked', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    // Mock PDF blob response
    const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
    apiRequest.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    const exportBtn = screen.getByText('Export Current Tab PDF');
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/admin/reports/pdf/users', expect.anything());
      expect(mockNotify).toHaveBeenCalledWith(expect.stringContaining('downloaded successfully'), 'success');
    });
  });

  it('handles refresh functionality', async () => {
    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByText('Refresh All');
    fireEvent.click(refreshBtn);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    
    await waitFor(() => {
      // 7 tabs * 2 calls (initial + refresh) + 1 detailed report call on mount = 15
      expect(api.get).toHaveBeenCalledTimes(15);
    });
  });

  it('handles API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('Network Error'));

    render(<AdminReports />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load reports/i)).toBeInTheDocument();
    });
  });
});
