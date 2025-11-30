import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AIPatrol from './AIPatrol'

global.fetch = vi.fn()

describe('AIPatrol Component', () => {
  const mockPatrolData = {
    overall_risk_level: 'HIGH',
    patrol_suggestions: {
      'Batia Proper': { risk_level: 'High', patrol_suggestion: 'Deploy 4 Tanods + Roving Patrol' }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPatrolData)
    })
  })

  it('renders AI patrol suggestions', async () => {
    render(<AIPatrol />)

    await waitFor(() => {
      expect(screen.getByText('AI Patrol Intelligence')).toBeInTheDocument()
    })

    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('Deploy 4 Tanods + Roving Patrol')).toBeInTheDocument()
  })

  it('fetches patrol data on mount', async () => {
    render(<AIPatrol />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai/patrol-suggestions')
    })
  })
})
