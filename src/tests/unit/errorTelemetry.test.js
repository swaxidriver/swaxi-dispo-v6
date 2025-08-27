import { dispatchErrorTelemetry, registerErrorTelemetry, flushErrorTelemetryForTests } from '../../utils/errorTelemetry'

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('error telemetry utility', () => {
  let originalConsole
  
  beforeEach(() => {
    // Reset state
    registerErrorTelemetry(null)
    navigator.onLine = true
    
    // Mock console for offline fallback tests
    originalConsole = console.groupCollapsed
    console.groupCollapsed = jest.fn()
    console.groupEnd = jest.fn()
    console.error = jest.fn()
  })
  
  afterEach(() => {
    console.groupCollapsed = originalConsole
    jest.restoreAllMocks()
  })

  it('invokes registered handler with payload immediately for single error', () => {
    const events = []
    registerErrorTelemetry(p => events.push(p))
    const result = dispatchErrorTelemetry({ msg: 'x' })
    
    // Should return true but not call handler immediately (debounced)
    expect(result).toBe(true)
    expect(events).toHaveLength(0)
    
    // Flush the debounced queue to test batching
    flushErrorTelemetryForTests()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('batch')
    expect(events[0].count).toBe(1)
    expect(events[0].errors[0].msg).toBe('x')
  })

  it('batches multiple errors within debounce window', () => {
    const events = []
    registerErrorTelemetry(p => events.push(p))
    
    // Send multiple errors quickly
    dispatchErrorTelemetry({ msg: 'error1' })
    dispatchErrorTelemetry({ msg: 'error2' })
    dispatchErrorTelemetry({ msg: 'error3' })
    
    // No immediate calls
    expect(events).toHaveLength(0)
    
    // Flush to test batching
    flushErrorTelemetryForTests()
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('batch')
    expect(events[0].count).toBe(3)
    expect(events[0].errors.map(e => e.msg)).toEqual(['error1', 'error2', 'error3'])
  })

  it('swallows errors in handler', () => {
    registerErrorTelemetry(() => { throw new Error('fail') })
    const result = dispatchErrorTelemetry({ msg: 'y' })
    expect(result).toBe(true)
    
    // Should not throw when flushing
    expect(() => flushErrorTelemetryForTests()).not.toThrow()
  })

  it('returns false when no handler registered and online', () => {
    registerErrorTelemetry(null)
    navigator.onLine = true
    const res = dispatchErrorTelemetry({})
    expect(res).toBe(false)
  })

  it('falls back to console.groupCollapsed when offline and no handler', () => {
    registerErrorTelemetry(null)
    navigator.onLine = false
    
    const result = dispatchErrorTelemetry({ msg: 'offline error' })
    expect(result).toBe(false)
    
    expect(console.groupCollapsed).toHaveBeenCalledWith('🔴 Error Telemetry (offline)')
    expect(console.error).toHaveBeenCalledWith({ msg: 'offline error' })
    expect(console.groupEnd).toHaveBeenCalled()
  })

  it('uses console fallback for batched errors when offline', () => {
    const events = []
    registerErrorTelemetry(p => events.push(p))
    
    // Queue up errors
    dispatchErrorTelemetry({ msg: 'error1' })
    dispatchErrorTelemetry({ msg: 'error2' })
    
    // Simulate going offline
    navigator.onLine = false
    registerErrorTelemetry(null) // Remove handler
    
    // Flush should use console fallback
    flushErrorTelemetryForTests()
    
    expect(console.groupCollapsed).toHaveBeenCalledWith('🔴 Error Telemetry (2 errors)')
    expect(console.error).toHaveBeenCalledTimes(2)
    expect(console.groupEnd).toHaveBeenCalled()
  })
})
