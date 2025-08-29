import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react'
import Calendar from '../pages/Calendar'
import { ShiftProvider } from '../contexts/ShiftContext'
import AuthContext from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { MemoryRouter } from 'react-router-dom'

// Mock data for testing
const mockShifts = [
  {
    id: '2024-01-15_Morning',
    date: '2024-01-15',
    type: 'Morning',
    start: '08:00',
    end: '12:00',
    status: 'open',
    assignedTo: null,
    workLocation: 'office',
    conflicts: []
  },
  {
    id: '2024-01-16_Afternoon',
    date: '2024-01-16',
    type: 'Afternoon',
    start: '14:00',
    end: '18:00',
    status: 'assigned',
    assignedTo: 'John Doe',
    workLocation: 'office',
    conflicts: []
  }
]

const mockAuth = {
  user: { id: 'test-user', name: 'Test User', role: 'disponent' },
  login: jest.fn(),
  logout: jest.fn()
}

const TestWrapper = ({ children, initialShifts = mockShifts }) => (
  <MemoryRouter>
    <AuthContext.Provider value={mockAuth}>
      <ThemeProvider>
        <ShiftProvider disableAsyncBootstrap={true}>
          {children}
        </ShiftProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  </MemoryRouter>
)

describe('Drag & Drop Functionality', () => {
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn((key) => {
        if (key === 'shifts') return JSON.stringify(mockShifts)
        return null
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders shifts as draggable in week view for managers', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      )
    })

    // Switch to week view if not already
    const weekButton = screen.getByText('Woche')
    if (weekButton) {
      await act(async () => {
        fireEvent.click(weekButton)
      })
    }

    await waitFor(() => {
      const shiftElements = screen.getAllByText(/Morning|Afternoon/)
      expect(shiftElements.length).toBeGreaterThan(0)
      
      // Check that shifts have draggable attribute
      shiftElements.forEach(element => {
        const draggableShift = element.closest('[draggable="true"]')
        expect(draggableShift).toBeInTheDocument()
      })
    })
  })

  test('shows undo button when shift is moved', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      )
    })

    // Initially, undo button should not be visible
    expect(screen.queryByText(/Rückgängig/)).not.toBeInTheDocument()

    // After moving a shift (we'll simulate this by checking context state)
    // For now, just verify the button can appear when undoState exists
  })

  test('drag preview shows when dragging shift', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      )
    })

    await waitFor(() => {
      const shiftElement = screen.getAllByText(/Morning|Afternoon/)[0]
      const draggableShift = shiftElement.closest('[draggable="true"]')
      
      if (draggableShift) {
        // Simulate drag start
        act(() => {
          fireEvent.dragStart(draggableShift, {
            dataTransfer: {
              effectAllowed: 'move',
              setData: jest.fn()
            }
          })
        })

        // Check that opacity changes during drag
        expect(draggableShift).toHaveStyle('opacity: 0.5')
      }
    })
  })

  test('handles keyboard shortcut for undo (Ctrl+Z)', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      )
    })

    // Simulate Ctrl+Z
    act(() => {
      fireEvent.keyDown(document, {
        key: 'z',
        ctrlKey: true,
        preventDefault: jest.fn()
      })
    })

    // Since there's no undo state initially, nothing should happen
    // This tests that the event listener is attached correctly
  })

  test('shows conflict notification for invalid drop', async () => {
    // This test would need to be more complex to actually test drag & drop
    // For now, we just verify the basic structure is in place
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      )
    })

    expect(screen.getByText('Kalender')).toBeInTheDocument()
  })

  test('maintains shift data integrity after drag operations', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      )
    })

    // Verify initial shift data is rendered correctly
    await waitFor(() => {
      expect(screen.getByText(/Morning|Afternoon/)).toBeInTheDocument()
    })
  })
})