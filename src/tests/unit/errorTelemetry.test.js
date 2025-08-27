import { dispatchErrorTelemetry, registerErrorTelemetry } from '../../utils/errorTelemetry'

describe('error telemetry utility', () => {
  it('invokes registered handler with payload', () => {
    const events = []
    registerErrorTelemetry(p => events.push(p))
    const result = dispatchErrorTelemetry({ msg: 'x' })
    expect(events).toHaveLength(1)
    expect(events[0].msg).toBe('x')
    expect(result).toBe(true)
  })
  it('swallows errors in handler', () => {
    registerErrorTelemetry(() => { throw new Error('fail') })
    // Should not throw
    const result = dispatchErrorTelemetry({ msg: 'y' })
    expect(result).toBe(true)
  })
  it('returns false when no handler registered', () => {
    registerErrorTelemetry(null)
    const res = dispatchErrorTelemetry({})
    expect(res).toBe(false)
  })
})
