import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StaffManagement from '../../../pages/admin/StaffManagement';
import * as apiModule from '../../../utils/api';

// Mock apiRequest
vi.mock('../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockStaff = [
  { id: 1, username: 'staff1', role: 2, is_active: true, first_name: 'Staff', last_name: 'One' },
  { id: 2, username: 'staff2', role: 3, is_active: false, first_name: 'Staff', last_name: 'Two' },
];

const mockRoles = [
  { id: 1, role_name: 'Admin', description: 'Administrator', permissions: { users: ['read'] } },
  {
    id: 2,
    role_name: 'Clerk',
    description: 'Clerk',
    permissions: { residents: ['read', 'create'] },
  },
];

describe('StaffManagement Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiModule.apiRequest.mockImplementation(url => {
      console.log('Mock apiRequest called with:', url);
      if (url.includes('admin/staff')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStaff),
        });
      }
      if (url.includes('admin/roles')) {
        console.log('Returning mockRoles');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoles),
        });
      }
      console.log('Unknown URL:', url);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  it('renders staff list by default', async () => {
    render(<StaffManagement />);

    expect(screen.getByText('Staff Directory')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('staff1')).toBeInTheDocument();
      expect(screen.getByText('staff2')).toBeInTheDocument();
    });
  });

  it('opens add staff dialog', async () => {
    render(<StaffManagement />);

    fireEvent.click(screen.getByRole('button', { name: /add staff/i }));

    expect(screen.getByRole('heading', { name: /new user creation wizard/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
  });

  it('validates staff form', async () => {
    const user = userEvent.setup();
    render(<StaffManagement />);

    await user.click(screen.getByRole('button', { name: /add staff/i }));

    // In Wizard, first step is Account Details. Click Next without filling.
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    const msgs = await screen.findAllByText(/Username is required/i);
    expect(msgs.length).toBeGreaterThan(0);
  });

  it('switches to role management tab', async () => {
    render(<StaffManagement />);

    const roleTab = screen.getByRole('tab', { name: /role management/i });
    fireEvent.click(roleTab);

    const grid = await screen.findByTestId('role-grid');
    expect(within(grid).getByText('Admin')).toBeInTheDocument();
    expect(within(grid).getAllByText('Clerk').length).toBeGreaterThan(0);
  });

  it('opens add role dialog and allows permission selection', async () => {
    const user = userEvent.setup();
    render(<StaffManagement />);

    // Switch to Role Management
    await user.click(screen.getByRole('tab', { name: /role management/i }));

    // Wait for tab switch
    await waitFor(() => {
      expect(screen.getByTestId('role-grid')).toBeInTheDocument();
    });

    // Click Add Role button
    await user.click(screen.getByRole('button', { name: /create new role/i }));

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create new role/i })).toBeInTheDocument();
    });

    // Check if permission modules are visible
    expect(screen.getByText('Residents Management')).toBeInTheDocument();

    // Open an accordion
    const residentsAccordion = screen
      .getByText('Residents Management')
      .closest('.MuiAccordion-root');
    const summary = within(residentsAccordion).getByRole('button');
    await user.click(summary);

    // Check for permission checkboxes within this accordion
    await waitFor(() => {
      expect(within(residentsAccordion).getByLabelText('View')).toBeInTheDocument();
      expect(within(residentsAccordion).getByLabelText('Create')).toBeInTheDocument();
    });
  });
});
