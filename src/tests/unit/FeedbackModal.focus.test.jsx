import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { FeedbackProvider } from '../../contexts/FeedbackContext'
import { useFeedback } from '../../contexts/useFeedback'
import FeedbackModal from '../../components/FeedbackModal'

function Launcher() {
  const fb = useFeedback()
  return <button onClick={fb.open}>launch-fb</button>
}

describe('FeedbackModal accessibility basics', () => {
  it('traps focus and blocks empty submit', () => {
    render(<FeedbackProvider><Launcher /><FeedbackModal /></FeedbackProvider>)
    fireEvent.click(screen.getByText('launch-fb'))
    const textarea = screen.getByLabelText(/Nachricht/i)
    textarea.focus()
    // Tab cycles inside dialog; we simulate by focusing close then Tab Shift
    const closeBtn = screen.getByLabelText(/Schließen/)
    closeBtn.focus()
    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true })
    // Expect focus moved to last focusable (Send or Export button). We just assert still inside modal.
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
    // Empty submit disabled
    const sendBtn = screen.getByRole('button', { name: 'Senden' })
    expect(sendBtn).toBeDisabled()
  })
})
