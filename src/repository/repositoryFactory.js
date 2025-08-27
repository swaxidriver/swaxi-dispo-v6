/* global process */
import { ENABLE_SHAREPOINT } from '../config/featureFlags'
import { logInfo } from '../utils/logger'

import { InMemoryShiftRepository } from './InMemoryShiftRepository'
import { SharePointShiftRepository } from './SharePointShiftRepository'
import { IndexedDBShiftRepository } from './IndexedDBShiftRepository'

// Avoid using `import.meta` directly so Jest (CJS) can parse this file.
function getEnvVar(name) {
  // Prefer process.env (available in Jest / Node). Vite will inline these at build time if defined.
  if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name]
  return undefined
}

let cached
export function getShiftRepository() {
  if (cached) return cached
  const backend = (getEnvVar('VITE_SHIFT_BACKEND') || 'memory').toLowerCase()
  if (backend === 'sharepoint') {
    if (ENABLE_SHAREPOINT) {
      cached = new SharePointShiftRepository()
    } else {
      logInfo('[repositoryFactory] SharePoint backend requested but feature flag disabled – falling back to IndexedDB')
      cached = new IndexedDBShiftRepository()
    }
  } else if (backend === 'idx' || backend === 'indexeddb') {
    cached = new IndexedDBShiftRepository()
  } else {
    cached = new InMemoryShiftRepository()
  }
  return cached
}

export default getShiftRepository
