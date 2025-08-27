/* global process */
import { registerErrorTelemetry, dispatchErrorTelemetry, flushErrorTelemetryForTests } from '../../utils/errorTelemetry'

// Mock the feature flags module
jest.mock('../../config/featureFlags', () => ({
  ENABLE_TELEMETRY: process.env.VITE_ENABLE_TELEMETRY === 'true'
}))

describe('telemetry registration based on feature flag', () => {
  let originalEnv
  let consoleSpy

  beforeEach(() => {
    originalEnv = process.env.VITE_ENABLE_TELEMETRY
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    // Reset handler state
    registerErrorTelemetry(null)
  })

  afterEach(() => {
    process.env.VITE_ENABLE_TELEMETRY = originalEnv
    consoleSpy.mockRestore()
    jest.resetModules()
  })

  it('registers handler when VITE_ENABLE_TELEMETRY is true', async () => {
    process.env.VITE_ENABLE_TELEMETRY = 'true'
    
    // Re-import to get updated flag value
    jest.resetModules()
    const { ENABLE_TELEMETRY } = await import('../../config/featureFlags')
    
    expect(ENABLE_TELEMETRY).toBe(true)
    
    // Simulate main.jsx registration logic
    if (ENABLE_TELEMETRY) {
      registerErrorTelemetry((payload) => {
        console.log('📊 Error Telemetry:', payload)
      })
    }
    
    // Test that handler is registered
    const result = dispatchErrorTelemetry({ test: 'error' })
    expect(result).toBe(true)
    
    // Flush and verify handler was called
    flushErrorTelemetryForTests()
    expect(consoleSpy).toHaveBeenCalledWith('📊 Error Telemetry:', expect.objectContaining({
      type: 'batch',
      count: 1,
      errors: [{ test: 'error' }]
    }))
  })

  it('does not register handler when VITE_ENABLE_TELEMETRY is false', async () => {
    process.env.VITE_ENABLE_TELEMETRY = 'false'
    
    // Re-import to get updated flag value
    jest.resetModules()
    const { ENABLE_TELEMETRY } = await import('../../config/featureFlags')
    
    expect(ENABLE_TELEMETRY).toBe(false)
    
    // Simulate main.jsx registration logic
    if (ENABLE_TELEMETRY) {
      registerErrorTelemetry((payload) => {
        console.log('📊 Error Telemetry:', payload)
      })
    }
    
    // Test that no handler is registered
    const result = dispatchErrorTelemetry({ test: 'error' })
    expect(result).toBe(false)
    
    // Verify no telemetry logging occurred
    expect(consoleSpy).not.toHaveBeenCalledWith('📊 Error Telemetry:', expect.anything())
  })

  it('defaults to false when VITE_ENABLE_TELEMETRY is not set', async () => {
    delete process.env.VITE_ENABLE_TELEMETRY
    
    jest.resetModules()
    const { ENABLE_TELEMETRY } = await import('../../config/featureFlags')
    
    expect(ENABLE_TELEMETRY).toBe(false)
  })
})