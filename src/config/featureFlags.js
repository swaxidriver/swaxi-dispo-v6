// Central feature flag accessors (kept tiny). Vite inlines import.meta.env.* at build.
/* global process */
function readEnv(name, fallback) {
  if (typeof import.meta !== 'undefined' && import.meta.env && name in import.meta.env) return import.meta.env[name]
  if (typeof process !== 'undefined' && process.env && name in process.env) return process.env[name]
  return fallback
}

export const ENABLE_SHAREPOINT = String(readEnv('VITE_ENABLE_SHAREPOINT', 'false')).toLowerCase() === 'true'

export function describeFlags() { return { ENABLE_SHAREPOINT } }

export default { ENABLE_SHAREPOINT }
