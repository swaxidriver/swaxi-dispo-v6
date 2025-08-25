import { useState } from 'react'
import RoleManagement from '../components/RoleManagement'

const demoDrivers = [
  { id: 1, name: 'Max Mustermann', status: 'Aktiv', license: 'Klasse B', vehicle: 'SW-X 123', shifts: 42 },
  { id: 2, name: 'Anna Weber', status: 'Aktiv', license: 'Klasse B', vehicle: 'SW-X 234', shifts: 38 },
  { id: 3, name: 'Lisa Schmidt', status: 'Urlaub', license: 'Klasse B', vehicle: 'SW-X 345', shifts: 45 },
]

const demoVehicles = [
  { id: 1, plate: 'SW-X 123', model: 'Tesla Model Y', status: 'Im Einsatz', driver: 'Max Mustermann', mileage: '24,356' },
  { id: 2, plate: 'SW-X 234', model: 'Tesla Model Y', status: 'Verfügbar', driver: 'Anna Weber', mileage: '18,923' },
  { id: 3, plate: 'SW-X 345', model: 'Tesla Model Y', status: 'Wartung', driver: 'Lisa Schmidt', mileage: '31,245' },
]

const demoUsers = [
  { id: 1, name: 'Admin User', role: 'Admin' },
  { id: 2, name: 'Chief Dispatcher', role: 'Chief' },
  { id: 3, name: 'Dispatcher 1', role: 'Disponent' },
  { id: 4, name: 'Analyst 1', role: 'Analyst' },
]

export default function Administration() {
  const [activeTab, setActiveTab] = useState('drivers')
  const [drivers] = useState(demoDrivers)
  const [vehicles] = useState(demoVehicles)
  const [users, setUsers] = useState(demoUsers)

  const handleUpdateRole = (userId, newRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ))
    // TODO: Update role in backend
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Verwaltung</h1>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80"
          >
            {activeTab === 'drivers' ? 'Fahrer hinzufügen' : 'Fahrzeug hinzufügen'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="sm:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-brand-primary focus:outline-none focus:ring-brand-primary sm:text-sm"
          >
            <option value="drivers">Fahrer</option>
            <option value="vehicles">Fahrzeuge</option>
            <option value="users">Benutzer</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('drivers')}
              className={classNames(
                activeTab === 'drivers'
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-500 hover:text-gray-700',
                'px-3 py-2 font-medium text-sm rounded-md'
              )}
            >
              Fahrer
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={classNames(
                activeTab === 'vehicles'
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-500 hover:text-gray-700',
                'px-3 py-2 font-medium text-sm rounded-md'
              )}
            >
              Fahrzeuge
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={classNames(
                activeTab === 'users'
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-500 hover:text-gray-700',
                'px-3 py-2 font-medium text-sm rounded-md'
              )}
            >
              Benutzer
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' ? (
        <RoleManagement users={users} onUpdateRole={handleUpdateRole} />
      ) : activeTab === 'drivers' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {drivers.map((driver) => (
              <li key={driver.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-brand-primary truncate">
                      {driver.name}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={classNames(
                        driver.status === 'Aktiv' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800',
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                      )}>
                        {driver.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="text-sm text-gray-500">
                        {driver.license} • {driver.vehicle}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>
                        {driver.shifts} Schichten gesamt
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-brand-primary truncate">
                      {vehicle.plate} • {vehicle.model}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={classNames(
                        vehicle.status === 'Im Einsatz' ? 'bg-blue-100 text-blue-800' :
                        vehicle.status === 'Verfügbar' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800',
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
                      )}>
                        {vehicle.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="text-sm text-gray-500">
                        Fahrer: {vehicle.driver}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>
                        {vehicle.mileage} km
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
