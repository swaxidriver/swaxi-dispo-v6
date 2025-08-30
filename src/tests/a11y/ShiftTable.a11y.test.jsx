import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

import { AuthProvider } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { ShiftProvider } from '../../contexts/ShiftContext'
import ShiftTable from '../../components/ShiftTable'
import Tooltip from '../../components/Tooltip'

// Add jest-axe matcher
expect.extend(toHaveNoViolations)

function TestWrapper({ children, initialShifts = [] }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ShiftProvider 
          disableAsyncBootstrap={true}
          repositoryOverride={{
            list: () => Promise.resolve(initialShifts),
            ping: () => Promise.resolve(true)
          }}
        >
          {children}
        </ShiftProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

function generateTestShift(id, status = 'open') {
  return {
    id: `shift_${id}`,
    date: '2024-01-15',
    status,
    start: '09:00',
    end: '17:00',
    workLocation: 'office',
    assignedTo: status === 'assigned' ? 'Test User' : null,
    conflicts: id % 3 === 0 ? ['TIME_OVERLAP'] : []
  }
}

describe('ShiftTable Accessibility', () => {
  test('has no axe violations with small dataset', async () => {
    const shifts = [generateTestShift(1), generateTestShift(2), generateTestShift(3)]
    
    const { container } = render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('has no axe violations with large virtualized dataset', async () => {
    const shifts = Array.from({ length: 150 }, (_, i) => generateTestShift(i + 1))
    
    const { container } = render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('all interactive elements have proper labels and roles', () => {
    const shifts = [
      generateTestShift(1, 'open'),
      generateTestShift(2, 'assigned'),
      generateTestShift(3, 'cancelled')
    ]
    
    render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    // Check that list has proper role
    expect(screen.getByRole('list')).toBeInTheDocument()
    
    // Check that buttons have proper aria-labels
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
      // Should also have title for tooltip
      expect(button).toHaveAttribute('title')
    })
    
    // Check disabled buttons have aria-disabled
    const disabledButtons = buttons.filter(btn => btn.disabled)
    disabledButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  test('keyboard navigation works correctly', async () => {
    const shifts = Array.from({ length: 120 }, (_, i) => generateTestShift(i + 1)) // Use virtualization
    
    render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const listContainer = screen.getByRole('list')
    
    // Should be focusable
    expect(listContainer).toHaveAttribute('tabIndex', '0')
    
    // Focus the list
    listContainer.focus()
    expect(document.activeElement).toBe(listContainer)
    
    // Test keyboard navigation
    fireEvent.keyDown(listContainer, { key: 'ArrowDown' })
    fireEvent.keyDown(listContainer, { key: 'ArrowUp' })
    fireEvent.keyDown(listContainer, { key: 'PageDown' })
    fireEvent.keyDown(listContainer, { key: 'PageUp' })
    fireEvent.keyDown(listContainer, { key: 'Home' })
    fireEvent.keyDown(listContainer, { key: 'End' })
    
    // Navigation should work without errors
    expect(document.activeElement).toBe(listContainer)
  })

  test('series application button has proper accessibility attributes', () => {
    const shifts = [
      generateTestShift(1, 'open'),
      generateTestShift(2, 'open'),
      generateTestShift(3, 'open')
    ]
    
    render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const seriesButton = screen.getByText(/Serienbewerbung/)
    expect(seriesButton).toHaveAttribute('aria-label')
    expect(seriesButton.getAttribute('aria-label')).toContain('Serienbewerbung für 3 offene Dienste')
  })

  test('virtualized list maintains accessibility with large datasets', () => {
    const shifts = Array.from({ length: 200 }, (_, i) => generateTestShift(i + 1))
    
    render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const listContainer = screen.getByRole('list')
    
    // Should have proper aria-label
    expect(listContainer).toHaveAttribute('aria-label')
    expect(listContainer.getAttribute('aria-label')).toContain('200 Elementen')
    
    // Should be keyboard navigable
    expect(listContainer).toHaveAttribute('tabIndex', '0')
    
    // Check that rendered items have proper role
    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThan(0)
    expect(listItems.length).toBeLessThan(200) // Should be virtualized
  })
})

describe('Tooltip Accessibility', () => {
  test('has no axe violations', async () => {
    const { container } = render(
      <Tooltip content="Test tooltip content">
        <button>Hover me</button>
      </Tooltip>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('has proper ARIA attributes', async () => {
    render(
      <Tooltip content="Test tooltip content">
        <button>Hover me</button>
      </Tooltip>
    )
    
    const trigger = screen.getByText('Hover me')
    
    // Should be focusable
    expect(trigger.parentElement).toHaveAttribute('tabIndex', '0')
    expect(trigger.parentElement).toHaveAttribute('role', 'button')
    
    // Show tooltip on hover
    fireEvent.mouseEnter(trigger.parentElement)
    
    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveAttribute('aria-live', 'polite')
      
      // Trigger should have aria-describedby pointing to tooltip
      expect(trigger.parentElement).toHaveAttribute('aria-describedby')
      const describedBy = trigger.parentElement.getAttribute('aria-describedby')
      expect(tooltip).toHaveAttribute('id', describedBy)
    })
  })

  test('keyboard navigation works', async () => {
    render(
      <Tooltip content="Test tooltip content">
        <button>Focus me</button>
      </Tooltip>
    )
    
    const trigger = screen.getByText('Focus me').parentElement
    
    // Focus and activate with keyboard
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    
    // Press Enter to show tooltip
    fireEvent.keyDown(trigger, { key: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
    })
    
    // Press Escape to hide tooltip
    fireEvent.keyDown(trigger, { key: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  test('mobile long-press accessibility', async () => {
    render(
      <Tooltip content="Test tooltip content">
        <button>Touch me</button>
      </Tooltip>
    )
    
    const trigger = screen.getByText('Touch me').parentElement
    
    // Simulate touch start (long press)
    fireEvent.touchStart(trigger)
    
    // Wait for long press timeout (600ms)
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument()
    }, { timeout: 700 })
    
    // Touch end should hide tooltip when outside trigger
    fireEvent.touchEnd(trigger, {
      changedTouches: [{
        clientX: 0,
        clientY: 0
      }]
    })
    
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })
})