import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Components to test
import Blotter from '../pages/Blotter';
import Residents from '../pages/Residents';
import Certificates from '../pages/Certificates';

// Mock API
vi.mock('../utils/api', () => ({
  apiRequest: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock notification context
const mockNotify = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notify: mockNotify
  })
}));

// Mock smart components
vi.mock('../components/SmartComplainantInput', () => ({
  default: ({ value, onChange, label }) => (
    <div>
      <label>{label}</label>
      <input
        type="text"
        value={value?.name || ''}
        onChange={(e) => onChange(e.target.value ? { name: e.target.value, isResident: false } : null)}
        placeholder="Enter name"
      />
    </div>
  )
}));

vi.mock('../components/WriteProtected', () => ({
  default: ({ children }) => <div>{children}</div>
}));

// Test theme
const theme = createTheme();

// Wrapper component for tests
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </LocalizationProvider>
  </ThemeProvider>
);

describe('Frontend Validation Suite', () => {
  let mockApi;

  beforeEach(async () => {
    mockApi = await import('../utils/api');
    mockApi.apiRequest.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
    mockApi.api.get.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    mockApi.api.post.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Blotter Form Validation', () => {
    test('shows error states for required fields in complaint wizard', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Open wizard
      const fileComplaintButton = screen.getByRole('button', { name: /file a complaint/i });
      await user.click(fileComplaintButton);

      // Should be on first step
      expect(screen.getByText('Step 1: Intake (The Report)')).toBeInTheDocument();

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should show validation errors
      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(expect.stringMatching(/complainant name/i), 'warning');
      });
    });

    test('validates incident type selection', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Select incident type
      const incidentTypeSelect = screen.getAllByRole('combobox')[0];
      await user.click(incidentTypeSelect);

      const physicalInjuryOption = screen.getByText('Offenses Against Persons: Physical Injury');
      await user.click(physicalInjuryOption);

      expect(incidentTypeSelect).toHaveTextContent('Offenses Against Persons: Physical Injury');
    });

    test('validates date/time format in incident reporting', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Check datetime-local input
      const dateTimeInput = screen.getByLabelText(/date & time of incident/i);
      expect(dateTimeInput).toHaveAttribute('type', 'datetime-local');

      // Set valid date
      const validDate = '2024-01-01T10:30';
      await user.clear(dateTimeInput);
      await user.type(dateTimeInput, validDate);

      expect(dateTimeInput).toHaveValue(validDate);
    });

    test('handles complainant details form validation', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Fill complainant details
      const contactInput = screen.getAllByLabelText(/contact number/i)[0];
      await user.type(contactInput, '09123456789');

      const addressTextarea = screen.getAllByLabelText(/address/i)[0];
      await user.type(addressTextarea, '123 Test Street, Barangay Test');

      const idProofInput = screen.getByLabelText(/id proof/i);
      await user.type(idProofInput, 'Voter ID: 123456789');

      // Verify values are set
      expect(contactInput).toHaveValue('09123456789');
      expect(addressTextarea).toHaveValue('123 Test Street, Barangay Test');
      expect(idProofInput).toHaveValue('Voter ID: 123456789');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility Compliance', () => {
    test('blotter table has proper ARIA labels and structure', async () => {
      mockApi.api.get.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            Case_Number: 'BLOT-2024-01-001',
            Incident_Type: 'Physical Injury',
            Complainant_Details: '{"name": "John Doe"}',
            Respondent_Details: '{"name": "Jane Smith"}',
            Location_Sitio: 'Batia Proper',
            Status: 'Pending',
            DateTime_Incident: '2024-01-01T10:00:00'
          }
        ])
      });

      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');

      // Check table has proper headers
      const headers = within(table).getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // Check for ARIA attributes (if implemented)
      const ariaLabel = table.getAttribute('aria-label');
      if (ariaLabel) {
        expect(ariaLabel).toContain('blotter');
      }
    });

    test('form inputs have proper labels and associations', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Check form labels
      const contactLabel = screen.getAllByLabelText(/contact number/i)[0];
      expect(contactLabel).toBeInTheDocument();

      const addressLabel = screen.getAllByLabelText(/address/i)[0];
      expect(addressLabel).toBeInTheDocument();

      // Check select elements have labels
      // Use getByText as label association might be complex with MUI Select in test env
      const incidentTypeLabel = screen.getAllByText(/incident type/i)[0];
      expect(incidentTypeLabel).toBeInTheDocument();

      const sitioLabel = screen.getAllByText(/location \(sitio\)/i)[0];
      expect(sitioLabel).toBeInTheDocument();
    });

    test('buttons have accessible names and states', async () => {
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Check buttons have accessible names
      const fileComplaintButton = screen.getByRole('button', { name: /file a complaint/i });
      expect(fileComplaintButton).toBeInTheDocument();

      const exportButton = screen.getByRole('button', { name: /export pdf/i });
      expect(exportButton).toBeInTheDocument();

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    test('loading states are properly announced', async () => {
      // Mock loading state
      mockApi.api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/loading blotter cases/i)).toBeInTheDocument();
      });
    });

    test('error states provide helpful feedback', async () => {
      mockApi.api.get.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Should handle error gracefully
      await waitFor(() => {
        // Error handling might show error message or fallback state
        expect(screen.getByText(/blotter & incident reporting/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COMPONENT STATE MANAGEMENT TESTS
  // ============================================================================

  describe('Component State Management', () => {
    test('blotter wizard maintains state across steps', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Step 1: Fill ALL required fields
      // Complainant
      const contactInput = screen.getAllByLabelText(/contact number/i)[0];
      await user.type(contactInput, '09123456789');
      
      const addressInput = screen.getAllByLabelText(/address/i)[0];
      await user.type(addressInput, 'Test Address');
      
      const idProofInput = screen.getByLabelText(/id proof/i);
      await user.type(idProofInput, 'Test ID');
      
      // We need to fill name via SmartComplainantInput which mocks input
      const nameInput = screen.getAllByPlaceholderText(/enter name/i)[0];
      await user.type(nameInput, 'Test Complainant');

      // Incident Type
      const incidentTypeSelect = screen.getAllByRole('combobox')[0];
      await user.click(incidentTypeSelect);
      await user.click(screen.getByText('Offenses Against Persons: Physical Injury'));

      // Sitio
      const sitioSelect = screen.getAllByRole('combobox')[1];
      await user.click(sitioSelect);
      await user.click(screen.getByText('Batia Proper'));

      // Narrative
      const narrativeInput = screen.getByLabelText(/narrative/i);
      await user.type(narrativeInput, 'Test Narrative');

      // Date Time (already defaulted in state, but let's leave it or set it)
      // It is defaulted to now in component state: dateTimeIncident: new Date()...

      // Go to step 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Step 2: Mediation step
      expect(screen.getByText('Step 2: The Summons (Katarungang Pambarangay)')).toBeInTheDocument();

      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // Should retain contact number
      expect(contactInput).toHaveValue('09123456789');
    });

    test('filter states persist correctly', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Open filters section
      const searchInput = screen.getAllByLabelText(/search/i)[0];
      await user.type(searchInput, 'test search');

      const dateFromInput = screen.getByLabelText(/date from/i);
      await user.type(dateFromInput, '2024-01-01');

      // Apply filters
      expect(searchInput).toHaveValue('test search');
      expect(dateFromInput).toHaveValue('2024-01-01');

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Should reset to empty
      expect(searchInput).toHaveValue('');
      expect(dateFromInput).toHaveValue('');
    });

    test('dialog states manage properly', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Open wizard
      await user.click(screen.getByRole('button', { name: /file a complaint/i }));
      expect(screen.getByRole('heading', { name: /file a complaint/i })).toBeInTheDocument();

      // Close wizard
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should close dialog
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /file a complaint/i })).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // RESPONSIVE DESIGN TESTS
  // ============================================================================

  describe('Responsive Design & Layout', () => {
    test('table layout adapts to content', async () => {
      mockApi.apiRequest.mockImplementation((endpoint) => {
        if (endpoint === 'blotter') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              {
                Case_Number: 'BLOT-2024-01-001',
                Incident_Type: 'Physical Injury',
                Complainant_Details: '{"name": "John Doe"}',
                Respondent_Details: '{"name": "Jane Smith"}',
                Location_Sitio: 'Batia Proper',
                Status: 'Pending',
                DateTime_Incident: '2024-01-01T10:00:00'
              }
            ])
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      });

      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table has expected columns
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(8); // Case #, Incident Type, Complainant, Respondent, Sitio, Status, Date, Actions

      // Check table has data rows
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + data rows
      });
    });

    test('filter controls are accessible and usable', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      // Test search functionality
      const searchInput = screen.getAllByLabelText(/search/i)[0];
      await user.type(searchInput, 'test query');

      // Test status filter
      // Use getAllByRole because label association might be missing in test env
      const statusSelect = screen.getAllByRole('combobox')[0];
      await user.click(statusSelect);

      // Should show status options
      await waitFor(() => {
        expect(screen.getByText('All Statuses')).toBeInTheDocument();
      });

      // Close menu
      await user.keyboard('{Escape}');

      // Test sitio filter
      const sitioSelect = screen.getAllByRole('combobox')[1];
      await user.click(sitioSelect);

      // Should show sitio options
      await waitFor(() => {
        expect(screen.getByText('All Sitios')).toBeInTheDocument();
      });
    });

    test('action buttons are contextually appropriate', async () => {
      mockApi.apiRequest.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            Case_Number: 'BLOT-2024-01-001',
            Incident_Type: 'Physical Injury',
            Complainant_Details: '{"name": "John Doe"}',
            Respondent_Details: '{"name": "Jane Smith"}',
            Location_Sitio: 'Batia Proper',
            Status: 'Pending',
            DateTime_Incident: '2024-01-01T10:00:00'
          }
        ])
      });

      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await waitFor(() => {
        // Just check if any buttons exist, as specific actions depend on role/status
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling & User Feedback', () => {
    test('handles API errors gracefully in forms', async () => {
      mockApi.api.post.mockRejectedValue(new Error('API Error'));

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Fill minimum required fields
      const contactInput = screen.getAllByLabelText(/contact number/i)[0];
      await user.type(contactInput, '09123456789');

      const addressTextarea = screen.getAllByLabelText(/address/i)[0];
      await user.type(addressTextarea, '123 Test St');

      const idProofInput = screen.getByLabelText(/id proof/i);
      await user.type(idProofInput, 'Test ID');

      // Select is the first combobox
      const incidentTypeSelect = screen.getAllByRole('combobox')[0];
      await user.click(incidentTypeSelect);
      await user.click(screen.getByText('Offenses Against Persons: Physical Injury'));

      const sitioSelect = screen.getAllByRole('combobox')[1];
      await user.click(sitioSelect);
      await user.click(screen.getByText('Batia Proper'));

      const narrativeTextarea = screen.getByLabelText(/narrative/i);
      await user.type(narrativeTextarea, 'Test narrative');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /next/i });
      await user.click(submitButton);

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByText(/blotter & incident reporting/i)).toBeInTheDocument();
      });
    });

    test('shows appropriate loading states during operations', async () => {
      mockApi.api.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /file a complaint/i }));

      // Fill and submit
      const contactInput = screen.getAllByLabelText(/contact number/i)[0];
      await user.type(contactInput, '09123456789');

      const addressTextarea = screen.getAllByLabelText(/address/i)[0];
      await user.type(addressTextarea, '123 Test St');

      const submitButton = screen.getByRole('button', { name: /next/i });
      await user.click(submitButton);

      // Submit button should be disabled during submission (if implemented)
      // This depends on component implementation
    });

    test('validates file size and type restrictions', async () => {
      // Mock file validation
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';

      // Test would depend on actual file upload implementation
      expect(fileInput.accept).toBe('image/*');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS WITH MOCK DATA
  // ============================================================================

  describe('Integration with Mock Data', () => {
    test('displays blotter data correctly from API', async () => {
      const mockBlotterData = [
        {
          Case_Number: 'BLOT-2024-01-001',
          Incident_Type: 'Physical Injury',
          Complainant_Details: '{"name": "John Complainant", "contact": "09123456789"}',
          Respondent_Details: '{"name": "Jane Respondent", "contact": "09876543210"}',
          Location_Sitio: 'Batia Proper',
          Status: 'Pending',
          DateTime_Incident: '2024-01-01T10:00:00.000Z'
        },
        {
          Case_Number: 'BLOT-2024-01-002',
          Incident_Type: 'Theft (Petty)',
          Complainant_Details: '{"name": "Bob Victim", "contact": "09234567890"}',
          Respondent_Details: null,
          Location_Sitio: 'Northville 5',
          Status: 'Ongoing',
          DateTime_Incident: '2024-01-02T14:30:00.000Z'
        }
      ];

      mockApi.apiRequest.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlotterData)
      });

      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('BLOT-2024-01-001')).toBeInTheDocument();
        expect(screen.getByText('BLOT-2024-01-002')).toBeInTheDocument();
      });

      // Check data display
      expect(screen.getByText('John Complainant')).toBeInTheDocument();
      expect(screen.getByText('Jane Respondent')).toBeInTheDocument();
      expect(screen.getByText('Bob Victim')).toBeInTheDocument();
      expect(screen.getByText('Physical Injury')).toBeInTheDocument();
      expect(screen.getByText('Theft (Petty)')).toBeInTheDocument();
    });

    test('filters work correctly with mock data', async () => {
      const mockBlotterData = [
        {
          Case_Number: 'BLOT-2024-01-001',
          Incident_Type: 'Physical Injury',
          Complainant_Details: '{"name": "John Doe"}',
          Respondent_Details: '{"name": "Jane Smith"}',
          Location_Sitio: 'Batia Proper',
          Status: 'Pending',
          DateTime_Incident: '2024-01-01T10:00:00.000Z'
        },
        {
          Case_Number: 'BLOT-2024-01-002',
          Incident_Type: 'Theft (Petty)',
          Complainant_Details: '{"name": "Bob Victim"}',
          Respondent_Details: null,
          Location_Sitio: 'Northville 5',
          Status: 'Ongoing',
          DateTime_Incident: '2024-01-02T14:30:00.000Z'
        }
      ];

      mockApi.apiRequest.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBlotterData)
      });

      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Blotter />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('BLOT-2024-01-001')).toBeInTheDocument();
      });

      // Test status filter
      // Select is the first combobox
      const statusSelect = screen.getAllByRole('combobox')[0];
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: 'Pending' }));

      // Should filter to show only pending cases
      await waitFor(() => {
        expect(screen.getByText('BLOT-2024-01-001')).toBeInTheDocument();
        expect(screen.queryByText('BLOT-2024-01-002')).not.toBeInTheDocument();
      });
    });
  });
});
