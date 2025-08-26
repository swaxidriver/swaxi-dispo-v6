import { render, screen, fireEvent } from '@testing-library/react'

import { ShiftProvider } from '../contexts/ShiftContext'
import CreateShiftModal from '../components/CreateShiftModal'

function setup() {
  const onClose = jest.fn()
  render(
    <ShiftProvider>
      <CreateShiftModal isOpen={true} onClose={onClose} />
    </ShiftProvider>
  )
  return { onClose }
}

describe('CreateShiftModal', () => {
  it('creates a shift and closes', () => {
    const { onClose } = setup()
    const saveBtn = screen.getByRole('button', { name: /speichern/i })
    fireEvent.click(saveBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows validation error when missing fields', () => {
    const { onClose } = setup()
    const dateInput = screen.getByLabelText('Datum')
    // Clear date to trigger validation
    fireEvent.change(dateInput, { target: { value: '' } })
    const saveBtn = screen.getByRole('button', { name: /speichern/i })
    fireEvent.click(saveBtn)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/Alle Felder erforderlich/)
  })
})
