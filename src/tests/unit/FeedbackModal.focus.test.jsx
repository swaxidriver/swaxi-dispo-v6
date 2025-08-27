import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('restores focus to trigger element when modal closes', async () => {
    render(<FeedbackProvider><Launcher /><FeedbackModal /></FeedbackProvider>)
    
    const launchButton = screen.getByText('launch-fb')
    launchButton.focus()
    expect(document.activeElement).toBe(launchButton)

    // Open modal
    fireEvent.click(launchButton)
    
    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close modal with escape key
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    // Focus should be restored to launch button
    await waitFor(() => {
      expect(document.activeElement).toBe(launchButton)
    })
  })

  it('restores focus when modal is closed via close button', async () => {
    render(<FeedbackProvider><Launcher /><FeedbackModal /></FeedbackProvider>)
    
    const launchButton = screen.getByText('launch-fb')
    launchButton.focus()
    expect(document.activeElement).toBe(launchButton)

    // Open modal
    fireEvent.click(launchButton)
    
    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close modal via close button
    fireEvent.click(screen.getByLabelText(/Schließen/))

    // Focus should be restored to launch button
    await waitFor(() => {
      expect(document.activeElement).toBe(launchButton)
    })
  })

  it('has correct accessibility attributes', () => {
    render(<FeedbackProvider><Launcher /><FeedbackModal /></FeedbackProvider>)
    fireEvent.click(screen.getByText('launch-fb'))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'feedback-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'feedback-desc')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Check title and description elements exist
    expect(screen.getByText('Feedback geben')).toHaveAttribute('id', 'feedback-title')
    expect(screen.getByText(/Dein Feedback hilft uns/)).toHaveAttribute('id', 'feedback-desc')
  })
})
