import { render, screen, act } from '@testing-library/react'

import AutosaveManager from '../components/AutosaveManager'
import { ShiftProvider } from '../contexts/ShiftContext'

// Speed up tests: reduce interval via jest fake timers by mocking Date.now differences
jest.useFakeTimers()
// Silence snapshot console noise
const originalLog = console.log
beforeAll(() => { console.log = jest.fn() })
afterAll(() => { console.log = originalLog })

// Ensure unique snapshot IDs: mock Date.now to increment
let mockNowBase = 1700000000000
beforeEach(() => {
  mockNowBase += 10000
  jest.spyOn(Date, 'now').mockImplementation(() => (mockNowBase += 1000))
})
afterEach(() => {
  jest.restoreAllMocks()
})

// Helper to seed shift state via localStorage before provider init
function seedState({ shifts = [], applications = [], notifications = [] } = {}) {
  localStorage.setItem('shifts', JSON.stringify(shifts))
  localStorage.setItem('applications', JSON.stringify(applications))
  localStorage.setItem('notifications', JSON.stringify(notifications))
  localStorage.setItem('swaxi-unsaved-work', '1') // so recovery panel logic can trigger
}

describe('AutosaveManager', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllTimers()
  })

  it('creates an initial snapshot and shows autosave indicator', () => {
    seedState({ shifts: [], applications: [], notifications: [] })
    render(<ShiftProvider><AutosaveManager /></ShiftProvider>)
    // After initial render effect runs, snapshot should exist
    const snapshotsRaw = localStorage.getItem('swaxi-autosave-snapshots')
    expect(snapshotsRaw).not.toBeNull()
    const snapshots = JSON.parse(snapshotsRaw)
    expect(snapshots.length).toBeGreaterThanOrEqual(1)
    // UI indicator text
    expect(screen.getByText(/Autosave:/i)).toBeInTheDocument()
  })

  it('adds multiple snapshots over time (interval advance)', () => {
    seedState({ shifts: [], applications: [], notifications: [] })
    render(<ShiftProvider><AutosaveManager /></ShiftProvider>)
    const first = JSON.parse(localStorage.getItem('swaxi-autosave-snapshots')).length
    // Advance time by 2 intervals
    act(() => {
      jest.advanceTimersByTime(60000)
    })
    const after = JSON.parse(localStorage.getItem('swaxi-autosave-snapshots')).length
    expect(after).toBeGreaterThanOrEqual(Math.min(first + 2, 10)) // limited by MAX_SNAPSHOTS
  })

  it('opens recovery panel when snapshots exist & unsaved work flag present', () => {
    seedState({ shifts: [], applications: [], notifications: [] })
    render(<ShiftProvider><AutosaveManager /></ShiftProvider>)
    // Timer inside component uses setTimeout 1000 -> advance
    act(() => { jest.advanceTimersByTime(1100) })
    // Recovery panel should appear automatically (due to unsaved work + snapshot)
    expect(screen.getByText(/Ungespeicherte Änderungen erkannt/)).toBeInTheDocument()
    expect(screen.getByText('Überspringen')).toBeInTheDocument()
  })
})
