import { createContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { generateShiftTemplates } from '../utils/shifts'
import { SHIFT_STATUS } from '../utils/constants'
import { useShiftTemplates } from './ShiftTemplateContext'
import { initialState, shiftReducer, normalizeGeneratedShifts } from './ShiftContextCore'
import { checkShiftConflicts } from '../utils/shifts'

const ShiftContext = createContext(null)

export function ShiftProvider({ children }) {
  const tplContext = useShiftTemplates() || {}
  const memoTemplates = useMemo(() => tplContext.templates || [], [tplContext.templates])

  const [state, dispatch] = useReducer(shiftReducer, initialState)

  useEffect(() => {
    const pShifts = localStorage.getItem('shifts')
    const pApps = localStorage.getItem('applications')
    const pNotes = localStorage.getItem('notifications')
    let loadedShifts = []
    if (pShifts) {
      try { loadedShifts = JSON.parse(pShifts) } catch { /* ignore */ }
    }
    if (!loadedShifts.length) {
      const base = generateShiftTemplates(new Date())
      loadedShifts = normalizeGeneratedShifts(base)
    }
    // initial conflict calc (no applications yet)
    loadedShifts = loadedShifts.map(s => ({ ...s, conflicts: checkShiftConflicts(s, loadedShifts.filter(o => o.id !== s.id), []) }))
    dispatch({ type: 'INIT_SHIFTS', payload: loadedShifts })
    if (pApps) {
      try { dispatch({ type: 'INIT_APPLICATIONS', payload: JSON.parse(pApps) }) } catch { /* ignore */ }
    }
    if (pNotes) {
      try { dispatch({ type: 'INIT_NOTIFICATIONS', payload: JSON.parse(pNotes) }) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (state.shifts.length) localStorage.setItem('shifts', JSON.stringify(state.shifts))
  }, [state.shifts])
  useEffect(() => { localStorage.setItem('applications', JSON.stringify(state.applications)) }, [state.applications])
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(state.notifications)) }, [state.notifications])

  useEffect(() => {
    if (!memoTemplates.length) return
    const today = new Date()
    const additions = []
    for (let i = 0; i < 10; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const iso = date.toISOString().slice(0, 10)
      memoTemplates.forEach(t => {
        if (t.days?.length) {
          const weekdayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
          const code = weekdayMap[date.getDay()]
          if (!t.days.includes(code)) return
        }
        const id = `${iso}_${t.name}`
        if (!state.shifts.find(s => s.id === id)) {
          additions.push({
            id,
            date,
            type: t.name,
            start: t.startTime,
            end: t.endTime,
            status: SHIFT_STATUS.OPEN,
            assignedTo: null,
            workLocation: 'office',
            conflicts: [],
          })
        }
      })
    }
    if (additions.length) {
      // compute conflicts for new additions only vs existing + new additions
      const combined = [...state.shifts, ...additions]
      const enriched = additions.map(s => ({
        ...s,
        conflicts: checkShiftConflicts(s, combined.filter(o => o.id !== s.id), state.applications)
      }))
      enriched.forEach(s => dispatch({ type: 'ADD_SHIFT', payload: s }))
    }
  }, [memoTemplates, state.shifts, state.applications])

  const applyToShift = useCallback((shiftId, userId) => {
    const app = { id: `${shiftId}_${userId}`, shiftId, userId, ts: Date.now() }
    dispatch({ type: 'ADD_APPLICATION', payload: app })
    // Recalculate conflicts for that shift
    const target = state.shifts.find(s => s.id === shiftId)
    if (target) {
      const updated = { ...target, conflicts: checkShiftConflicts(target, state.shifts.filter(o => o.id !== target.id), [...state.applications, app]) }
      dispatch({ type: 'UPDATE_SHIFT', payload: updated })
    }
  }, [state.shifts, state.applications])

  const applyToSeries = useCallback((shiftIds, userId) => {
    const apps = shiftIds.map(id => ({ id: `${id}_${userId}`, shiftId: id, userId, ts: Date.now() }))
    dispatch({ type: 'ADD_SERIES_APPLICATION', payload: apps })
    // Bulk conflict recompute for involved shifts
    shiftIds.forEach(id => {
      const target = state.shifts.find(s => s.id === id)
      if (target) {
        const updated = { ...target, conflicts: checkShiftConflicts(target, state.shifts.filter(o => o.id !== target.id), [...state.applications, ...apps]) }
        dispatch({ type: 'UPDATE_SHIFT', payload: updated })
      }
    })
  }, [state.shifts, state.applications])

  const updateShiftStatus = useCallback((shiftId, status) => {
    const shift = state.shifts.find(s => s.id === shiftId)
    if (shift) {
      const updated = { ...shift, status }
      updated.conflicts = checkShiftConflicts(updated, state.shifts.filter(o => o.id !== updated.id), state.applications)
      dispatch({ type: 'UPDATE_SHIFT', payload: updated })
    }
  }, [state.shifts, state.applications])

  const assignShift = useCallback((shiftId, user) => {
    dispatch({ type: 'ASSIGN_SHIFT', payload: { id: shiftId, user } })
    const target = state.shifts.find(s => s.id === shiftId)
    if (target) {
      const updated = { ...target, status: SHIFT_STATUS.ASSIGNED, assignedTo: user }
      updated.conflicts = checkShiftConflicts(updated, state.shifts.filter(o => o.id !== updated.id), state.applications)
      dispatch({ type: 'UPDATE_SHIFT', payload: updated })
      dispatch({ type: 'ADD_NOTIFICATION', payload: { id: `${shiftId}_${Date.now()}`, title: 'Shift assigned', message: `${user} wurde Dienst zugewiesen`, timestamp: new Date().toLocaleString(), isRead: false } })
    }
  }, [state.shifts, state.applications])

  const markNotificationRead = useCallback((id) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }), [])
  const markAllNotificationsRead = useCallback(() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' }), [])

  const value = useMemo(() => ({
    state,
    shifts: state.shifts,
    dispatch,
    applyToShift,
    applyToSeries,
    updateShiftStatus,
    assignShift,
    markNotificationRead,
    markAllNotificationsRead,
  getOpenShifts: () => state.shifts.filter(s => s.status === SHIFT_STATUS.OPEN),
  getConflictedShifts: () => state.shifts.filter(s => s.conflicts?.length),
  }), [state, applyToShift, applyToSeries, updateShiftStatus, assignShift, markNotificationRead, markAllNotificationsRead])

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
}

export { ShiftContext }
