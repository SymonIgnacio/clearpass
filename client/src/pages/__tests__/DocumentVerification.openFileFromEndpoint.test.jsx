import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DocumentVerification from '../DocumentVerification'
import { NotificationProvider } from '../../contexts/NotificationContext'
import { AuthProvider } from '../../contexts/AuthContext'

vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn(async (endpoint) => {
    if (endpoint.startsWith('secretary/applications')) {
      return { ok: true, json: async () => [] }
    }
    if (endpoint === 'secretary/resident-documents') {
      return {
        ok: true,
        json: async () => [
          {
            id: 1,
            resident_id: 'RES-1',
            resident_name: 'Test User',
            document_type: 'id',
            file_name: 'test.pdf',
            verification_status: 'pending',
            created_at: new Date().toISOString()
          }
        ]
      }
    }
    if (endpoint === 'secretary/documents/1/download') {
      return { ok: true, blob: async () => new Blob(['x'], { type: 'application/pdf' }) }
    }
    return { ok: true, json: async () => [] }
  })
}))

describe('DocumentVerification downloads', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn(() => ({})))
    Object.defineProperty(global.URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock'),
      writable: true
    })
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true
    })
  })

  it('opens resident document via secure download endpoint', async () => {
    render(
      <AuthProvider>
        <NotificationProvider>
          <DocumentVerification />
        </NotificationProvider>
      </AuthProvider>
    )
    fireEvent.click(await screen.findByRole('tab', { name: /resident documents/i }))
    const buttons = await screen.findAllByLabelText(/open file/i)
    fireEvent.click(buttons[0])
    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalled())
  })
})
