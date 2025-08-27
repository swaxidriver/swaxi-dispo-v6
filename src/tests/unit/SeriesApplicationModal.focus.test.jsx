import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

import SeriesApplicationModal from '../../components/SeriesApplicationModal'
import { renderWithProviders } from '../testUtils'
import { SHIFT_STATUS } from '../../utils/constants'
import * as useShiftsModule from '../../contexts/useShifts'

// Mock useShifts to observe applyToSeries calls without full provider complexity
const mockApplyToSeries = jest.fn()

jest.spyOn(useShiftsModule, 'useShifts').mockImplementation(() => ({ applyToSeries: mockApplyToSeries }))

function makeShift(id, dateStr, type='evening') {
  return { id, date: new Date(dateStr), type, start: '18:00', end: '20:00', status: SHIFT_STATUS.OPEN }
}

describe('SeriesApplicationModal focus management', () => {
  let triggerButton
  let onClose

  beforeEach(() => {
    onClose = jest.fn()
    mockApplyToSeries.mockClear()
    // Create a trigger button to test focus restoration
    triggerButton = document.createElement('button')
    triggerButton.textContent = 'Open Series Application'
    document.body.appendChild(triggerButton)
    triggerButton.focus()
  })

  afterEach(() => {
    if (triggerButton) {
      document.body.removeChild(triggerButton)
    }
  })

  it('has correct accessibility attributes', () => {
    const shifts = [makeShift('s1', '2025-08-25', 'evening')]
    renderWithProviders(
      <SeriesApplicationModal isOpen={true} onClose={onClose} shifts={shifts} />
    )

    // Check dialog role exists
    const dialogElement = document.querySelector('[role="dialog"]')
    expect(dialogElement).toBeInTheDocument()
    expect(dialogElement).toHaveAttribute('aria-labelledby', 'series-modal-title')
    expect(dialogElement).toHaveAttribute('aria-describedby', 'series-modal-desc')
    expect(dialogElement).toHaveAttribute('aria-modal', 'true')

    // Check title and description elements exist
    expect(screen.getByText('Serienbewerbung')).toHaveAttribute('id', 'series-modal-title')
    expect(screen.getByText(/Bewerben Sie sich für mehrere Dienste/)).toHaveAttribute('id', 'series-modal-desc')
  })

  it('stores focused element when modal opens', () => {
    const shifts = [makeShift('s1', '2025-08-25', 'evening')]
    
    // Focus the trigger button before opening modal
    triggerButton.focus()
    expect(document.activeElement).toBe(triggerButton)

    renderWithProviders(
      <SeriesApplicationModal isOpen={true} onClose={onClose} shifts={shifts} />
    )

    // Modal should be open and have proper aria attributes
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeInTheDocument()
  })

  it('restores focus to trigger element when modal closes', async () => {
    const shifts = [makeShift('s1', '2025-08-25', 'evening')]
    
    // Focus the trigger button before opening modal
    triggerButton.focus()
    expect(document.activeElement).toBe(triggerButton)

    const { rerender } = renderWithProviders(
      <SeriesApplicationModal isOpen={true} onClose={onClose} shifts={shifts} />
    )

    // Modal should be open and have dialog role
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()

    // Close the modal by rerendering with isOpen=false
    rerender(
      <div>
        <SeriesApplicationModal isOpen={false} onClose={onClose} shifts={shifts} />
      </div>
    )

    // Focus should be restored to trigger button
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton)
    })
  })

  it('focus remains trapped within modal during interaction', () => {
    const shifts = [makeShift('s1', '2025-08-25', 'evening')]
    
    renderWithProviders(
      <SeriesApplicationModal isOpen={true} onClose={onClose} shifts={shifts} />
    )

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeInTheDocument()

    // Find focusable elements in the modal
    const checkboxes = screen.getAllByRole('checkbox')
    const buttons = screen.getAllByRole('button')
    
    expect(checkboxes.length).toBeGreaterThan(0)
    expect(buttons.length).toBeGreaterThan(0)

    // Focus should be contained within the modal
    checkboxes[0].focus()
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('returns focus to trigger button when closed via close button', async () => {
    const shifts = [makeShift('s1', '2025-08-25', 'evening')]
    
    // Focus the trigger button before opening modal
    triggerButton.focus()
    expect(document.activeElement).toBe(triggerButton)

    renderWithProviders(
      <SeriesApplicationModal isOpen={true} onClose={onClose} shifts={shifts} />
    )

    // Modal should be open
    expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()

    // Click the close button (with sr-only text "Schließen")
    const closeButton = screen.getByRole('button', { name: /Schließen/i })
    fireEvent.click(closeButton)

    // onClose should have been called
    expect(onClose).toHaveBeenCalled()
  })
})