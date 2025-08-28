import SeriesApplicationModal from '../components/SeriesApplicationModal'
import { SHIFT_STATUS } from '../utils/constants'
import * as useShiftsModule from '../contexts/useShifts'

import { renderWithProviders } from './testUtils'
import { screen, fireEvent } from './testUtils'

// Mock useShifts to observe applyToSeries calls without full provider complexity
const mockApplyToSeries = jest.fn()

jest.spyOn(useShiftsModule, 'useShifts').mockImplementation(() => ({ 
  applyToSeries: mockApplyToSeries,
  state: { shifts: [], applications: [] }
}))

function makeShift(id, dateStr, type='evening') {
  return { id, date: new Date(dateStr), type, start: '18:00', end: '20:00', status: SHIFT_STATUS.OPEN }
}

describe('SeriesApplicationModal', () => {
  beforeEach(() => {
    mockApplyToSeries.mockClear()
    // Reset to default mock implementation
    jest.spyOn(useShiftsModule, 'useShifts').mockImplementation(() => ({ 
      applyToSeries: mockApplyToSeries,
      state: { shifts: [], applications: [] }
    }))
  })

  it('renders available shifts and allows selecting multiple via type shortcut', () => {
    const shifts = [
      makeShift('s1', '2025-08-25', 'evening'),
      makeShift('s2', '2025-08-26', 'evening'),
      makeShift('s3', '2025-08-27', 'night'),
    ]
    renderWithProviders(<SeriesApplicationModal isOpen onClose={() => {}} shifts={shifts} />)

    // 3 checkboxes for open shifts
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes.length).toBe(3)

    // Click shortcut for all evening shifts
    fireEvent.click(screen.getByText(/Alle Abend-Dienste/i))

    // Both evening shifts selected
    expect(boxes[0]).toBeChecked()
    expect(boxes[1]).toBeChecked()
    expect(boxes[2]).not.toBeChecked()

    // Check if submit button is enabled (should be since shifts on different days don't conflict)
    const submitButton = screen.getByText('Bewerben')
    expect(submitButton).not.toBeDisabled()

    // Submit
    fireEvent.click(submitButton)
    expect(mockApplyToSeries).toHaveBeenCalledTimes(1)
    const [ids, user] = mockApplyToSeries.mock.calls[0]
    expect(ids.sort()).toEqual(['s1','s2'])
    expect(user).toBe('current-user')
  })

  it('disables submit when no selection and enables after selecting one', () => {
    const shifts = [makeShift('s1', '2025-08-25', 'evening')]
    renderWithProviders(<SeriesApplicationModal isOpen onClose={() => {}} shifts={shifts} />)
    const submit = screen.getByText('Bewerben')
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(submit).not.toBeDisabled()
  })

  it('displays count badge with selected shifts', () => {
    const shifts = [
      makeShift('s1', '2025-08-25', 'evening'),
      makeShift('s2', '2025-08-26', 'evening'),
    ]
    renderWithProviders(<SeriesApplicationModal isOpen onClose={() => {}} shifts={shifts} />)

    // Initially no selection
    expect(screen.getByText('0 Dienste')).toBeInTheDocument()

    // Select one shift
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(screen.getByText('1 Dienst')).toBeInTheDocument()

    // Select second shift
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    expect(screen.getByText('2 Dienste')).toBeInTheDocument()
  })

  it('detects and displays conflicts when selecting overlapping shifts', () => {
    const overlappingShifts = [
      { id: 's1', date: new Date('2025-08-25'), type: 'evening', start: '18:00', end: '22:00', status: SHIFT_STATUS.OPEN },
      { id: 's2', date: new Date('2025-08-25'), type: 'night', start: '21:00', end: '05:00', status: SHIFT_STATUS.OPEN },
    ]
    
    // Mock shifts in state to trigger conflicts
    jest.spyOn(useShiftsModule, 'useShifts').mockImplementation(() => ({ 
      applyToSeries: mockApplyToSeries,
      state: { shifts: overlappingShifts, applications: [] }
    }))

    renderWithProviders(<SeriesApplicationModal isOpen onClose={() => {}} shifts={overlappingShifts} />)

    // Select both overlapping shifts
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getAllByRole('checkbox')[1])

    // Conflict banner should appear
    expect(screen.getByText('Konflikte erkannt')).toBeInTheDocument()
    expect(screen.getByText('Zeitüberlappung')).toBeInTheDocument()

    // Submit button should be disabled due to conflicts
    expect(screen.getByText('Bewerben')).toBeDisabled()
  })

  it('allows submitting when conflicts are resolved by deselecting', () => {
    const overlappingShifts = [
      { id: 's1', date: new Date('2025-08-25'), type: 'evening', start: '18:00', end: '22:00', status: SHIFT_STATUS.OPEN },
      { id: 's2', date: new Date('2025-08-25'), type: 'night', start: '21:00', end: '05:00', status: SHIFT_STATUS.OPEN },
    ]
    
    // Mock shifts in state to trigger conflicts
    jest.spyOn(useShiftsModule, 'useShifts').mockImplementation(() => ({ 
      applyToSeries: mockApplyToSeries,
      state: { shifts: overlappingShifts, applications: [] }
    }))

    renderWithProviders(<SeriesApplicationModal isOpen onClose={() => {}} shifts={overlappingShifts} />)

    // Select both overlapping shifts
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getAllByRole('checkbox')[1])

    // Submit should be disabled
    expect(screen.getByText('Bewerben')).toBeDisabled()

    // Deselect one shift to resolve conflict
    fireEvent.click(screen.getAllByRole('checkbox')[1])

    // Conflict banner should disappear
    expect(screen.queryByText('Konflikte erkannt')).not.toBeInTheDocument()

    // Submit should be enabled
    expect(screen.getByText('Bewerben')).not.toBeDisabled()
  })
})
