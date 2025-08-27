import { useState } from 'react'

const demoAuditLog = [
  {
    id: 1,
    user: 'System',
    action: 'Schicht erstellt',
    details: 'Frühdienst • Anna Weber • SW-X 234',
    timestamp: '2025-08-25 08:23:45',
    type: 'create'
  },
  {
    id: 2,
    user: 'Max Mustermann',
    action: 'Fahrzeugstatus geändert',
    details: 'SW-X 345 • Wartung',
    timestamp: '2025-08-25 08:15:12',
    type: 'update'
  },
  {
    id: 3,
    user: 'Lisa Schmidt',
    action: 'Urlaubsantrag eingereicht',
    details: '01.09.2025 - 14.09.2025',
    timestamp: '2025-08-25 08:01:33',
    type: 'request'
  },
]

export default function Audit() {
  const [logs] = useState(demoAuditLog)
  const [filter, setFilter] = useState('all')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Audit</h1>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-[var(--color-primary)] focus:outline-none focus:ring-[var(--color-primary)] sm:text-sm"
          >
            <option value="all">Alle Aktivitäten</option>
            <option value="create">Erstellungen</option>
            <option value="update">Änderungen</option>
            <option value="request">Anfragen</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {logs
            .filter(log => filter === 'all' || log.type === filter)
            .map((log) => (
              <li key={log.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-[var(--color-primary)] truncate">
                      {log.action}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={classNames(
                        log.type === 'create' ? 'bg-green-100 text-green-800' :
                        log.type === 'update' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800',
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                      )}>
                        {log.user}
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
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
