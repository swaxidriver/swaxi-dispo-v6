import { act } from '@testing-library/react'

import { renderWithProviders } from './testUtils'

// Mock repository to control ping behaviour
// Name prefixed with 'mock' so Jest allows factory closure reference
const mockPing = jest.fn()
  .mockResolvedValueOnce(true) // first heartbeat -> online
  .mockResolvedValueOnce(false) // second heartbeat -> offline
  .mockResolvedValue(false)

jest.mock('../repository/repositoryFactory', () => {
  const stub = {
    list: jest.fn().mockResolvedValue([]),
    ping: () => mockPing(),
  }
  return { getShiftRepository: () => stub }
})

describe('ShiftContext heartbeat ping failure transition', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })
  it('transitions online -> offline when subsequent ping fails', async () => {
    let ctx
    function Probe() {
      ctx = require('../contexts/useShifts').useShifts()
      return null
    }
    renderWithProviders(<Probe />, { providerProps: { heartbeatMs: 10, enableAsyncInTests: true, disableAsyncBootstrap: true } })
    // Allow several heartbeat cycles (effect restarts when isOnline changes, causing extra immediate loops)
    await act(async () => {
      // initial immediate call
      await Promise.resolve()
      // advance enough time for multiple cycles
      jest.advanceTimersByTime(40)
      await Promise.resolve()
    })
    expect(mockPing.mock.calls.length).toBeGreaterThanOrEqual(2)
    // First call should have resolved true
    const first = await mockPing.mock.results[0].value
    expect(first).toBe(true)
    // Final state should now be offline after at least one failing ping
    expect(ctx.isOnline).toBe(false)
    // Ensure at least one false result occurred
    const anyFalse = mockPing.mock.results.slice(1).some(r => r.value && r.value.then ? false : r.value === false)
    // For resolved promises sequentially; simpler: inspect second value
    const second = await mockPing.mock.results[1].value
    expect(second).toBe(false)
    expect(anyFalse || second === false).toBe(true)
  })
})
