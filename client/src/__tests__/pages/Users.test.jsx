import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Users from '../../pages/Users';
import * as apiModule from '../../utils/api';

// Mock the apiRequest function
vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
};

const mockResidents = [
  {
    Resident_ID: 1,
    First_Name: 'John',
    Last_Name: 'Doe',
    Email: 'john@example.com',
    Mobile_Number: '09123456789',
    Sitio_ID: 1,
  },
  {
    Resident_ID: 2,
    First_Name: 'Jane',
    Last_Name: 'Smith',
    Email: 'jane@example.com',
    Mobile_Number: '09987654321',
    Sitio_ID: 2,
  },
];

const mockSitios = [
  { id: 1, name: 'Sitio 1' },
  { id: 2, name: 'Sitio 2' },
];

const mockHouseholds = [
  { Household_ID: 1, Household_Number: 'H-001', Street_Address: 'Main St' },
];

describe('Users Page - Resident Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for apiRequest
    apiModule.apiRequest.mockImplementation((url) => {
      if (url === 'sitios') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSitios),
        });
      }
      if (url === 'households') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHouseholds),
        });
      }
      if (url.startsWith('residents?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: mockResidents,
            pagination: { total: 2 },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  it('renders the residents table by default', async () => {
    render(<Users user={mockUser} />);

    // Check for Resident Database tab active
    expect(screen.getByText('Resident Database')).toBeInTheDocument();

    // Check if residents are loaded
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });
  });

  it('opens the add resident dialog when "Add Resident" is clicked', async () => {
    render(<Users user={mockUser} />);

    const addButton = screen.getByText('Add Resident');
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Resident')).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
  });

  it('validates required fields when submitting new resident', async () => {
    render(<Users user={mockUser} />);

    // Open dialog
    fireEvent.click(screen.getByText('Add Resident'));

    // Click save without filling
    const saveButton = screen.getByText('Save Resident');
    fireEvent.click(saveButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });
  });

  it('submits a new resident successfully', async () => {
    // Mock POST success
    apiModule.apiRequest.mockImplementation((url, options) => {
      if (url === 'residents' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Created' }),
        });
      }
      // Keep other mocks
      if (url === 'sitios') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSitios) });
      if (url === 'households') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHouseholds) });
      if (url.startsWith('residents?')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockResidents, pagination: { total: 2 } }) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<Users user={mockUser} />);
    const user = userEvent.setup();

    // Open dialog
    fireEvent.click(screen.getByText('Add Resident'));

    // Fill form
    await user.type(screen.getByLabelText(/First Name/i), 'Alice');
    await user.type(screen.getByLabelText(/Last Name/i), 'Wonderland');
    await user.type(screen.getByLabelText(/Email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/Birthdate/i), '2000-01-01');

    const [genderSelect, householdSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(genderSelect);
    fireEvent.click(await screen.findByRole('option', { name: /^male$/i }));

    fireEvent.mouseDown(householdSelect);
    fireEvent.click(await screen.findByRole('option', { name: /#H-001/i }));

    fireEvent.click(screen.getByText('Save Resident'));

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        'residents',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('searches for residents', async () => {
    render(<Users user={mockUser} />);
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText('Search residents...');
    await user.type(searchInput, 'Doe');
    
    // Click search button (icon button)
    // There is a form with onSubmit={handleSearchSubmit}
    fireEvent.submit(searchInput);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('search=Doe')
      );
    });
  });
});
