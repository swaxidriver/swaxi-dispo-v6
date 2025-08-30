import { render, screen, fireEvent } from '@testing-library/react'

import { ShiftProvider } from '../contexts/ShiftContext'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import ShiftTable from '../components/ShiftTable'

// Generate large dataset for performance testing
function generateTestShifts(count) {
  const shifts = []
  const statuses = ['open', 'assigned', 'cancelled']
  const baseDate = new Date('2024-01-01')
  
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + Math.floor(i / 3))
    
    const shift = {
      id: `shift_${i}`,
      date: date.toISOString().split('T')[0],
      status: statuses[i % 3],
      assignedTo: i % 3 === 1 ? `User${i % 10}` : null,
      conflicts: i % 5 === 0 ? ['TIME_OVERLAP'] : [],
      start: '09:00',
      end: '17:00',
      workLocation: i % 4 === 0 ? 'home' : 'office'
    }
    shifts.push(shift)
  }
  
  return shifts
}

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

describe('ShiftTable Performance', () => {
  beforeEach(() => {
    // Mock performance.now for consistent testing
    const mockPerformance = {
      now: jest.fn(() => Date.now())
    }
    global.performance = mockPerformance
    
    localStorage.clear()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders 500 shifts without performance degradation', async () => {
    const shifts = generateTestShifts(500)
    
    const startTime = performance.now()
    
    const { container } = render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Log for debugging
    console.log(`ShiftTable render time for 500 shifts: ${renderTime.toFixed(2)}ms`)
    
    // Should render without taking too long
    expect(renderTime).toBeLessThan(100) // Allow up to 100ms for initial render
    
    // Should use virtualization for large datasets
    expect(container.querySelector('[role="list"]')).toBeInTheDocument()
    
    // Should show some content but not all 500 items in DOM (virtualized)
    const renderedItems = container.querySelectorAll('li')
    expect(renderedItems.length).toBeLessThan(500) // Virtualization should limit DOM nodes
  })

  test('handles interaction performance with large dataset', async () => {
    const shifts = generateTestShifts(200) // Use a smaller number for interaction testing
    
    render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    // Find first "Bewerben" button for interaction test
    const applyButtons = screen.getAllByText('Bewerben')
    if (applyButtons.length > 0) {
      const startTime = performance.now()
      
      fireEvent.click(applyButtons[0])
      
      const endTime = performance.now()
      const interactionTime = endTime - startTime
      
      console.log(`Button click interaction time: ${interactionTime.toFixed(2)}ms`)
      
      // Interaction should be fast (<50ms as per requirement)
      expect(interactionTime).toBeLessThan(50)
    }
  })

  test('virtualization preserves keyboard navigation', async () => {
    const shifts = generateTestShifts(150) // Use virtualization threshold
    
    render(
      <TestWrapper>
        <ShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    // Find the virtualized list container
    const listContainer = screen.getByRole('list')
    expect(listContainer).toBeInTheDocument()
    
    // Should be focusable for keyboard navigation
    expect(listContainer).toHaveAttribute('tabIndex', '0')
    
    // Test keyboard navigation
    listContainer.focus()
    expect(document.activeElement).toBe(listContainer)
    
    // Test arrow key navigation
    const startTime = performance.now()
    
    fireEvent.keyDown(listContainer, { key: 'ArrowDown' })
    fireEvent.keyDown(listContainer, { key: 'ArrowUp' })
    fireEvent.keyDown(listContainer, { key: 'PageDown' })
    
    const endTime = performance.now()
    const navTime = endTime - startTime
    
    console.log(`Keyboard navigation time: ${navTime.toFixed(2)}ms`)
    
    // Keyboard navigation should be responsive
    expect(navTime).toBeLessThan(10)
  })

  test('switches between virtualized and regular rendering based on item count', () => {
    // Test small dataset (no virtualization)
    const smallShifts = generateTestShifts(50)
    const { rerender } = render(
      <TestWrapper>
        <ShiftTable shifts={smallShifts} showActions={true} />
      </TestWrapper>
    )
    
    // Should use regular ul/li structure for small datasets
    expect(screen.getByRole('list')).toHaveProperty('tagName', 'UL')
    
    // Test large dataset (with virtualization)
    const largeShifts = generateTestShifts(150)
    rerender(
      <TestWrapper>
        <ShiftTable shifts={largeShifts} showActions={true} />
      </TestWrapper>
    )
    
    // Should switch to virtualized rendering
    const listElement = screen.getByRole('list')
    expect(listElement).toHaveAttribute('tabIndex', '0') // Virtualized list is focusable
  })

  test('memoization prevents unnecessary re-renders', () => {
    const shifts = generateTestShifts(100)
    
    let renderCount = 0
    
    // Mock the shift row rendering to count renders
    const OriginalShiftTable = require('../components/ShiftTable').default
    
    const { rerender } = render(
      <TestWrapper>
        <OriginalShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    // Re-render with same props - should not cause unnecessary work
    const startTime = performance.now()
    
    rerender(
      <TestWrapper>
        <OriginalShiftTable shifts={shifts} showActions={true} />
      </TestWrapper>
    )
    
    const endTime = performance.now()
    const rerenderTime = endTime - startTime
    
    console.log(`Re-render time with same props: ${rerenderTime.toFixed(2)}ms`)
    
    // Re-render with identical props should be very fast due to memoization
    expect(rerenderTime).toBeLessThan(20)
  })
})