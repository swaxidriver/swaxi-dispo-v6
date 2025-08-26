import ShiftTable from '../components/ShiftTable'
import AuthContext from '../contexts/AuthContext'
import { SHIFT_STATUS, WORK_LOCATIONS } from '../utils/constants'
import * as useShiftsModule from '../contexts/useShifts'

import { renderWithProviders, screen, fireEvent } from './testUtils'

// Mock useShifts to track calls without full provider overhead
const mockApplyToShift = jest.fn()
const mockAssignShift = jest.fn()
const mockCancelShift = jest.fn()

jest.spyOn(useShiftsModule, 'useShifts').mockImplementation(() => ({
  applyToShift: mockApplyToShift,
  assignShift: mockAssignShift,
  cancelShift: mockCancelShift,
}))

describe('ShiftTable actions', () => {
  beforeEach(() => {
    mockApplyToShift.mockClear()
    mockAssignShift.mockClear()
  mockCancelShift.mockClear()
  })

  const baseShift = (overrides = {}) => ({
    id: 's1',
    date: new Date('2025-08-25'),
    start: '09:00',
    end: '17:00',
    status: SHIFT_STATUS.OPEN,
    assignedTo: null,
    workLocation: WORK_LOCATIONS.OFFICE,
    conflicts: [],
    ...overrides,
  })

  it('invokes applyToShift when Bewerben clicked', () => {
    const shifts = [baseShift()]
    renderWithProviders(
      <AuthContext.Provider value={{ user: { name: 'Tester', role: 'disponent' }}}>
        <ShiftTable shifts={shifts} />
      </AuthContext.Provider>
    )
    fireEvent.click(screen.getByText('Bewerben'))
    expect(mockApplyToShift).toHaveBeenCalledWith('s1', 'Tester')
  })

  it('invokes assignShift when Zuweisen clicked for manager role', () => {
    const shifts = [baseShift()]
    renderWithProviders(
      <AuthContext.Provider value={{ user: { name: 'Lead', role: 'chief' }}}>
        <ShiftTable shifts={shifts} />
      </AuthContext.Provider>
    )
    fireEvent.click(screen.getByText('Zuweisen'))
    expect(mockAssignShift).toHaveBeenCalledWith('s1', 'Lead')
  })

  it('calls cancelShift when Absagen clicked on assigned shift', () => {
    const shifts = [baseShift({ status: SHIFT_STATUS.ASSIGNED, assignedTo: 'Tester' })]
    renderWithProviders(
      <AuthContext.Provider value={{ user: { name: 'Chief', role: 'chief' }}}>
        <ShiftTable shifts={shifts} />
      </AuthContext.Provider>
    )
    fireEvent.click(screen.getByText('Absagen'))
    expect(mockCancelShift).toHaveBeenCalledWith('s1')
  })

  it('disables Bewerben when not logged in', () => {
    const shifts = [baseShift()]
    renderWithProviders(<AuthContext.Provider value={{ user: null }}><ShiftTable shifts={shifts} /></AuthContext.Provider>)
    const btn = screen.getByText('Bewerben')
    expect(btn).toBeDisabled()
    expect(btn.getAttribute('title')).toMatch(/Anmeldung erforderlich/)
  })

  it('disables Zuweisen when status not open', () => {
    const shifts = [baseShift({ status: SHIFT_STATUS.CANCELLED })]
    renderWithProviders(<AuthContext.Provider value={{ user: { name: 'Lead', role: 'chief' }}}><ShiftTable shifts={shifts} /></AuthContext.Provider>)
    // No Zuweisen button should appear because shift not open
    expect(screen.queryByText('Zuweisen')).toBeNull()
  })
})
