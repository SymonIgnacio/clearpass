import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Certificates from './Certificates'

// Mock fetch globally
global.fetch = vi.fn()

describe('Certificates Component', () => {
  const mockCertificates = [
    {
      id: 1,
      certificate_number: 'CERT-2025-001',
      resident_name: 'John Doe',
      certificate_type: 'Barangay Clearance',
      purpose: 'Employment',
      status: 'Active',
      issued_date: '2025-01-15T10:00:00Z'
    },
    {
      id: 2,
      certificate_number: 'CERT-2025-002',
      resident_name: 'Jane Smith',
      certificate_type: 'Certificate of Residency',
      purpose: 'Bank loan',
      status: 'Expired',
      issued_date: '2025-01-10T14:30:00Z'
    }
  ]

  const mockResidents = [
    { id: 1, first_name: 'John', last_name: 'Doe', sitio_name: 'Batia Proper' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', sitio_name: 'Northville 5' }
  ]

  const mockCertificateTypes = [
    { id: 1, name: 'Barangay Clearance', fee: 50, validity_days: 30 },
    { id: 2, name: 'Certificate of Residency', fee: 30, validity_days: 60 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful API responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCertificates)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResidents)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCertificateTypes)
      })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders certificates table', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    expect(screen.getByText('CERT-2025-001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Barangay Clearance')).toBeInTheDocument()
    expect(screen.getByText('Employment')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('displays correct status chip colors', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Check for success chip (Active)
    const activeChip = screen.getByText('Active')
    expect(activeChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess')

    // Check for warning chip (Expired)
    const expiredChip = screen.getByText('Expired')
    expect(expiredChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning')
  })

  it('opens dialog when Issue Certificate button is clicked', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    expect(screen.getByText('Issue New Certificate')).toBeInTheDocument()
    expect(screen.getByLabelText('Select Resident')).toBeInTheDocument()
    expect(screen.getByLabelText('Certificate Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Purpose')).toBeInTheDocument()
  })

  it('submits new certificate successfully', async () => {
    const user = userEvent.setup()

    // Mock successful POST response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 3, certificate_number: 'CERT-2025-003' })
    })

    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Open dialog
    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    // Fill form
    const residentSelect = screen.getByLabelText('Select Resident')
    await user.click(residentSelect)
    await user.click(screen.getByText('John Doe - Batia Proper'))

    const typeSelect = screen.getByLabelText('Certificate Type')
    await user.click(typeSelect)
    await user.click(screen.getByText('Barangay Clearance - ₱50 (30 days)'))

    await user.type(screen.getByLabelText('Purpose'), 'Test purpose')

    // Submit
    const submitButton = screen.getByText('Issue Certificate')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: '1',
          certificate_type_id: '1',
          certificate_type: 'Barangay Clearance',
          purpose: 'Test purpose'
        })
      })
    })
  })

  it('shows error message when certificate issuance fails', async () => {
    const user = userEvent.setup()

    // Mock failed POST response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'BLOCK ISSUANCE: Active blotter case found' })
    })

    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Open dialog and fill form
    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    const residentSelect = screen.getByLabelText('Select Resident')
    await user.click(residentSelect)
    await user.click(screen.getByText('John Doe - Batia Proper'))

    const typeSelect = screen.getByLabelText('Certificate Type')
    await user.click(typeSelect)
    await user.click(screen.getByText('Barangay Clearance - ₱50 (30 days)'))

    await user.type(screen.getByLabelText('Purpose'), 'Test purpose')

    const submitButton = screen.getByText('Issue Certificate')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('BLOCK ISSUANCE: Active blotter case found')).toBeInTheDocument()
    })
  })

  it('fetches data on mount', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/certificates')
      expect(global.fetch).toHaveBeenCalledWith('/api/residents')
      expect(global.fetch).toHaveBeenCalledWith('/api/certificate-types')
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

    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Should still render table (empty)
    expect(screen.getByText('Certificate #')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('populates resident dropdown with residents', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Open dialog
    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    const residentSelect = screen.getByLabelText('Select Resident')
    fireEvent.click(residentSelect)

    expect(screen.getByText('John Doe - Batia Proper')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith - Northville 5')).toBeInTheDocument()
  })

  it('populates certificate type dropdown with types and fees', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Open dialog
    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    const typeSelect = screen.getByLabelText('Certificate Type')
    fireEvent.click(typeSelect)

    expect(screen.getByText('Barangay Clearance - ₱50 (30 days)')).toBeInTheDocument()
    expect(screen.getByText('Certificate of Residency - ₱30 (60 days)')).toBeInTheDocument()
  })

  it('closes dialog when cancel is clicked', async () => {
    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Open dialog
    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    expect(screen.getByText('Issue New Certificate')).toBeInTheDocument()

    // Close dialog
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(screen.queryByText('Issue New Certificate')).not.toBeInTheDocument()
  })

  it('clears error message when dialog is reopened', async () => {
    const user = userEvent.setup()

    // First, trigger an error
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Test error' })
    })

    render(<Certificates />)

    await waitFor(() => {
      expect(screen.getByText('Certificate Issuance')).toBeInTheDocument()
    })

    // Open dialog, fill form, submit to get error
    const issueButton = screen.getByText('Issue Certificate')
    fireEvent.click(issueButton)

    const residentSelect = screen.getByLabelText('Select Resident')
    await user.click(residentSelect)
    await user.click(screen.getByText('John Doe - Batia Proper'))

    const typeSelect = screen.getByLabelText('Certificate Type')
    await user.click(typeSelect)
    await user.click(screen.getByText('Barangay Clearance - ₱50 (30 days)'))

    await user.type(screen.getByLabelText('Purpose'), 'Test')

    const submitButton = screen.getByText('Issue Certificate')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    // Close and reopen dialog
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    fireEvent.click(issueButton)

    // Error should be cleared
    expect(screen.queryByText('Test error')).not.toBeInTheDocument()
  })
})
