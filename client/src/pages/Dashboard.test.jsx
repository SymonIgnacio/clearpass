import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from './Dashboard'

// Mock fetch globally
global.fetch = vi.fn()

describe('Dashboard Component', () => {
  const mockStats = {
    overall: {
      total_residents: 1500,
      total_seniors: 120,
      total_pwd: 45,
      total_single_parents: 80
    }
  }

  const mockCertificates = [
    { id: 1, certificate_type: 'Barangay Clearance', created_at: '2025-01-01' },
    { id: 2, certificate_type: 'Certificate of Residency', created_at: '2025-01-02' }
  ]

  const mockBlotterCases = [
    { id: 1, status: 'Pending', incident_type: 'Theft' },
    { id: 2, status: 'Resolved', incident_type: 'Noise Complaint' },
    { id: 3, status: 'Pending', incident_type: 'Disturbance' }
  ]

  const mockPatrolSuggestions = {
    overall_risk_assessment: 'HIGH',
    confidence_score: 0.85,
    max_risk_score: 5,
    recommendations: [
      'Deploy 4 Tanods + Roving Patrol in Batia Proper',
      'Increase night patrols in high-risk areas',
      'Monitor CCTV feeds continuously'
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful API responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCertificates)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBlotterCases)
      })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    render(<Dashboard />)

    expect(screen.getByText('Loading Barangay Dashboard...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders dashboard with stats after loading', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    // Check stat cards
    expect(screen.getByText('Total Population')).toBeInTheDocument()
    expect(screen.getByText('1,500')).toBeInTheDocument()
    expect(screen.getByText('Active Cases')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // 2 pending cases
    expect(screen.getByText('Certificates Issued')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Vulnerable Groups')).toBeInTheDocument()
    expect(screen.getByText('245')).toBeInTheDocument() // 120 + 45 + 80
  })

  it('fetches data on mount', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/census')
      expect(global.fetch).toHaveBeenCalledWith('/api/certificates')
      expect(global.fetch).toHaveBeenCalledWith('/api/blotter')
    })

    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('handles API errors gracefully', async () => {
    // Mock failed responses
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    // Spy on console.error to avoid test output pollution
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    // Should still render with default values
    expect(screen.getByText('0')).toBeInTheDocument() // Stats show 0 when API fails

    consoleSpy.mockRestore()
  })

  it('refreshes data when refresh button is clicked', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    // Click refresh button
    const refreshButton = screen.getByLabelText('Refresh Data')
    fireEvent.click(refreshButton)

    // Should call fetch again for stats
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4) // 3 initial + 1 refresh
    })
  })

  it('generates patrol suggestions when button is clicked', async () => {
    // Reset fetch mock for this test
    global.fetch.mockClear()

    // Mock the patrol suggestions API
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPatrolSuggestions)
    })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    // Click generate intelligence report button
    const generateButton = screen.getByText('Generate Intelligence Report')
    fireEvent.click(generateButton)

    // Should show loading state
    expect(screen.getByText('Analyzing Patterns...')).toBeInTheDocument()

    // Wait for patrol suggestions to load
    await waitFor(() => {
      expect(screen.getByText('HIGH Risk Level')).toBeInTheDocument()
    })

    expect(screen.getByText('Confidence: 85%')).toBeInTheDocument()
    expect(screen.getByText('Max Incidents: 5')).toBeInTheDocument()
    expect(screen.getByText('Strategic Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Deploy 4 Tanods + Roving Patrol in Batia Proper')).toBeInTheDocument()
  })

  it('displays correct risk icon and color', async () => {
    global.fetch.mockClear()
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        overall_risk_assessment: 'CRITICAL',
        confidence_score: 0.95,
        max_risk_score: 8,
        recommendations: ['Emergency response required']
      })
    })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    const generateButton = screen.getByText('Generate Intelligence Report')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('CRITICAL Risk Level')).toBeInTheDocument()
    })

    // Check if error alert is displayed (for CRITICAL/HIGH)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('MuiAlert-standardError')
  })

  it('shows quick actions buttons', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Register Resident')).toBeInTheDocument()
    expect(screen.getByText('Report Incident')).toBeInTheDocument()
    expect(screen.getByText('Issue Certificate')).toBeInTheDocument()
    expect(screen.getByText('AI Analysis')).toBeInTheDocument()
    expect(screen.getByText('Community Events')).toBeInTheDocument()
  })

  it('displays system status chip', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    expect(screen.getByText('System Online')).toBeInTheDocument()
  })

  it('shows pro tip section', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    expect(screen.getByText('💡 Pro Tip')).toBeInTheDocument()
    expect(screen.getByText(/Use AI Patrol Intelligence/)).toBeInTheDocument()
  })

  it('handles patrol suggestions API error', async () => {
    global.fetch.mockClear()
    global.fetch.mockRejectedValueOnce(new Error('API Error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Barangay Command Center')).toBeInTheDocument()
    })

    const generateButton = screen.getByText('Generate Intelligence Report')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching patrol suggestions:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})
