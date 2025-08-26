import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { ShiftProvider } from '../contexts/ShiftContext'
import { AuthProvider } from '../contexts/AuthContext'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import { useShifts } from '../contexts/useShifts'

function Probe() {
  const { state, applyToShift, assignShift, updateShiftStatus, getOpenShifts, getConflictedShifts } = useShifts()
  return (
    <div>
      <div data-testid="count">{state.shifts.length}</div>
      <div data-testid="open-count">{getOpenShifts().length}</div>
      <div data-testid="conflicted-count">{getConflictedShifts().length}</div>
  <button onClick={() => {
        const first = state.shifts[0]
        applyToShift(first.id, 'u1')
      }}>apply-first</button>
      <button onClick={() => {
        const first = state.shifts[0]
        assignShift(first.id, 'u2')
      }}>assign-first</button>
      <button onClick={() => {
        const first = state.shifts[0]
        updateShiftStatus(first.id, 'cancelled')
      }}>cancel-first</button>
  <div data-testid="notifications-count">{state.notifications.length}</div>
    </div>
  )
}

describe('ShiftContext integration basics', () => {
  test('initializes shifts and supports core actions', async () => {
    render(
      <AuthProvider>
        <ShiftTemplateProvider>
          <ShiftProvider enableAsyncInTests>
            <Probe />
          </ShiftProvider>
        </ShiftTemplateProvider>
      </AuthProvider>
    )
    await waitFor(() => {
      const count = Number(screen.getByTestId('count').textContent)
      expect(count).toBeGreaterThan(0)
    })
    const count = Number(screen.getByTestId('count').textContent)

    // Apply to first shift
    fireEvent.click(screen.getByText('apply-first'))
  // Assign first shift (also generates notification)
  fireEvent.click(screen.getByText('assign-first'))
  // Cancel first shift
  fireEvent.click(screen.getByText('cancel-first'))

    // Open count should be <= total
    const openCount = Number(screen.getByTestId('open-count').textContent)
  expect(openCount).toBeLessThanOrEqual(count)
  // Notification generated
  expect(Number(screen.getByTestId('notifications-count').textContent)).toBeGreaterThan(0)
  })
})
