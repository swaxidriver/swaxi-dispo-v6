// Error telemetry registration utility
// Components (like ErrorBoundary) can import { dispatchErrorTelemetry } to emit.

let handler = null
let debounceTimer = null
let errorQueue = []

export function registerErrorTelemetry(fn) { handler = typeof fn === 'function' ? fn : null }

function isOnline() {
  // Check navigator.onLine first, fallback to true if unavailable
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
    ? navigator.onLine 
    : true
}

function flushErrorQueue() {
  if (errorQueue.length === 0) return

  const errors = [...errorQueue]
  errorQueue = []

  if (handler) {
    try {
      // Send batched errors to handler
      handler({
        type: 'batch',
        count: errors.length,
        errors,
        timestamp: new Date().toISOString()
      })
    } catch { /* swallow */ }
  } else if (!isOnline()) {
    // Fallback to console.groupCollapsed when offline and no handler
    console.groupCollapsed(`🔴 Error Telemetry (${errors.length} errors)`)
    errors.forEach((error, index) => {
      console.error(`Error ${index + 1}:`, error)
    })
    console.groupEnd()
  }
}

export function dispatchErrorTelemetry(payload) {
  if (handler) {
    // Add to queue for batching
    errorQueue.push(payload)
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    // Set 2-second debounce timer
    debounceTimer = setTimeout(() => {
      flushErrorQueue()
      debounceTimer = null
    }, 2000)
    
    return true
  } else if (!isOnline()) {
    // Immediate fallback to console when offline and no handler
    console.groupCollapsed('🔴 Error Telemetry (offline)')
    console.error(payload)
    console.groupEnd()
    return false
  } else {
    // no handler registered and online – noop; explicit branch for coverage
    return false
  }
}

// For testing: immediate flush without debounce
export function flushErrorTelemetryForTests() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  flushErrorQueue()
}

export default { registerErrorTelemetry, dispatchErrorTelemetry, flushErrorTelemetryForTests }
