import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useShifts } from '../contexts/useShifts'
import AuthContext from '../contexts/AuthContext'
import { SHIFT_STATUS, WORK_LOCATIONS } from '../utils/constants'
import { canManageShifts } from '../utils/auth'

// Sample disponenten data - in a real app this would come from a context or API
const SAMPLE_DISPONENTEN = [
  { id: 'disp_1', name: 'Anna Schmidt', role: 'analyst', availability: 'available', email: 'anna.schmidt@example.com' },
  { id: 'disp_2', name: 'Max Weber', role: 'manager', availability: 'available', email: 'max.weber@example.com' },
  { id: 'disp_3', name: 'Lisa Müller', role: 'analyst', availability: 'busy', email: 'lisa.mueller@example.com' },
  { id: 'disp_4', name: 'Tom Fischer', role: 'senior', availability: 'available', email: 'tom.fischer@example.com' },
  { id: 'disp_5', name: 'Sara Klein', role: 'analyst', availability: 'available', email: 'sara.klein@example.com' },
]

const ROLE_OPTIONS = ['all', 'analyst', 'manager', 'senior']
const AVAILABILITY_OPTIONS = ['all', 'available', 'busy']

export default function AssignmentDragDrop() {
  const { state, assignShift } = useShifts()
  const [draggedShift, setDraggedShift] = useState(null)
  const [draggedOver, setDraggedOver] = useState(null)
  const [selectedShifts, setSelectedShifts] = useState(new Set())
  const [roleFilter, setRoleFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [focusedShift, setFocusedShift] = useState(null)
  const [focusedDisponent, setFocusedDisponent] = useState(null)
  
  const shiftsRef = useRef(null)
  const disponentiRef = useRef(null)

  // Filter unassigned shifts
  const unassignedShifts = useMemo(() => 
    state.shifts.filter(shift => shift.status === SHIFT_STATUS.OPEN || !shift.assignedTo),
    [state.shifts]
  )

  // Filter disponenten based on filters
  const filteredDisponenten = useMemo(() => 
    SAMPLE_DISPONENTEN.filter(disp => {
      if (roleFilter !== 'all' && disp.role !== roleFilter) return false
      if (availabilityFilter !== 'all' && disp.availability !== availabilityFilter) return false
      return true
    }),
    [roleFilter, availabilityFilter]
  )

  // Drag handlers for shifts
  const handleShiftDragStart = useCallback((e, shift) => {
    setDraggedShift(shift)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', shift.id)
    
    // Visual feedback
    e.target.style.opacity = '0.5'
  }, [])

  const handleShiftDragEnd = useCallback((e) => {
    setDraggedShift(null)
    setDraggedOver(null)
    e.target.style.opacity = '1'
  }, [])

  // Drop handlers for disponenten
  const handleDisponentDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDisponentDragEnter = useCallback((e, disp) => {
    e.preventDefault()
    setDraggedOver(disp.id)
  }, [])

  const handleDisponentDragLeave = useCallback((e) => {
    // Only clear if leaving the actual drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(null)
    }
  }, [])

  const handleDisponentDrop = useCallback((e, disp) => {
    e.preventDefault()
    setDraggedOver(null)
    
    const shiftId = e.dataTransfer.getData('text/plain')
    if (shiftId && draggedShift) {
      assignShift(shiftId, disp.name)
      setDraggedShift(null)
    }
  }, [draggedShift, assignShift])

  // Keyboard navigation
  const handleShiftKeyDown = useCallback((e, shift) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (selectedShifts.has(shift.id)) {
          setSelectedShifts(prev => {
            const next = new Set(prev)
            next.delete(shift.id)
            return next
          })
        } else {
          setSelectedShifts(prev => new Set([...prev, shift.id]))
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        // Focus next shift
        break
      case 'ArrowUp':
        e.preventDefault()
        // Focus previous shift
        break
      default:
        break
    }
  }, [selectedShifts])

  const handleDisponentKeyDown = useCallback((e, disp) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (selectedShifts.size > 0) {
          // Bulk assign selected shifts to this disponent
          selectedShifts.forEach(shiftId => {
            assignShift(shiftId, disp.name)
          })
          setSelectedShifts(new Set())
        }
        break
      default:
        break
    }
  }, [selectedShifts, assignShift])

  // Bulk operations
  const handleSelectAll = useCallback(() => {
    setSelectedShifts(new Set(unassignedShifts.map(s => s.id)))
  }, [unassignedShifts])

  const handleDeselectAll = useCallback(() => {
    setSelectedShifts(new Set())
  }, [])

  const handleBulkAssign = useCallback((disponentName) => {
    selectedShifts.forEach(shiftId => {
      assignShift(shiftId, disponentName)
    })
    setSelectedShifts(new Set())
  }, [selectedShifts, assignShift])

  return (
    <div className="h-full flex bg-white">
      {/* Left Panel - Unassigned Shifts */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Unassigned Shifts ({unassignedShifts.length})
          </h2>
          
          {/* Bulk actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={unassignedShifts.length === 0}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-sm text-gray-600 hover:text-gray-800"
              disabled={selectedShifts.size === 0}
            >
              Deselect All
            </button>
            {selectedShifts.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedShifts.size} selected
              </span>
            )}
          </div>
        </div>
        
        <div 
          ref={shiftsRef}
          className="flex-1 overflow-y-auto p-4"
          role="listbox"
          aria-label="Unassigned shifts"
          tabIndex={0}
        >
          {unassignedShifts.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No unassigned shifts
            </div>
          ) : (
            <div className="space-y-2">
              {unassignedShifts.map((shift) => (
                <div
                  key={shift.id}
                  draggable
                  onDragStart={(e) => handleShiftDragStart(e, shift)}
                  onDragEnd={handleShiftDragEnd}
                  onKeyDown={(e) => handleShiftKeyDown(e, shift)}
                  tabIndex={0}
                  role="option"
                  aria-selected={selectedShifts.has(shift.id)}
                  aria-describedby={`shift-${shift.id}-description`}
                  className={`
                    p-3 border rounded-lg cursor-move transition-all
                    ${selectedShifts.has(shift.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${focusedShift === shift.id ? 'ring-2 ring-blue-500' : ''}
                    hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  onClick={() => {
                    if (selectedShifts.has(shift.id)) {
                      setSelectedShifts(prev => {
                        const next = new Set(prev)
                        next.delete(shift.id)
                        return next
                      })
                    } else {
                      setSelectedShifts(prev => new Set([...prev, shift.id]))
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {shift.type || shift.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shift.date} • {shift.start}-{shift.end}
                      </div>
                      {shift.workLocation && (
                        <div className="text-xs text-gray-400">
                          📍 {WORK_LOCATIONS[shift.workLocation] || shift.workLocation}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {selectedShifts.has(shift.id) && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div id={`shift-${shift.id}-description`} className="sr-only">
                    Shift {shift.type || shift.name} on {shift.date} from {shift.start} to {shift.end}
                    {shift.workLocation && ` at ${WORK_LOCATIONS[shift.workLocation] || shift.workLocation}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Disponenten */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Disponenten ({filteredDisponenten.length})
          </h2>
          
          {/* Filters */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="availability-filter" className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <select
                id="availability-filter"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {AVAILABILITY_OPTIONS.map(avail => (
                  <option key={avail} value={avail}>
                    {avail === 'all' ? 'All' : avail.charAt(0).toUpperCase() + avail.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div 
          ref={disponentiRef}
          className="flex-1 overflow-y-auto p-4"
          role="listbox"
          aria-label="Available disponenten"
          tabIndex={0}
        >
          {filteredDisponenten.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No disponenten match the current filters
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDisponenten.map((disp) => (
                <div
                  key={disp.id}
                  onDragOver={handleDisponentDragOver}
                  onDragEnter={(e) => handleDisponentDragEnter(e, disp)}
                  onDragLeave={handleDisponentDragLeave}
                  onDrop={(e) => handleDisponentDrop(e, disp)}
                  onKeyDown={(e) => handleDisponentKeyDown(e, disp)}
                  tabIndex={0}
                  role="option"
                  aria-describedby={`disp-${disp.id}-description`}
                  className={`
                    p-3 border rounded-lg transition-all cursor-pointer
                    ${draggedOver === disp.id 
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${focusedDisponent === disp.id ? 'ring-2 ring-blue-500' : ''}
                    hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  onClick={() => {
                    if (selectedShifts.size > 0) {
                      handleBulkAssign(disp.name)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {disp.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {disp.role.charAt(0).toUpperCase() + disp.role.slice(1)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {disp.email}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`
                          w-2 h-2 rounded-full
                          ${disp.availability === 'available' ? 'bg-green-400' : 'bg-yellow-400'}
                        `}
                        aria-label={`Status: ${disp.availability}`}
                      />
                      {selectedShifts.size > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBulkAssign(disp.name)
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                          aria-label={`Assign ${selectedShifts.size} selected shifts to ${disp.name}`}
                        >
                          Assign {selectedShifts.size}
                        </button>
                      )}
                    </div>
                  </div>
                  <div id={`disp-${disp.id}-description`} className="sr-only">
                    {disp.name}, {disp.role}, {disp.availability}. 
                    {selectedShifts.size > 0 && ` Press Enter to assign ${selectedShifts.size} selected shifts.`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}