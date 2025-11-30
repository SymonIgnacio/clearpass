import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Census from './Census'

global.fetch = vi.fn()

describe('Census Component', () => {
  const mockCensusData = {
    overall: { total_residents: 1500, total_seniors: 120, total_pwd: 45 },
    by_sitio: [
      { sitio_name: 'Batia Proper', total_residents: 500, seniors: 40, pwd: 15 },
      { sitio_name: 'Northville 5', total_residents: 300, seniors: 25, pwd: 10 }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCensusData)
    })
  })

  it('renders census data', async () => {
    render(<Census />)

    await waitFor(() => {
      expect(screen.getByText('Population Census')).toBeInTheDocument()
    })

    expect(screen.getByText('1,500')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('fetches census data on mount', async () => {
    render(<Census />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/census')
    })
  })
})
