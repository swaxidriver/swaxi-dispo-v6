// Simple logger wrapper enabling silent mode in tests.
// Usage: import { logError } from '@/utils/logger'
// In tests you can mock or set LOGGER_SILENT to suppress noise.

// Detect Jest without assuming Node globals in browser lint context
const isTestEnv = (() => {
  try {
    // eslint-disable-next-line no-undef
    return typeof process !== 'undefined' && process?.env?.JEST_WORKER_ID !== undefined
  } catch (_) {
    return false
  }
})()
let silent = isTestEnv

export function setLoggerSilent(val) {
  silent = !!val
}

export function logError(...args) {
  if (!silent) console.error(...args)
}

export function logInfo(...args) {
  if (!silent) console.log(...args)
}

export default { logError, logInfo, setLoggerSilent }
