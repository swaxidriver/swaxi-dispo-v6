import { useState, useMemo, useContext } from 'react'
import { useShifts } from '../contexts/useShifts'
import { canManageShifts } from '../utils/auth'
import AuthContext from '../contexts/AuthContext'
import _ShiftTable from '../components/ShiftTable'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const DAY_MINUTES = 24 * 60
const PX_PER_HOUR = 48 // calendar row height baseline
const DAY_HEIGHT = 24 * PX_PER_HOUR

function buildDate(dateLike) {
  return dateLike instanceof Date ? new Date(dateLike) : new Date(dateLike)
}

function combine(dateLike, timeStr) {
  const d = buildDate(dateLike)
  if (!timeStr) return d
  const [h, m] = timeStr.split(':').map(Number)
  d.setHours(h, m || 0, 0, 0)
  return d
}

function getShiftSpanForDay(shift, dayDate) {
  // Returns pixel offset & height (in px) within a single day column
  const startDate = combine(shift.date, shift.start)
  let endDate = combine(shift.date, shift.end)
  if (endDate <= startDate) {
    // overnight shift crosses midnight
    endDate.setDate(endDate.getDate() + 1)
  }
  const dayStart = new Date(dayDate)
  dayStart.setHours(0,0,0,0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  // overlap check
  if (startDate >= dayEnd || endDate <= dayStart) return null

  const visibleStart = startDate < dayStart ? dayStart : startDate
  const visibleEnd = endDate > dayEnd ? dayEnd : endDate
  const minutesFromDayStart = (visibleStart - dayStart) / 60000
  const visibleMinutes = (visibleEnd - visibleStart) / 60000
  const top = (minutesFromDayStart / DAY_MINUTES) * DAY_HEIGHT
  const height = Math.max(visibleMinutes / DAY_MINUTES * DAY_HEIGHT, 12) // minimum height
  return { top, height }
}

export default function Calendar() {
  const { state } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date());
  // future: month view support
  const auth = useContext(AuthContext)
  const userRole = auth?.user?.role || 'analyst'

  const { weekShifts, weekStart } = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0,0,0,0)
    // Monday baseline
    const day = start.getDay()
    const diffToMonday = (day === 0 ? -6 : 1 - day)
    start.setDate(start.getDate() + diffToMonday)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const filtered = state.shifts.filter(s => {
      // consider shifts overlapping week (including overnight spill)
      const baseDate = buildDate(s.date)
      const startDateTime = combine(baseDate, s.start)
      let endDateTime = combine(baseDate, s.end)
      if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1)
      return startDateTime < end && endDateTime >= start
    })
    return { weekShifts: filtered, weekStart: start }
  }, [state.shifts, selectedDate])

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const handleShiftClick = (shift) => {
    // TODO: Open shift details modal
    console.log('Shift clicked:', shift);
  };

  const handleCreateShift = () => {
    if (canManageShifts(userRole)) {
      // TODO: Open create shift modal
      console.log('Creating new shift');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="mt-1 text-sm text-gray-500">
            Wochenübersicht der Dienste
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => navigateWeek(-1)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Vorherige Woche
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date())}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Heute
          </button>
          <button
            type="button"
            onClick={() => navigateWeek(1)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Nächste Woche
          </button>
          {canManageShifts(userRole) && (
            <button
              type="button"
              onClick={handleCreateShift}
              className="inline-flex items-center rounded-md bg-brand-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/80"
            >
              Dienst erstellen
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <div className="min-w-[960px]">
          {/* Header */}
          <div className="grid grid-cols-8 bg-gray-100 border-b border-gray-200">
            <div className="p-2 text-xs font-medium text-gray-500">Zeit</div>
            {DAYS.map((label, idx) => {
              const d = new Date(weekStart)
              d.setDate(weekStart.getDate() + idx)
              return (
                <div key={label} className="p-2 text-center text-xs font-medium text-gray-600">
                  <div>{label}</div>
                  <div className="text-[10px] text-gray-400">{d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="relative border-r border-gray-200" style={{ height: DAY_HEIGHT }}>
              {HOURS.map((h, i) => (
                <div key={h} className="absolute left-0 w-full flex items-start" style={{ top: i * PX_PER_HOUR }}>
                  <div className="text-[10px] text-gray-400 pl-1 -mt-2">{h}</div>
                  <div className="w-full h-px bg-gray-100 translate-y-4" />
                </div>
              ))}
            </div>
            {/* Day columns */}
            {DAYS.map((_, dayIdx) => {
              const dayDate = new Date(weekStart)
              dayDate.setDate(weekStart.getDate() + dayIdx)
              const dayStart = new Date(dayDate)
              dayStart.setHours(0,0,0,0)
              const dayEnd = new Date(dayStart)
              dayEnd.setDate(dayEnd.getDate() + 1)
              const dayShifts = weekShifts.filter(shift => {
                const base = buildDate(shift.date)
                const s = combine(base, shift.start)
                let e = combine(base, shift.end)
                if (e <= s) e.setDate(e.getDate() + 1)
                return s < dayEnd && e > dayStart
              })
              return (
                <div key={dayIdx} className="relative border-r border-gray-100" style={{ height: DAY_HEIGHT }}>
                  {/* Hour grid lines */}
                  {HOURS.map((_, i) => (
                    <div key={i} className="absolute left-0 w-full h-px bg-gray-100" style={{ top: i * PX_PER_HOUR }} />
                  ))}
                  {dayShifts.map(shift => {
                    const span = getShiftSpanForDay(shift, dayDate)
                    if (!span) return null
                    return (
                      <div
                        key={`${shift.id}_${dayIdx}`}
                        className="absolute mx-1 rounded-md bg-brand-primary/90 text-white text-[10px] px-1 py-0.5 cursor-pointer shadow-sm hover:bg-brand-primary"
                        style={{ top: span.top, height: span.height }}
                        onClick={() => handleShiftClick(shift)}
                        title={`${shift.type || shift.name} ${shift.start}-${shift.end}`}
                      >
                        <div className="font-semibold truncate">{shift.type || shift.name}</div>
                        <div className="truncate">{shift.assignedTo || 'Offen'}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Diese Woche</h2>
        <_ShiftTable shifts={weekShifts} />
      </div>
    </div>
  );
}
