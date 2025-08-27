import { dispatchErrorTelemetry, registerErrorTelemetry } from '../../utils/errorTelemetry'

// Mock timers for testing debounce behavior
jest.useFakeTimers()

describe('error telemetry debounce timing', () => {
  let events

  beforeEach(() => {
    events = []
    registerErrorTelemetry(p => events.push(p))
  })

  afterEach(() => {
    registerErrorTelemetry(null)
    jest.clearAllTimers()
  })

  it('debounces multiple errors into single batch after 2 seconds', () => {
    // Send multiple errors quickly
    dispatchErrorTelemetry({ msg: 'error1' })
    dispatchErrorTelemetry({ msg: 'error2' })
    dispatchErrorTelemetry({ msg: 'error3' })
    
    // Should not have called handler yet
    expect(events).toHaveLength(0)
    
    // Fast-forward 1.5 seconds - still within debounce window
    jest.advanceTimersByTime(1500)
    expect(events).toHaveLength(0)
    
    // Add another error - should reset timer
    dispatchErrorTelemetry({ msg: 'error4' })
    
    // Fast-forward another 1.5 seconds (total 3s from first error, but only 1.5s from last)
    jest.advanceTimersByTime(1500)
    expect(events).toHaveLength(0)
    
    // Fast-forward 0.5 more seconds to complete the 2s window from last error
    jest.advanceTimersByTime(500)
    
    // Now handler should have been called with batched errors
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('batch')
    expect(events[0].count).toBe(4)
    expect(events[0].errors.map(e => e.msg)).toEqual(['error1', 'error2', 'error3', 'error4'])
  })

  it('handles multiple separate batches correctly', () => {
    // First batch
    dispatchErrorTelemetry({ msg: 'batch1_error1' })
    dispatchErrorTelemetry({ msg: 'batch1_error2' })
    
    // Complete first batch
    jest.advanceTimersByTime(2000)
    expect(events).toHaveLength(1)
    expect(events[0].count).toBe(2)
    
    // Second batch after some delay
    dispatchErrorTelemetry({ msg: 'batch2_error1' })
    
    // Complete second batch
    jest.advanceTimersByTime(2000)
    expect(events).toHaveLength(2)
    expect(events[1].count).toBe(1)
    expect(events[1].errors[0].msg).toBe('batch2_error1')
  })

  it('resets timer on each new error within window', () => {
    dispatchErrorTelemetry({ msg: 'error1' })
    
    // Add errors every 1 second (within 2s window) - should keep resetting
    for (let i = 2; i <= 5; i++) {
      jest.advanceTimersByTime(1000)
      dispatchErrorTelemetry({ msg: `error${i}` })
      expect(events).toHaveLength(0) // Still no batches sent
    }
    
    // Finally let 2 seconds pass without new errors
    jest.advanceTimersByTime(2000)
    
    // Should now have one batch with all 5 errors
    expect(events).toHaveLength(1)
    expect(events[0].count).toBe(5)
  })
})