import { useState, useEffect, useContext } from 'react'

import AuthContext from '../contexts/AuthContext'
import { canViewAudit } from '../utils/auth'
import AuditService from '../services/auditService'

export default function Audit() {
  const auth = useContext(AuthContext)
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')

  // Check permission
  if (!auth?.user || !canViewAudit(auth.user.role)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600">Sie haben keine Berechtigung, das Audit-Log einzusehen.</p>
        </div>
      </div>
    )
  }

  // Load audit logs on mount and when filter changes
  useEffect(() => {
    const loadLogs = () => {
      const auditLogs = AuditService.getFilteredLogs(filter)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
      setLogs(auditLogs)
    }
    
    loadLogs()
  }, [filter])

  const handleExport = () => {
    AuditService.exportLogs()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Audit-Log</h1>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-[var(--color-primary)] focus:outline-none focus:ring-[var(--color-primary)] sm:text-sm"
          >
            <option value="all">Alle Aktivitäten</option>
            <option value="create">Erstellungen</option>
            <option value="update">Änderungen</option>
            <option value="delete">Löschungen</option>
            <option value="apply">Anfragen</option>
          </select>
          <button
            onClick={handleExport}
            data-testid="export-btn"
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            JSON Export
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Keine Audit-Einträge vorhanden.' 
                : `Keine ${filter}-Aktivitäten gefunden.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {logs.length} {logs.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {logs.map((log) => (
              <li key={log.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-[var(--color-primary)] truncate">
                      {log.action}
                      {log.count > 1 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({log.count} Elemente)
                        </span>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={classNames(
                        log.type === 'create' ? 'bg-green-100 text-green-800' :
                        log.type === 'update' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'delete' ? 'bg-red-100 text-red-800' :
                        log.type === 'apply' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800',
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                      )}>
                        {log.actor} ({log.role})
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="text-sm text-gray-500">
                        {log.details}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>
                        {new Date(log.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
