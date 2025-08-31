import React, { useState, useMemo, useContext } from 'react'

import { useShifts } from '../contexts/useShifts'
import { canManageShifts } from '../lib/rbac'
import AuthContext from '../contexts/AuthContext'
import _ShiftTable from '../components/ShiftTable'
import { CreateShiftModal, ShiftDetailsModal } from '../features/shifts'
import AssignmentDragDrop from '../ui/assignment-dnd'

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
  const height = Math.max(visibleMinutes / DAY_MINUTES * DAY_HEIGHT, 12) // minimum height: --space-3 (12px)
  return { top, height }
}

// Memoized calendar cell for better performance
const CalendarCell = React.memo(({ day, onDayClick, onShiftClick }) => (
  <div
    className={`min-h-[100px] p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 ${
      !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
    } ${day.isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}
    onClick={() => onDayClick(day)}
  >
    <div className="text-sm font-medium mb-1">
      {day.date.getDate()}
    </div>
    
    {/* Shift markers */}
    <div className="space-y-1">
      {day.shifts.slice(0, 3).map((shift) => (
        <div
          key={shift.id}
          className={`text-xs px-1 py-0.5 rounded truncate ${
            shift.assignedTo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}
          title={`${shift.type || shift.name} ${shift.start}-${shift.end} ${shift.assignedTo ? `(${shift.assignedTo})` : '(Offen)'}`}
          onClick={(e) => {
            e.stopPropagation()
            onShiftClick(shift)
          }}
        >
          {shift.type || shift.name}
        </div>
      ))}
      {day.shifts.length > 3 && (
        <div className="text-xs text-gray-500">
          +{day.shifts.length - 3} weitere
        </div>
      )}
    </div>
  </div>
))

