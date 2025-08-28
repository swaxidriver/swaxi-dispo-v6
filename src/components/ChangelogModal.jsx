import { useRef, useEffect, useCallback } from 'react'

// Inline changelog data extracted from CHANGELOG.md - keeping latest 10 entries
const CHANGELOG_DATA = [
  {
    version: '0.3.0',
    date: '2025-08-27',
    title: 'Design Tokens & Typography Update',
    description: 'Modernized font to Manrope, added design tokens with persistent theme, visible role badges, and enhanced test scaffolding.'
  },
  {
    version: '0.2.0', 
    date: '2025-08-26',
    title: 'Offline Queue & Accessibility',
    description: 'Added offline action queue with automatic replay, accessibility improvements including focus management, and optimistic shift operations.'
  },
  {
    version: '0.1.0-test',
    date: '2025-08-26', 
    title: 'Initial Release',
    description: 'Initial shift assignment workflow, notification center, week calendar view, shift templates, and role-based authentication.'
  }
]

export default function ChangelogModal({ isOpen, onClose }) {
  const lastActiveRef = useRef(null)
  const panelRef = useRef(null)

  // Remember previously focused element
  useEffect(() => {
    if (isOpen) lastActiveRef.current = document.activeElement
  }, [isOpen])

  // Restore focus when closed
  useEffect(() => {
    if (!isOpen && lastActiveRef.current) {
      try { lastActiveRef.current.focus() } catch { /* ignore */ }
    }
  }, [isOpen])

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation(); onClose(); return
    }
    if (e.key === 'Tab') {
      const nodes = panelRef.current?.querySelectorAll('button, [href], select, textarea, input, [tabindex]:not([tabindex="-1"])') || []
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" 
      style={{ padding: 'var(--space-4)' }} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="changelog-title" 
      aria-describedby="changelog-desc" 
      onKeyDown={handleKey}
    >
      <div 
        ref={panelRef} 
        className="bg-white dark:bg-gray-800 rounded shadow max-w-2xl w-full max-h-[80vh] overflow-hidden" 
        style={{ padding: 'var(--space-4)', gap: 'var(--space-4)', display: 'flex', flexDirection: 'column' }} 
        role="document"
      >
        <div className="flex justify-between items-center">
          <h2 id="changelog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Änderungsprotokoll
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Schließen" 
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
          >
            ✕
          </button>
        </div>
        
        <p id="changelog-desc" className="text-sm text-gray-600 dark:text-gray-300">
          Aktuelle Änderungen und Verbesserungen in der Anwendung.
        </p>

        <div className="overflow-y-auto flex-1" style={{ gap: 'var(--space-3)', display: 'flex', flexDirection: 'column' }}>
          {CHANGELOG_DATA.slice(0, 10).map((entry, index) => (
            <div 
              key={`${entry.version}-${index}`}
              className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-b-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  v{entry.version}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {entry.date}
                </span>
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                {entry.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {entry.description}
              </p>
            </div>
          ))}
          
          {CHANGELOG_DATA.length > 10 && (
            <div className="text-center pt-2">
              <a 
                href="https://github.com/swaxidriver/swaxi-dispo-v6/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Vollständiges Änderungsprotokoll anzeigen
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}