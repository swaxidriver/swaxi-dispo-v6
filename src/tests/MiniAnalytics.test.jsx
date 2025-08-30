import { render, screen, fireEvent } from '@testing-library/react'

import { ShiftProvider } from '../contexts/ShiftContext'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import MiniAnalytics from '../components/MiniAnalytics'

// Mock data for testing
const mockShifts = [
  {
    id: '2024-01-15_morning',
    date: '2024-01-15',
    status: 'open',
    conflicts: []
  },
  {
    id: '2024-01-15_evening',
    date: '2024-01-15',
    status: 'assigned',
    assignedTo: 'User1',
    conflicts: []
  },
  {
    id: '2024-01-16_morning',
    date: '2024-01-16',
    status: 'open',
    conflicts: ['TIME_OVERLAP']
  }
]

const mockApplications = [
  {
    id: 'app1',
    shiftId: '2024-01-15_morning',
    userId: 'User1',
    ts: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
  },
  {
    id: 'app2',
    shiftId: '2024-01-16_morning',
    userId: 'User2',
    ts: Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago (should not count)
  }
]

function TestWrapper({ children, initialShifts = [], initialApplications = [] }) {
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

describe('MiniAnalytics', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Mock today's date
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('displays correct analytics tiles', async () => {
    // Mock localStorage to include our test data
    localStorage.setItem('shifts', JSON.stringify(mockShifts))
    localStorage.setItem('applications', JSON.stringify(mockApplications))

    const mockViewSource = jest.fn()
    
    render(
      <TestWrapper>
        <MiniAnalytics onViewSource={mockViewSource} />
      </TestWrapper>
    )

    // Check that the 4 required tiles are displayed
    expect(screen.getByText('Offene Dienste')).toBeInTheDocument()
    expect(screen.getByText('Zugewiesen heute')).toBeInTheDocument()
    expect(screen.getByText('Aktive Konflikte')).toBeInTheDocument()
    expect(screen.getByText('Bewerbungen 7T')).toBeInTheDocument()

    // Check tile values (need to wait for async load)
    await screen.findByText('Offene Dienste')
    
    // Get all tiles and check their specific values
    const tiles = screen.getAllByText(/^(Offene Dienste|Zugewiesen heute|Aktive Konflikte|Bewerbungen 7T)$/)
    expect(tiles).toHaveLength(4)
    
    // Check values are displayed - they should show as: 2 open, 1 assigned today, 1 conflict, 1 app
    const valueElements = screen.getAllByText(/^[0-9]+$/)
    const values = valueElements.map(el => parseInt(el.textContent))
    expect(values).toContain(2) // Open shifts
    expect(values).toContain(1) // Others should be 1
  })

  test('view source functionality works', async () => {
    localStorage.setItem('shifts', JSON.stringify(mockShifts))
    localStorage.setItem('applications', JSON.stringify(mockApplications))

    const mockViewSource = jest.fn()
    
    render(
      <TestWrapper>
        <MiniAnalytics onViewSource={mockViewSource} />
      </TestWrapper>
    )

    // Wait for component to load and find the eye icons
    await screen.findByText('Offene Dienste')
    
    const eyeButtons = screen.getAllByLabelText(/Datenquelle für .* anzeigen/)
    expect(eyeButtons).toHaveLength(4)

    // Click the first eye button (open shifts)
    fireEvent.click(eyeButtons[0])
    expect(mockViewSource).toHaveBeenCalledWith('open')
  })

  test('works without onViewSource prop', async () => {
    localStorage.setItem('shifts', JSON.stringify(mockShifts))
    localStorage.setItem('applications', JSON.stringify(mockApplications))
    
    render(
      <TestWrapper>
        <MiniAnalytics />
      </TestWrapper>
    )

    // Should render without view source buttons
    await screen.findByText('Offene Dienste')
    const eyeButtons = screen.queryAllByLabelText(/Datenquelle für .* anzeigen/)
    expect(eyeButtons).toHaveLength(0)
  })

  test('calculates metrics correctly with empty data', async () => {
    localStorage.setItem('shifts', JSON.stringify([]))
    localStorage.setItem('applications', JSON.stringify([]))
    
    render(
      <TestWrapper>
        <MiniAnalytics />
      </TestWrapper>
    )

    await screen.findByText('Offene Dienste')
    
    // All values should be 0
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues).toHaveLength(4)
  })
})