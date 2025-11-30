import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Residents from './Residents'

// Mock fetch globally
global.fetch = vi.fn()

describe('Residents Component', () => {
  const mockResidents = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      middle_name: 'M',
      age: 30,
      gender: 'Male',
      sitio_name: 'Batia Proper',
      sitio_id: 1,
      is_senior: false,
      is_pwd: true,
      is_single_parent: false,
      employment_status: 'Employed',
      monthly_income: 15000
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      middle_name: '',
      age: 65,
      gender: 'Female',
      sitio_name: 'Northville 5',
      sitio_id: 2,
      is_senior: true,
      is_pwd: false,
      is_single_parent: true,
      employment_status: 'Retired',
      monthly_income: 5000
    }
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

  it('renders residents table', async () => {
    render(<Residents />)

    await waitFor(() => {
      expect(screen.getByText('Resident Management')).toBeInTheDocument()
    })

    expect(screen.getByText('John M Doe')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText('Batia Proper')).toBeInTheDocument()
    expect(screen.getByText('PWD')).toBeInTheDocument()
    expect(screen.getByText('₱15000')).toBeInTheDocument()
  })

  it('displays vulnerability chips correctly', async () => {
    render(<Residents />)

    await waitFor(() => {
      expect(screen.getByText('Resident Management')).toBeInTheDocument()
    })

    expect(screen.getByText('PWD')).toBeInTheDocument()
    expect(screen.getByText('Senior')).toBeInTheDocument()
    expect(screen.getByText('Single Parent')).toBeInTheDocument()
  })

  it('opens add resident dialog', async () => {
    render(<Residents />)

    await waitFor(() => {
      expect(screen.getByText('Resident Management')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Resident')
    fireEvent.click(addButton)

    expect(screen.getByText('Add New Resident')).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Age')).toBeInTheDocument()
  })

  it('opens edit resident dialog with pre-filled data', async () => {
    render(<Residents />)

    await waitFor(() => {
      expect(screen.getByText('Resident Management')).toBeInTheDocument()
    })

    // Find and click edit button for first resident
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    fireEvent.click(editButtons[0])

    expect(screen.getByText('Edit Resident')).toBeInTheDocument()

    // Check if form is pre-filled
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
  })

  it('submits new resident successfully', async () => {
    const user = userEvent.setup()

    // Mock POST response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 3 })
    })

    render(<Residents />)

    await waitFor(() => {
      expect(screen.getByText('Resident Management')).toBeInTheDocument()
    })

    // Open dialog
    const addButton = screen.getByText('Add Resident')
    fireEvent.click(addButton)

    // Fill form
    await user.type(screen.getByLabelText('First Name'), 'New')
    await user.type(screen.getByLabelText('Last Name'), 'Resident')
    await user.type(screen.getByLabelText('Age'), '25')

    // Select gender
    const genderSelect = screen.getByLabelText('Gender')
    await user.click(genderSelect)
    await user.click(screen.getByText('Male'))

    // Select sitio
    const sitioSelect = screen.getByLabelText('Sitio')
    await user.click(sitioSelect)
    await user.click(screen.getByText('Batia Proper'))

    // Submit
    const submitButton = screen.getByText('Add Resident')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/residents', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"first_name":"New"')
      }))
    })
  })

  it('fetches data on mount', async () => {
    render(<Residents />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/residents')
      expect(global.fetch).toHaveBeenCalledWith('/api/sitios')
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('handles delete confirmation', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    // Mock DELETE response
    global.fetch.mockResolvedValueOnce({ ok: true })

    render(<Residents />)

    await waitFor(() => {
      expect(screen.getByText('Resident Management')).toBeInTheDocument()
    })

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/residents/1', { method: 'DELETE' })
    })

    confirmSpy.mockRestore()
  })
})
