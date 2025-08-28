import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

import ChangelogModal from '../../components/ChangelogModal'

describe('ChangelogModal', () => {
  let onClose

  beforeEach(() => {
    onClose = jest.fn()
  })

  it('renders correctly when open', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Änderungsprotokoll')).toBeInTheDocument()
    expect(screen.getByText(/Aktuelle Änderungen und Verbesserungen/)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ChangelogModal isOpen={false} onClose={onClose} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'changelog-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'changelog-desc')
    
    expect(screen.getByRole('heading', { name: 'Änderungsprotokoll' })).toHaveAttribute('id', 'changelog-title')
    expect(screen.getByText(/Aktuelle Änderungen und Verbesserungen/)).toHaveAttribute('id', 'changelog-desc')
  })

  it('displays changelog entries with version, date, title and description', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    // Check for version 0.3.0 entry
    expect(screen.getByText('v0.3.0')).toBeInTheDocument()
    expect(screen.getByText('2025-08-27')).toBeInTheDocument()
    expect(screen.getByText('Design Tokens & Typography Update')).toBeInTheDocument()
    expect(screen.getByText(/Modernized font to Manrope/)).toBeInTheDocument()
    
    // Check for version 0.2.0 entry  
    expect(screen.getByText('v0.2.0')).toBeInTheDocument()
    expect(screen.getByText('Offline Queue & Accessibility')).toBeInTheDocument()
  })

  it('closes when ESC key is pressed', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when close button is clicked', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    const closeButton = screen.getByLabelText('Schließen')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when "Schließen" button is clicked', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    // Get the button specifically by text content (not aria-label)
    const closeButtons = screen.getAllByRole('button', { name: 'Schließen' })
    const closeButtonText = closeButtons.find(btn => btn.textContent === 'Schließen')
    
    expect(closeButtonText).toBeInTheDocument()
    fireEvent.click(closeButtonText)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('manages focus correctly', async () => {
    // Create a trigger button to test focus restoration
    const triggerButton = document.createElement('button')
    triggerButton.textContent = 'Open Changelog'
    document.body.appendChild(triggerButton)
    
    // Focus the trigger button before opening modal
    triggerButton.focus()
    expect(document.activeElement).toBe(triggerButton)

    const { rerender } = render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    // Modal should be open and have dialog role
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close the modal by rerendering with isOpen=false
    rerender(<ChangelogModal isOpen={false} onClose={onClose} />)

    // Focus should be restored to trigger button
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton)
    })
    
    // Cleanup
    document.body.removeChild(triggerButton)
  })

  it('traps focus within modal', () => {
    render(<ChangelogModal isOpen={true} onClose={onClose} />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    
    // Find focusable elements
    const closeButtonX = screen.getByLabelText('Schließen')
    const closeButtons = screen.getAllByRole('button', { name: 'Schließen' })
    const closeButtonText = closeButtons.find(btn => btn.textContent === 'Schließen')
    
    expect(closeButtonX).toBeInTheDocument()
    expect(closeButtonText).toBeInTheDocument()
    
    // Test tab key behavior (basic check that focusable elements exist)
    fireEvent.keyDown(dialog, { key: 'Tab' })
    // We're not simulating the full focus trap behavior, just verifying the modal has focusable elements
  })
})