import { useState } from 'react'

const demoShifts = [
  { id: 1, name: 'Frühdienst', driver: 'Anna Weber', vehicle: 'SW-X 234', start: '06:00', end: '14:00' },
  { id: 2, name: 'Spätdienst', driver: 'Max Mustermann', vehicle: 'SW-X 123', start: '14:00', end: '22:00' },
  { id: 3, name: 'Nachtdienst', driver: 'Lisa Schmidt', vehicle: 'SW-X 345', start: '22:00', end: '06:00' },
]

export default function Calendar() {
  const [shifts] = useState(demoShifts)
  const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Kalender</h1>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Vorherige Woche
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Nächste Woche
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80"
          >
            Schicht hinzufügen
          </button>
        </div>
      </div>

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5">
        <div className="grid grid-cols-8 gap-px">
          {/* Time column */}
          <div className="bg-gray-50 p-2 text-xs font-medium text-gray-500">
            Zeit
          </div>
          
          {/* Day headers */}
          {days.map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {hours.map(hour => (
            <>
              <div key={hour} className="bg-white p-2 text-xs text-gray-500 border-t">
                {hour}
              </div>
              {days.map(day => (
                <div key={`${day}-${hour}`} className="bg-white p-2 border-t">
                  {/* Shift blocks would go here */}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Aktuelle Schichten</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {shifts.map((shift) => (
              <li key={shift.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-brand-primary truncate">
                      {shift.name}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Aktiv
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="text-sm text-gray-500">
                        {shift.driver} • {shift.vehicle}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>
                        {shift.start} - {shift.end}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
