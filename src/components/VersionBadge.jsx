import { memo } from 'react'

/* global __APP_VERSION__, __APP_COMMIT__, __APP_BUILD__, __APP_BUILD_TIME__ */
// VersionBadge: small build/version metadata pill injected at build time via Vite define
// Values come from vite.config.js defines (__APP_VERSION__, __APP_COMMIT__, __APP_BUILD__)
// Shows semantic version; hover reveals commit + build meta for diagnostics.
function VersionBadge({ className = '' }) {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
  const commit = typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'local'
  const build = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : '0'
  const buildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : ''
  const title = `Version ${version}\nCommit ${commit}\nBuild ${build}\nBuilt ${buildTime}`
  return (
    <span
      data-testid="app-version"
      className={`ml-3 inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono tracking-wide text-gray-200 ring-1 ring-white/20 ${className}`}
      title={title}
      aria-label={`Applikationsversion ${version}`}
    >v{version}</span>
  )
}

export default memo(VersionBadge)