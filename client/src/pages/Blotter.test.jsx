import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Blotter from './Blotter'

// Mock fetch globally
global.fetch = vi.fn()

describe('Blotter Component', () => {
  const mockBlotterCases = [
    {
      id: 1,
      case_number: 'BLOT-2025-001',
      incident_type: 'Theft',
      complainant_name: 'John Doe',
      respondent_name: 'Jane Smith',
      sitio_name: 'Batia Proper',
      status: 'Pending',
      severity: 'High',
      date_filed: '2025-01-15T10:00:00Z'
    },
    {
      id: 2,
      case_number: 'BLOT-2025-002',
      incident_type: 'Noise Complaint',
      complainant_name: 'Alice Johnson',
      respondent_name: null,
      sitio_name: 'Northville 5',
      status: 'Resolved',
      severity: 'Low',
      date_filed: '2025-01-10T14:30:00Z'
    }
  ]

  const mockResidents = [
    { id: 1, first_name: 'Jane', last_name: 'Smith' },
    { id: 2, first_name: 'Bob', last_name: 'Wilson' }
  ]

  const mockSitios = [
    { id: 1, name: 'Batia Proper' },
    { id: 2, name: 'Northville 5' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful API responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlotterCases)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResidents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSitios)
      })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders blotter records table', async () => {
    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    expect(screen.getByText('BLOT-2025-001')).toBeInTheDocument()
    expect(screen.getByText('Theft')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Batia Proper')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('displays correct status chip colors', async () => {
    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    // Check for warning chip (Pending)
    const pendingChip = screen.getByText('Pending')
    expect(pendingChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning')

    // Check for success chip (Resolved)
    const resolvedChip = screen.getByText('Resolved')
    expect(resolvedChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')
  })

  it('opens dialog when Log Incident button is clicked', async () => {
    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    const logButton = screen.getByText('Log Incident')
    fireEvent.click(logButton)

    expect(screen.getByText('Log New Incident')).toBeInTheDocument()
    expect(screen.getByLabelText('Complainant Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Incident Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('submits new blotter case', async () => {
    const user = userEvent.setup()

    // Mock POST response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 3 })
    })

    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    // Open dialog
    const logButton = screen.getByText('Log Incident')
    fireEvent.click(logButton)

    // Fill form
    await user.type(screen.getByLabelText('Complainant Name'), 'Test Complainant')
    await user.type(screen.getByLabelText('Incident Type'), 'Test Incident')
    await user.type(screen.getByLabelText('Description'), 'Test description')

    // Select sitio
    const sitioSelect = screen.getByLabelText('Sitio')
    await user.click(sitioSelect)
    await user.click(screen.getByText('Batia Proper'))

    // Submit
    const submitButton = screen.getByText('Log Incident')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/blotter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainant_name: 'Test Complainant',
          respondent_id: '',
          incident_type: 'Test Incident',
          location: '',
          sitio_id: '1',
          description: 'Test description',
          status: 'Pending',
          severity: 'Low'
        })
      })
    })
  })

  it('fetches data on mount', async () => {
    render(<Blotter />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/blotter')
      expect(global.fetch).toHaveBeenCalledWith('/api/residents')
      expect(global.fetch).toHaveBeenCalledWith('/api/sitios')
    })

    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('handles API errors gracefully', async () => {
    // Mock failed responses
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    // Should still render table (empty)
    expect(screen.getByText('Case #')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('populates respondent dropdown with residents', async () => {
    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    // Open dialog
    const logButton = screen.getByText('Log Incident')
    fireEvent.click(logButton)

    const respondentSelect = screen.getByLabelText('Respondent (Optional)')
    fireEvent.click(respondentSelect)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    expect(screen.getByText('No respondent')).toBeInTheDocument()
  })

  it('closes dialog when cancel is clicked', async () => {
    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    // Open dialog
    const logButton = screen.getByText('Log Incident')
    fireEvent.click(logButton)

    expect(screen.getByText('Log New Incident')).toBeInTheDocument()

    // Close dialog
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(screen.queryByText('Log New Incident')).not.toBeInTheDocument()
  })

  it('refreshes blotter cases after successful submission', async () => {
    global.fetch.mockClear()

    // Initial load mocks
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockBlotterCases) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockResidents) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSitios) })

    // Submission mock
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 3 })
    })

    // Refresh mock
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([...mockBlotterCases, { id: 3, case_number: 'BLOT-2025-003' }])
    })

    const user = userEvent.setup()

    render(<Blotter />)

    await waitFor(() => {
      expect(screen.getByText('Blotter Records')).toBeInTheDocument()
    })

    // Open dialog and submit
    const logButton = screen.getByText('Log Incident')
    fireEvent.click(logButton)

    await user.type(screen.getByLabelText('Complainant Name'), 'New Complainant')
    await user.type(screen.getByLabelText('Incident Type'), 'New Incident')
    await user.type(screen.getByLabelText('Description'), 'New description')

    const sitioSelect = screen.getByLabelText('Sitio')
    await user.click(sitioSelect)
    await user.click(screen.getByText('Batia Proper'))

    const submitButton = screen.getByText('Log Incident')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(5) // 3 initial + 1 submit + 1 refresh
    })
  })
})
