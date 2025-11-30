import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import CommunityEvents from './CommunityEvents'

global.fetch = vi.fn()

describe('CommunityEvents Component', () => {
  const mockEvents = [
    { id: 1, title: 'Barangay Meeting', date: '2025-01-15', description: 'Monthly meeting' },
    { id: 2, title: 'Clean-up Drive', date: '2025-01-20', description: 'Community clean-up' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEvents)
    })
  })

  it('renders community events', async () => {
    render(<CommunityEvents />)

    await waitFor(() => {
      expect(screen.getByText('Community Events')).toBeInTheDocument()
    })

    expect(screen.getByText('Barangay Meeting')).toBeInTheDocument()
    expect(screen.getByText('Clean-up Drive')).toBeInTheDocument()
  })

  it('fetches events on mount', async () => {
    render(<CommunityEvents />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events')
    })
  })
})