export default function Calendar() {
  const { state, applyToShift, assignShift, updateShift, undoLastShiftUpdate } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', or 'assignment'
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Drag & Drop state
  const [draggedShift, setDraggedShift] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  const [dragOverTime, setDragOverTime] = useState(null)
  
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

  const { monthDays, monthStart } = useMemo(() => {
    if (viewMode !== 'month') return { monthDays: [], monthStart: null }
    
    const start = new Date(selectedDate)
    start.setDate(1) // First day of month
    start.setHours(0,0,0,0)
    
    // Start from Monday of the week containing the first day
    const day = start.getDay()
    const diffToMonday = (day === 0 ? -6 : 1 - day)
    start.setDate(start.getDate() + diffToMonday)
    
    const monthStart = new Date(start)
    const days = []
    
    // Generate 6 weeks (42 days) for month view
    for (let i = 0; i < 42; i++) {
      const currentDay = new Date(monthStart)
      currentDay.setDate(monthStart.getDate() + i)
      
      const dayStart = new Date(currentDay)
      dayStart.setHours(0,0,0,0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      
      // Get shifts for this day - optimized filtering
      const dayShifts = state.shifts.filter(s => {
        const shiftDate = s.date
        if (typeof shiftDate === 'string') {
          // Quick string comparison for performance
          const dayStr = currentDay.toISOString().slice(0, 10)
          return shiftDate === dayStr
        }
        
        // Fallback to full date comparison for complex date handling
        const baseDate = buildDate(s.date)
        const startDateTime = combine(baseDate, s.start)
        let endDateTime = combine(baseDate, s.end)
        if (endDateTime <= startDateTime) endDateTime.setDate(endDateTime.getDate() + 1)
        return startDateTime < dayEnd && endDateTime >= dayStart
      })
      
      days.push({
        date: new Date(currentDay),
        shifts: dayShifts,
        isCurrentMonth: currentDay.getMonth() === selectedDate.getMonth(),
        isToday: currentDay.toDateString() === new Date().toDateString()
      })
    }
    
    return { monthDays: days, monthStart }
  }, [state.shifts, selectedDate, viewMode])

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const navigate = (direction) => {
    if (viewMode === 'month') {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const handleShiftClick = (shift) => {
    setSelectedShift(shift)
    setIsDetailsOpen(true)
  };

  const handleCreateShift = () => {
    if (canManageShifts(userRole)) {
      setIsCreateOpen(true)
    }
  };

  const handleApplyToShift = async (shiftId, userId) => {
    return applyToShift(shiftId, userId)
  }

  const handleAssignShift = async (shiftId, userId) => {
    return assignShift(shiftId, userId)
  }

  const handleDayClick = (day) => {
    setSelectedDate(new Date(day.date))
    if (day.shifts.length > 0) {
      setSelectedShift(day.shifts[0])
      setIsDetailsOpen(true)
    }
  }

  // Drag & Drop handlers
  const handleShiftDragStart = (e, shift) => {
    setDraggedShift(shift)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', shift.id)
    // Add visual feedback
    e.target.style.opacity = '0.5'
  }

  const handleShiftDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedShift(null)
    setDragOverDay(null)
    setDragOverTime(null)
  }

  const handleDayDragOver = (e, dayDate) => {
    if (!draggedShift) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(dayDate)
    
    // Calculate time from mouse position
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const timePercent = y / DAY_HEIGHT
    const minutesFromMidnight = timePercent * DAY_MINUTES
    const hours = Math.floor(minutesFromMidnight / 60)
    const minutes = Math.floor((minutesFromMidnight % 60) / 15) * 15 // Snap to 15-minute intervals
    setDragOverTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const handleDayDragLeave = (e) => {
    // Only clear if leaving the day column entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX, clientY } = e
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverDay(null)
      setDragOverTime(null)
    }
  }

  const handleDayDrop = (e, dayDate) => {
    e.preventDefault()
    
    if (!draggedShift || !dragOverTime) return

    const newDate = new Date(dayDate).toISOString().slice(0, 10)
    const startTime = dragOverTime
    
    // Calculate end time based on original duration
    const originalStart = draggedShift.start
    const originalEnd = draggedShift.end
    const startMinutes = parseInt(originalStart.split(':')[0]) * 60 + parseInt(originalStart.split(':')[1])
    const endMinutes = parseInt(originalEnd.split(':')[0]) * 60 + parseInt(originalEnd.split(':')[1])
    let duration = endMinutes - startMinutes
    
    // Handle overnight shifts
    if (duration < 0) {
      duration += 24 * 60 // Add 24 hours worth of minutes
    }
    
    const newStartMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    let newEndMinutes = newStartMinutes + duration
    
    // Handle end time going past midnight
    let endTime
    if (newEndMinutes >= 24 * 60) {
      newEndMinutes -= 24 * 60
      endTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, '0')}:${String(newEndMinutes % 60).padStart(2, '0')}`
    } else {
      endTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, '0')}:${String(newEndMinutes % 60).padStart(2, '0')}`
    }

    // Update the shift
    const result = updateShift(draggedShift.id, {
      date: newDate,
      start: startTime,
      end: endTime
    })

    if (!result.success) {
      // Show error notification - the updateShift method already handles this
      console.warn('Failed to move shift:', result.error)
    }

    // Reset drag state
    setDraggedShift(null)
    setDragOverDay(null)
    setDragOverTime(null)
  }

  // Keyboard shortcut for undo
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      const undoResult = undoLastShiftUpdate()
      if (!undoResult) {
        // Show notification that there's nothing to undo
        console.log('Nothing to undo')
      }
    }
  }

  // Add keyboard listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undoLastShiftUpdate])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kalender</h1>
          <p className="mt-1 text-sm text-gray-500">
            {viewMode === 'month' ? 'Monatsübersicht der Dienste' : 
             viewMode === 'assignment' ? 'Dienste zuweisen per Drag & Drop' :
             'Wochenübersicht der Dienste'}
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'week'
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Woche
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 text-sm font-medium border-l-0 border ${
                viewMode === 'month'
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Monat
            </button>
            {canManageShifts(userRole) && (
              <button
                type="button"
                onClick={() => setViewMode('assignment')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                  viewMode === 'assignment'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Zuweisen
              </button>
            )}
          </div>
          
          {viewMode !== 'assignment' && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {viewMode === 'month' ? 'Vorheriger Monat' : 'Vorherige Woche'}
            </button>
          )}
          {viewMode !== 'assignment' && (
            <button
              type="button"
              onClick={() => setSelectedDate(new Date())}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Heute
            </button>
          )}
          {viewMode !== 'assignment' && (
            <button
              type="button"
              onClick={() => navigate(1)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {viewMode === 'month' ? 'Nächster Monat' : 'Nächste Woche'}
            </button>
          )}
          {canManageShifts(userRole) && (
            <button
              type="button"
              onClick={handleCreateShift}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-[var(--color-primary)] hover:opacity-90"
            >
              Dienst erstellen
            </button>
          )}
          {canManageShifts(userRole) && state.undoState && (
            <button
              type="button"
              onClick={() => undoLastShiftUpdate()}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              title="Rückgängig (Strg+Z)"
            >
              ↶ Rückgängig
            </button>
          )}
        </div>
      </div>

      {viewMode === 'assignment' ? (
        // Assignment View
        <div className="bg-white shadow rounded-lg h-[calc(100vh-12rem)]">
          <AssignmentDragDrop />
        </div>
      ) : viewMode === 'week' ? (
        // Week View
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
                  <div 
                    key={dayIdx} 
                    className={`relative border-r border-gray-100 ${
                      dragOverDay && dragOverDay.getTime() === dayDate.getTime() 
                        ? 'bg-blue-50' 
                        : ''
                    }`}
                    style={{ height: DAY_HEIGHT }}
                    onDragOver={(e) => handleDayDragOver(e, dayDate)}
                    onDragLeave={handleDayDragLeave}
                    onDrop={(e) => handleDayDrop(e, dayDate)}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map((_, i) => (
                      <div key={i} className="absolute left-0 w-full h-px bg-gray-100" style={{ top: i * PX_PER_HOUR }} />
                    ))}
                    
                    {/* Drag preview indicator */}
                    {dragOverDay && dragOverDay.getTime() === dayDate.getTime() && dragOverTime && (
                      <div 
                        className="absolute left-0 right-0 h-1 bg-blue-400 opacity-75 z-10"
                        style={{ 
                          top: (parseInt(dragOverTime.split(':')[0]) * 60 + parseInt(dragOverTime.split(':')[1])) / DAY_MINUTES * DAY_HEIGHT 
                        }}
                      />
                    )}
                    
                    {dayShifts.map(shift => {
                      const span = getShiftSpanForDay(shift, dayDate)
                      if (!span) return null
                      return (
                        <div
                          key={`${shift.id}_${dayIdx}`}
                          className={`absolute mx-1 rounded-md text-white text-[10px] px-1 py-0.5 cursor-move shadow-sm hover:shadow-md transition-shadow ${
                            shift.assignedTo 
                              ? 'bg-[var(--color-primary)]/90 hover:bg-[var(--color-primary)]' 
                              : 'bg-yellow-500/90 hover:bg-yellow-500'
                          } ${draggedShift?.id === shift.id ? 'opacity-50' : ''}`}
                          style={{ top: span.top, height: span.height }}
                          draggable={canManageShifts(userRole)}
                          onDragStart={(e) => handleShiftDragStart(e, shift)}
                          onDragEnd={handleShiftDragEnd}
                          onClick={() => handleShiftClick(shift)}
                          title={`${shift.type || shift.name} ${shift.start}-${shift.end}${canManageShifts(userRole) ? ' (Ziehen zum Verschieben)' : ''}`}
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
      ) : (
        // Month View
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Month Header */}
          <div className="bg-gray-100 border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-center">
              {selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {DAYS.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                {day.slice(0, 2)}
              </div>
            ))}
          </div>
          
          {/* Month Grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, index) => (
              <CalendarCell
                key={index}
                day={day}
                onDayClick={handleDayClick}
                onShiftClick={handleShiftClick}
              />
            ))}
          </div>
        </div>
      )}

      {viewMode !== 'assignment' && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            {viewMode === 'month' ? 'Dieser Monat' : 'Diese Woche'}
          </h2>
          <_ShiftTable shifts={viewMode === 'month' ? 
            state.shifts.filter(s => {
              const shiftDate = new Date(s.date)
              return shiftDate.getMonth() === selectedDate.getMonth() && 
                     shiftDate.getFullYear() === selectedDate.getFullYear()
            }) : 
            weekShifts
          } />
        </div>
      )}
      
      <CreateShiftModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} defaultDate={selectedDate} />
      
      <ShiftDetailsModal
        shift={selectedShift}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onApply={handleApplyToShift}
        onAssign={handleAssignShift}
        currentUser={auth?.user}
        userRole={userRole}
      />
    </div>
  );
}
