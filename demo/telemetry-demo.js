// Manual demonstration script for error telemetry enhancement
// This script can be used to test the telemetry functionality in a browser

// 1. Test with telemetry disabled (default)
console.log('=== Testing with VITE_ENABLE_TELEMETRY=false (default) ===')

import { dispatchErrorTelemetry, registerErrorTelemetry } from '../src/utils/errorTelemetry.js'

// Simulate no handler registered (default state)
registerErrorTelemetry(null)

// Test normal error dispatch - should return false
console.log('Dispatching error with no handler:', dispatchErrorTelemetry({ msg: 'test error 1' }))

// Test offline behavior
Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
console.log('Dispatching error while offline (check console for grouped output):', dispatchErrorTelemetry({ msg: 'offline error' }))

// Reset online status
navigator.onLine = true

console.log('\n=== Testing with VITE_ENABLE_TELEMETRY=true ===')

// 2. Test with telemetry enabled - register a handler
const telemetryEvents = []
registerErrorTelemetry((payload) => {
  console.log('📊 Telemetry Handler Called:', payload)
  telemetryEvents.push(payload)
})

// Test single error
console.log('Dispatching single error:', dispatchErrorTelemetry({ msg: 'single error', timestamp: new Date().toISOString() }))

// Test multiple errors (debouncing)
console.log('Dispatching multiple errors for batching...')
dispatchErrorTelemetry({ msg: 'batch error 1' })
dispatchErrorTelemetry({ msg: 'batch error 2' })
dispatchErrorTelemetry({ msg: 'batch error 3' })

// Wait for debounce to complete
setTimeout(() => {
  console.log('Telemetry events received:', telemetryEvents.length)
  console.log('Event details:', telemetryEvents)
}, 2500)

export { telemetryEvents }