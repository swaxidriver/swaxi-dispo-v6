import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import ShiftDetailsModal from '../components/ShiftDetailsModal'

const mockShift = {
  id: 'shift_1',
  date: '2024-01-15',
  start: '08:00',
  end: '16:00',
  workLocation: 'Büro Nord',
  type: 'early',
  status: 'open',
  assignedTo: null,
  conflicts: []
}

const mockUser = {
  id: 'user_1',
  name: 'Test User',
  role: 'disponent'
}

const defaultProps = {
  shift: mockShift,
  isOpen: true,
  onClose: jest.fn(),
  onApply: jest.fn(),
  onAssign: jest.fn(),
  currentUser: mockUser,
  userRole: 'disponent'
}

describe('ShiftDetailsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders shift details correctly', () => {
    render(<ShiftDetailsModal {...defaultProps} />)
    
    expect(screen.getByText('Schichtdetails')).toBeInTheDocument()
    expect(screen.getByText('08:00 - 16:00')).toBeInTheDocument()
    expect(screen.getByText('Büro Nord')).toBeInTheDocument()
    expect(screen.getByText('Offen')).toBeInTheDocument()
  })

  test('calculates duration correctly', () => {
    render(<ShiftDetailsModal {...defaultProps} />)
    
    // 8 hours = 480 minutes
    expect(screen.getByText(/8h/)).toBeInTheDocument()
  })

  test('shows conflicts when present', () => {
    const shiftWithConflicts = {
      ...mockShift,
      conflicts: ['TIME_OVERLAP', 'DOUBLE_APPLICATION']
    }

    render(<ShiftDetailsModal {...defaultProps} shift={shiftWithConflicts} />)
    
    expect(screen.getByText('Konflikte erkannt')).toBeInTheDocument()
    expect(screen.getByText('Zeitüberlappung')).toBeInTheDocument()
    expect(screen.getByText('Doppelte Bewerbung')).toBeInTheDocument()
  })

  test('shows apply button for open shifts', () => {
    render(<ShiftDetailsModal {...defaultProps} />)
    
    expect(screen.getByText('Bewerben')).toBeInTheDocument()
  })

  test('hides apply button for assigned shifts', () => {
    const assignedShift = {
      ...mockShift,
      status: 'assigned',
      assignedTo: 'Other User'
    }

    render(<ShiftDetailsModal {...defaultProps} shift={assignedShift} />)
    
    expect(screen.queryByText('Bewerben')).not.toBeInTheDocument()
    expect(screen.getByText('Other User')).toBeInTheDocument()
  })

  test('calls onApply when apply button is clicked', async () => {
    const onApply = jest.fn().mockResolvedValue()
    
    render(<ShiftDetailsModal {...defaultProps} onApply={onApply} />)
    
    fireEvent.click(screen.getByText('Bewerben'))
    
    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('shift_1', 'user_1')
    })
  })

  test('shows assign button for admin users', () => {
    render(<ShiftDetailsModal {...defaultProps} userRole="admin" />)
    
    expect(screen.getByText('Zuweisen')).toBeInTheDocument()
  })

  test('hides assign button for regular users', () => {
    render(<ShiftDetailsModal {...defaultProps} userRole="analyst" />)
    
    expect(screen.queryByText('Zuweisen')).not.toBeInTheDocument()
  })

  test('disables apply button when conflicts exist', () => {
    const shiftWithConflicts = {
      ...mockShift,
      conflicts: ['TIME_OVERLAP']
    }

    render(<ShiftDetailsModal {...defaultProps} shift={shiftWithConflicts} />)
    
    const applyButton = screen.getByText('Bewerben')
    expect(applyButton).toBeDisabled()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    
    render(<ShiftDetailsModal {...defaultProps} onClose={onClose} />)
    
    fireEvent.click(screen.getByLabelText('Schließen'))
    
    expect(onClose).toHaveBeenCalled()
  })

  test('shows loading state when applying', async () => {
    const onApply = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<ShiftDetailsModal {...defaultProps} onApply={onApply} />)
    
    fireEvent.click(screen.getByText('Bewerben'))
    
    expect(screen.getByText('Bewerbe...')).toBeInTheDocument()
  })

  test('handles overnight shifts correctly', () => {
    const overnightShift = {
      ...mockShift,
      start: '22:00',
      end: '06:00'
    }

    render(<ShiftDetailsModal {...defaultProps} shift={overnightShift} />)
    
    // Should show 8 hours duration (22:00 to 06:00)
    expect(screen.getByText('22:00 - 06:00')).toBeInTheDocument()
    expect(screen.getByText(/8h/)).toBeInTheDocument()
  })

  test('renders nothing when shift is null', () => {
    const { container } = render(<ShiftDetailsModal {...defaultProps} shift={null} />)
    
    expect(container.firstChild).toBeNull()
  })

  test('handles missing optional props gracefully', () => {
    const minimalProps = {
      shift: { ...mockShift, workLocation: null, assignedTo: null },
      isOpen: true,
      onClose: jest.fn(),
      currentUser: null,
      userRole: 'analyst'
    }

    render(<ShiftDetailsModal {...minimalProps} />)
    
    expect(screen.getByText('Schichtdetails')).toBeInTheDocument()
    expect(screen.queryByText('Arbeitsort')).not.toBeInTheDocument()
    expect(screen.queryByText('Zugewiesen an')).not.toBeInTheDocument()
  })
})