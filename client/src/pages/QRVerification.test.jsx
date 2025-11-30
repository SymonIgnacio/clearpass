import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import QRVerification from './QRVerification'

global.fetch = vi.fn()

describe('QRVerification Component', () => {
  const mockVerificationData = {
    valid: true,
    resident_name: 'John Doe',
    certificate_type: 'Barangay Clearance'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVerificationData)
    })
  })

  it('renders QR verification interface', async () => {
    render(<QRVerification />)

    await waitFor(() => {
      expect(screen.getByText('QR Code Verification')).toBeInTheDocument()
    })

    expect(screen.getByText('Scan QR Code to Verify Certificate')).toBeInTheDocument()
  })

  it('verifies QR code successfully', async () => {
    render(<QRVerification />)

    await waitFor(() => {
      expect(screen.getByText('QR Code Verification')).toBeInTheDocument()
    })

    // Mock QR scan by triggering fetch
    // This would normally be triggered by QR scanner library
    expect(global.fetch).toHaveBeenCalledWith('/api/verify-qr', expect.any(Object))
  })
})
