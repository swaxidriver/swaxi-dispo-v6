import { logInfo, logError, setLoggerSilent } from '../../utils/logger'

describe('logger', () => {
  const origError = console.error
  const origLog = console.log
  let errorCalls = []
  let logCalls = []
  beforeEach(() => {
    errorCalls = []
    logCalls = []
    console.error = (...a) => { errorCalls.push(a) }
    console.log = (...a) => { logCalls.push(a) }
    setLoggerSilent(false)
  })
  afterEach(() => {
    console.error = origError
    console.log = origLog
  })
  it('emits when not silent', () => {
    logInfo('info1'); logError('err1')
    expect(logCalls.length).toBe(1)
    expect(errorCalls.length).toBe(1)
  })
  it('suppresses when silent', () => {
    setLoggerSilent(true)
    logInfo('info2'); logError('err2')
    expect(logCalls.length).toBe(0)
    expect(errorCalls.length).toBe(0)
  })
})
